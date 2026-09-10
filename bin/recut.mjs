#!/usr/bin/env node
/* recut — local server tier.
 *
 *   npx recut            serve the current folder and open it
 *   npx recut --dir ..   serve somewhere else
 *   npx recut --port 5000
 *   npx recut --no-open
 *
 * Two jobs. It serves cv.html over http://127.0.0.1 (so nothing is fighting the
 * file:// sandbox), and it exposes a very small write API so "+ New cut" and
 * "Remove cut" can actually touch the disk instead of handing you instructions.
 *
 * Zero dependencies on purpose: `npx recut` should start in under a second, and a
 * tool that writes files in your folder should be short enough to read in full.
 * It binds to loopback only and refuses to touch anything outside the served folder.
 */

import { createServer } from "node:http";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, relative, extname, isAbsolute } from "node:path";
import { spawn } from "node:child_process";
import { argv, cwd, exit, platform } from "node:process";

const DIM = "\x1b[2m", GREEN = "\x1b[32m", RED = "\x1b[31m", OFF = "\x1b[0m";

/* ── args ──────────────────────────────────────────────────────────────────── */
function arg(name, fallback) {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}
const ROOT = resolve(arg("dir", cwd()));
const START_PORT = parseInt(arg("port", "4321"), 10);
const OPEN = !argv.includes("--no-open");

if (!existsSync(join(ROOT, "cv.html"))) {
  console.error(`${RED}No cv.html in ${ROOT}${OFF}\n` +
    `Run this from your recut folder, or pass --dir <path>.`);
  exit(1);
}

/* ── guard rails ───────────────────────────────────────────────────────────── */
const KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Resolve a client-supplied relative path, refusing anything outside ROOT. */
function safePath(rel) {
  if (typeof rel !== "string" || !rel || isAbsolute(rel)) return null;
  const abs = resolve(ROOT, rel);
  const inside = relative(ROOT, abs);
  if (inside.startsWith("..")) return null;
  return abs;
}

/* ── manifest surgery ──────────────────────────────────────────────────────────
   Edits the `variantManifest: [...]` line in place rather than rewriting the data
   file, so comments, formatting and line endings all survive untouched. */
async function editManifest(dataFile, fn) {
  const abs = safePath(dataFile || "cv-data.js");
  if (!abs || !existsSync(abs)) throw new Error(`Can't find data file: ${dataFile}`);
  const text = await readFile(abs, "utf8");
  const m = text.match(/variantManifest\s*:\s*\[([^\]]*)\]/);
  if (!m) throw new Error("No variantManifest found in " + dataFile);
  const keys = [...m[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((x) => x[1] || x[2]);
  const next = fn(keys.slice());
  const body = next.map((k) => `"${k}"`).join(", ");
  const updated = text.slice(0, m.index) +
    m[0].replace(/\[[^\]]*\]/, "[" + body + "]") +
    text.slice(m.index + m[0].length);
  await writeFile(abs, updated);
  return next;
}

function starterVariant(key, label) {
  return `/* Cut: ${key}
   What is this cut arguing? One line, so future-you remembers.
   Preview: cv.html?role=${key} */
window.CV.variants["${key}"] = {
  group: "Roles",
  label: "${label || key}",
  tagline: "",                 // leave empty to keep the one in cv-data.js
  cover: "banner",

  tracks: [],                  // which kinds of entry qualify. Empty = all of them.
  exclude: [],                 // entry ids to drop regardless of tracks
  hide: [],                    // whole section titles to drop
  order: [],                   // section titles in order (ORIGINAL titles — rename runs after)
  rename: {},

  overrides: {
    // "entry-id": { bullets: ["Rewritten for this application only."] },
  },
};
`;
}

/* ── api ───────────────────────────────────────────────────────────────────── */
function json(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(body);
}

function readBody(req) {
  return new Promise((ok, bad) => {
    let s = "";
    req.on("data", (c) => { s += c; if (s.length > 1e6) req.destroy(); });
    req.on("end", () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { bad(e); } });
    req.on("error", bad);
  });
}

async function api(req, res, url) {
  if (url.pathname === "/api/ping") {
    return json(res, 200, { ok: true, dir: ROOT });
  }

  if (url.pathname === "/api/cut" && req.method === "POST") {
    const b = await readBody(req);
    const key = String(b.key || "").trim();
    if (!KEY_RE.test(key)) return json(res, 400, { error: "Bad cut name. Use lowercase letters, numbers and dashes." });

    const dir = safePath(b.variantsDir || "cv-variants/");
    if (!dir) return json(res, 400, { error: "Bad variants directory." });
    const file = join(dir, key + ".js");
    if (existsSync(file)) return json(res, 409, { error: `cv-variants/${key}.js already exists.` });

    await writeFile(file, b.content || starterVariant(key, b.label));
    const keys = await editManifest(b.dataFile, (ks) => (ks.includes(key) ? ks : ks.concat(key)));
    console.log(`${GREEN}  +${OFF} ${relative(ROOT, file)}  ${DIM}manifest: ${keys.length} cuts${OFF}`);
    return json(res, 200, { ok: true, key });
  }

  if (url.pathname === "/api/cut" && req.method === "DELETE") {
    const key = String(url.searchParams.get("key") || "").trim();
    if (!KEY_RE.test(key)) return json(res, 400, { error: "Bad cut name." });

    const dir = safePath(url.searchParams.get("variantsDir") || "cv-variants/");
    if (!dir) return json(res, 400, { error: "Bad variants directory." });

    try { await unlink(join(dir, key + ".js")); } catch (e) { if (e.code !== "ENOENT") throw e; }
    await editManifest(url.searchParams.get("dataFile"), (ks) => ks.filter((k) => k !== key));
    console.log(`${RED}  −${OFF} ${relative(ROOT, join(dir, key + ".js"))}`);
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: "Unknown endpoint" });
}

/* ── static ────────────────────────────────────────────────────────────────── */
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".mp4": "video/mp4", ".pdf": "application/pdf",
};

async function static_(res, pathname) {
  let rel = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (rel === "") rel = "cv.html";
  const abs = safePath(rel);
  if (!abs || !existsSync(abs)) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("Not found: " + rel);
  }
  const data = await readFile(abs);
  res.writeHead(200, { "content-type": MIME[extname(abs).toLowerCase()] || "application/octet-stream",
                       "cache-control": "no-store" });
  res.end(data);
}

/* ── serve ─────────────────────────────────────────────────────────────────── */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    await static_(res, url.pathname);
  } catch (e) {
    console.error(e);
    json(res, 500, { error: String(e.message || e) });
  }
});

function listen(port, attempt = 0) {
  server.once("error", (e) => {
    if (e.code === "EADDRINUSE" && attempt < 12) return listen(port + 1, attempt + 1);
    console.error(`${RED}${e.message}${OFF}`);
    exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}/cv.html`;
    console.log(`\n${DIM}recut${OFF}  serving ${DIM}${ROOT}${OFF}\n      ${url}\n` +
                `${DIM}      writes enabled — "+ New cut" and "Remove cut" edit real files${OFF}\n` +
                `${DIM}      ctrl-c to stop${OFF}\n`);
    if (OPEN) {
      const cmd = platform === "win32" ? "start" : platform === "darwin" ? "open" : "xdg-open";
      try { spawn(cmd, [url], { shell: platform === "win32", stdio: "ignore", detached: true }).unref(); } catch (e) {}
    }
  });
}
listen(START_PORT);
