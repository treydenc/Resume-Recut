#!/usr/bin/env node
/* contrast-check.mjs — reads the token block in cv.html and measures every
 * text/background pair in the UI chrome against WCAG AA.
 *
 * Why this exists: the chrome uses translucent surfaces over backdrops it does
 * not control, and a multi-hue gradient on top of them. A ratio you eyeball in a
 * colour picker is a ratio at one point of one gradient over one backdrop. This
 * composites every layer and checks EVERY point that can actually occur — each
 * gradient stop, over the lightest and darkest backdrop the surface can sit on.
 *
 * Thresholds: 4.5:1 for text (WCAG 1.4.3 AA), 3:1 for UI component boundaries
 * and focus indicators (1.4.11). Run it after touching any token.
 *
 *   node tools/contrast-check.mjs          (or: npm run contrast-check)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'cv.html'), 'utf8');

/* ── token parsing ────────────────────────────────────────────────────────── */
const hex = (h) => {
  const v = h.replace('#', '');
  const f = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const tok = {};
for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))\s*;/g)) {
  if (tok[m[1]] === undefined) tok[m[1]] = m[2];   // first declaration wins (:root)
}
const themeTok = (cls) => {
  const m = css.match(new RegExp('body\\.' + cls + '\\{([^}]*)\\}'));
  const out = {};
  if (m) for (const d of m[1].matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g)) out[d[1]] = d[2];
  return out;
};

/* a layer is [r,g,b,a] */
const layer = (v) => {
  if (v.startsWith('#')) return [...hex(v), 1];
  const n = v.match(/[\d.]+/g).map(Number);
  return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
};
const stops = (name) => {
  const m = css.match(new RegExp('--' + name + ':linear-gradient\\(([\\s\\S]*?)\\);'));
  if (!m) throw new Error('no gradient --' + name);
  return [...m[1].matchAll(/rgba?\([^)]*\)/g)].map((x) => layer(x[0]));
};

