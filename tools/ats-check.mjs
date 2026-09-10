#!/usr/bin/env node
/* ats-check — read an exported resume PDF the way a parser does, and report what
   it actually sees.

   A designed resume can look perfect on screen and on paper while emitting garbage
   into the PDF text layer. The one that motivated this script: Chrome paints a CSS
   `text-shadow` by drawing the glyph run TWICE, so a styled contact block extracts as
   "EMAILEMAIL you@example.comyou@example.com" and an applicant tracking system stores
   an invalid address. You cannot see that in a viewer. You can only see it here.

   Usage:  npm run ats-check path/to/Resume.pdf
*/

import { readFile } from "node:fs/promises";
import { argv, exit } from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const GREEN = "\x1b[32m", YELLOW = "\x1b[33m", RED = "\x1b[31m", DIM = "\x1b[2m", OFF = "\x1b[0m";
const pass = (m, d) => console.log(`${GREEN}  PASS${OFF}  ${m}${d ? `\n${DIM}        ${d}${OFF}` : ""}`);
const warn = (m, d) => { warnings++; console.log(`${YELLOW}  WARN${OFF}  ${m}${d ? `\n${DIM}        ${d}${OFF}` : ""}`); };
const fail = (m, d) => { failures++; console.log(`${RED}  FAIL${OFF}  ${m}${d ? `\n${DIM}        ${d}${OFF}` : ""}`); };

let warnings = 0, failures = 0;

const file = argv[2];
if (!file) {
  console.error("usage: npm run ats-check <file.pdf>");
  exit(2);
}

// pdfjs ships an ESM legacy build meant for Node; the worker is disabled below.
let pdfjs;
try {
  pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
} catch {
  console.error("Missing dependency. Run: npm install");
  exit(2);
}
pdfjs.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const data = new Uint8Array(await readFile(file));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

const pages = [];
const links = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const content = await page.getTextContent();
  pages.push(content.items.map((i) => i.str));
  for (const a of await page.getAnnotations()) {
    if (a.subtype === "Link" && a.url) links.push({ page: n, url: a.url });
  }
}

const text = pages.map((items) => items.join("\n")).join("\n\n");
const firstPage = pages[0] ?? [];
const firstPageText = firstPage.join("\n");

console.log(`\n${DIM}ats-check${OFF}  ${file}\n`);

/* 1. length ------------------------------------------------------------------ */
if (doc.numPages <= 2) pass(`${doc.numPages} page${doc.numPages === 1 ? "" : "s"}.`);
else warn(`${doc.numPages} pages.`, "Two is the expectation for most roles. Three needs a reason.");

/* 2. is there a text layer at all? ------------------------------------------- */
if (text.trim().length < 200) {
  fail("Almost no extractable text.", "This may be an image-only PDF. A parser will read nothing.");
} else {
  pass(`${text.replace(/\s+/g, " ").trim().length} characters of extractable text.`);
}

/* 3. duplicated adjacent runs — the text-shadow bug -------------------------- */
const dupes = [];
for (const items of pages) {
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i].trim();
    if (a.length > 2 && a === items[i + 1].trim()) dupes.push(a);
  }
}
if (dupes.length) {
  fail(`${dupes.length} duplicated text run${dupes.length === 1 ? "" : "s"} in the PDF layer.`,
    `e.g. ${[...new Set(dupes)].slice(0, 3).map((d) => JSON.stringify(d)).join(", ")}\n        `
    + "Usually a CSS text-shadow: Chrome paints the glyphs twice. Disable it in print.");
} else {
  pass("No duplicated text runs.");
}

/* 4. contact details --------------------------------------------------------- */
const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
if (!email) {
  fail("No email address found in the text layer.");
} else if (/(.+@.+\..+)\1/.test(email[0])) {
  fail(`Email extracts as ${JSON.stringify(email[0])}.`, "Doubled — see the duplicated-run check above.");
} else {
  const at = firstPageText.indexOf(email[0]);
  const pct = at < 0 ? 100 : Math.round((at / Math.max(firstPageText.length, 1)) * 100);
  if (at < 0) warn(`Email (${email[0]}) does not appear on page 1.`);
  else if (pct > 60) {
    warn(`Email appears ${pct}% of the way through page 1.`,
      "Many parsers look for the contact block near the top. A positioned header can paint after the body text.");
  } else {
    pass(`Email ${email[0]} found ${pct}% into page 1.`);
  }
}

/* 5. glued words — the missing-space-in-a-name bug --------------------------- */
const glued = [...new Set((firstPageText.match(/\b[A-Z][a-z]{2,}[A-Z][a-z]{2,}\b/g) ?? []))];
if (glued.length) {
  warn(`Possible missing spaces: ${glued.slice(0, 4).join(", ")}`,
    "Two lines joined with <br> extract with no separator. Use &nbsp; between them.");
} else {
  pass("No glued-together words detected.");
}

/* 6. section headings a parser can classify ---------------------------------- */
const wanted = ["experience", "education", "skills", "project"];
const found = wanted.filter((w) => new RegExp(`\\b${w}`, "i").test(text));
const missing = wanted.filter((w) => !found.includes(w));
if (missing.length) {
  warn(`Headings not found: ${missing.join(", ")}.`,
    "Parsers classify entries by heading. Creative section names may not map to a field.");
} else {
  pass("Standard section headings present.");
}

/* 7. links ------------------------------------------------------------------- */
if (!links.length) {
  warn("No link annotations.", "Portfolio URLs are unclickable, and some roles require a portfolio link.");
} else {
  pass(`${links.length} live link${links.length === 1 ? "" : "s"}.`,
    links.slice(0, 6).map((l) => `p${l.page} ${l.url}`).join("\n        "));
}

/* ---------------------------------------------------------------------------- */
console.log();
if (failures) console.log(`${RED}${failures} failure(s)${OFF}, ${warnings} warning(s).\n`);
else if (warnings) console.log(`${YELLOW}${warnings} warning(s)${OFF}, no failures.\n`);
else console.log(`${GREEN}All checks passed.${OFF}\n`);
exit(failures ? 1 : 0);