/* ── colour maths ─────────────────────────────────────────────────────────── */
const over = (top, bot) => {           // src-over, bot assumed opaque
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a));
};
const flatten = (layers) => layers.reduce((acc, l) => over(l, acc));
const lum = (rgb) => {
  const c = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/* ── the checks ───────────────────────────────────────────────────────────── */
const BLACK = [0, 0, 0, 1];                       // the hero, behind any chrome
const results = [];
let zone = 'chrome';   // 'chrome' gates the exit code; 'document' only reports
const check = (label, fg, bgLayers, min = 4.5) => {
  const bg = flatten(bgLayers);
  const r = ratio(layer(fg).slice(0, 3), bg);
  results.push({ label, r, min, zone, pass: r >= min });
};
/* run a check once per gradient stop — the amplitude rule: worst end governs */
const checkHaze = (label, fg, base, haze, min = 4.5) => {
  stops(haze).forEach((st, i) =>
    check(`${label} @stop${i + 1}`, fg, [...base, st], min));
};

const T = (k) => tok[k];

/* paper, per theme */
for (const [name, over_] of [['default', {}], ['chanel', themeTok('theme-chanel')], ['warm', themeTok('theme-warm')]]) {
  const paper = layer(over_['paper'] || T('paper'));
  check(`--ink on paper (${name})`, T('ink'), [paper]);
  check(`--ink-dim on paper (${name})`, T('ink-dim'), [paper]);
  check(`--muted border on paper (${name})`, T('muted'), [paper], 3);
  check(`--accent focus ring on paper (${name})`, T('accent'), [paper], 3);
}

/* the cuts rail: opaque ground + haze, then the same lifted by hover/selected */
for (const [name, ov] of [['default', {}], ['chanel', themeTok('theme-chanel')], ['warm', themeTok('theme-warm')]]) {
  const ground = [layer(ov['ground'] || T('ground'))];
  const bright = ov['bright'] || T('bright');
  const dim = ov['dim'] || T('dim');
  checkHaze(`rail --dim on ground+haze (${name})`, dim, ground, 'haze-dark');
  checkHaze(`rail --bright on ground+haze (${name})`, bright, ground, 'haze-dark');
  checkHaze(`rail --bright on hovered row (${name})`, bright, [...ground, layer(T('ground-lift'))], 'haze-dark');
  checkHaze(`rail --bright on selected row (${name})`, bright, [...ground, layer(T('ground-lift-2'))], 'haze-dark');
  checkHaze(`rail mode dot on ground+haze (${name})`, '#6cbf87', ground, 'haze-dark', 3);
}

/* dark glass pills — worst case is a LIGHT backdrop, which lifts the surface */
for (const [bname, bd] of [['over paper', layer(T('paper'))], ['over hero', BLACK]]) {
  checkHaze(`pill text ${bname}`, T('paper'), [bd, layer(T('glass-dark'))], 'haze-dark');
}
checkHaze('pill text, hovered (opaque ink)', T('paper'), [layer(T('ink'))], 'haze-dark');

/* light glass card — worst case is a DARK backdrop, which drops the surface */
for (const [bname, bd] of [['over hero', BLACK], ['over paper', layer(T('paper'))]]) {
  const base = [bd, layer('rgba(17,17,16,.42)'), layer(T('glass-light'))];  // scrim, then card
  checkHaze(`card --ink ${bname}`, T('ink'), base, 'haze-light');
  checkHaze(`card --ink-dim ${bname}`, T('ink-dim'), base, 'haze-light');
  checkHaze(`card input border ${bname}`, T('muted'), base, 'haze-light', 3);
}
check('card input text on #fff', T('ink'), [layer('#fff')]);
check('card input border on #fff', T('muted'), [layer('#fff')], 3);

/* buttons */
checkHaze('dialog primary button', T('paper'), [layer(T('ink'))], 'haze-dark');
checkHaze('first-run button', '#f4f2ea', [layer(T('ink')), layer(T('ground-lift-2'))], 'haze-dark');
check('first-run strip text', '#f4f2ea', [layer(T('ink'))]);

/* reduced-transparency fallbacks */
check('pill text, opaque fallback', T('paper'), [layer(T('ink'))]);
check('card --ink-dim, opaque fallback', T('ink-dim'), [layer(T('paper'))]);

/* ── document zone ────────────────────────────────────────────────────────────
 * Not chrome, and deliberately NOT gating: these predate the glass pass and they
 * reach paper, so changing them changes the printed resume rather than the UI.
 * They are reported so the decision is explicit instead of invisible.
 *   cv.html  footer                    (10.5px, --faint)
 *   cv.html  .entry .desc-list li::marker
 *   print-css  running header + folio  (8px, --faint)
 * The fix, if wanted, is --ink-dim, which clears 4.5:1 on every theme's paper.  */
zone = 'document';
for (const [name, ov] of [['default', {}], ['chanel', themeTok('theme-chanel')], ['warm', themeTok('theme-warm')]]) {
  const paper = layer(ov['paper'] || T('paper'));
  check(`footer + folio --faint on paper (${name})`, T('faint'), [paper]);
  check(`  \u2514 same pair with --ink-dim instead (${name})`, T('ink-dim'), [paper]);
}

/* ── report ───────────────────────────────────────────────────────────────── */
let fails = 0, worst = Infinity, worstLabel = '';
const show = (r) =>
  console.log(`${r.pass ? '  ok ' : 'FAIL '} ${r.r.toFixed(2).padStart(6)}:1  (min ${r.min})  ${r.label}`);

console.log('UI CHROME  \u2014 gating\n');
for (const r of results.filter((x) => x.zone === 'chrome')) {
  if (!r.pass) fails++;
  const slack = r.r - r.min;
  if (slack < worst) { worst = slack; worstLabel = r.label; }
  show(r);
}
const doc = results.filter((x) => x.zone === 'document');
if (doc.length) {
  console.log('\nDOCUMENT  \u2014 pre-existing, reported only (these reach the PDF)\n');
  doc.forEach(show);
}
console.log(`\n${results.length - doc.length} chrome pairs, ${fails} failing.`);
console.log(`tightest chrome margin: ${worstLabel} (+${worst.toFixed(2)} over its floor)`);
process.exit(fails ? 1 : 0);
