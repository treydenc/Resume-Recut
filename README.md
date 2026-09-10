# recut

**One resume. Many true versions of you. No build step.**

Burnett and Evans ask you to draft three Odyssey Plans — three different five-year
lives, each one real, each one yours. Your resume has the same problem: you are not
one candidate. You are a plausible product designer *and* a plausible design engineer
*and* a plausible researcher, and the honest version of you changes depending on who
is reading.

Most resume tools make you keep four Google Docs in sync. `recut` keeps one source of
truth and lets you draw a different true version from it for every application.

```
cv.html                    the full resume
cv.html?role=product       the product cut
cv.html?role=engineering   the engineering cut
```

Same data. Different argument.

---

## How it works

Three files and a folder:

| File | What it holds |
|---|---|
| `cv-data.js` | Everything you have ever done. One entry per job, project, degree, award. |
| `cv-variants/*.js` | One file per application. Which entries appear, what they say, what order. |
| `cv.html` | The renderer, the styles, and the PDF export. Double-click it. That's the toolchain. |

A variant never copies your content — it *filters and overrides* it. A cut is usually
twenty lines:

```js
window.CV.variants.product = {
  label: "Product Designer",
  tagline: "Product Design × Interaction × Prototyping",
  tracks: ["design", "product", "research"],   // which entries qualify
  exclude: ["side-project-nobody-asked-about"],
  hide: ["Publications", "Awards"],            // whole sections
  order: ["Selected Projects", "Experience", "Skills", "Education"],
  rename: { "Selected Work": "Selected Projects" },
  overrides: {
    "job-acme": {
      bullets: [
        "Rewritten for this application only.",
        "The base data file never changes.",
      ],
    },
  },
};
```

Add a cut = create one file, add one line to `variantManifest` in `cv-data.js`.
A broken variant only breaks that cut; the full resume still renders.

## Quickstart

**No terminal required.** If you've never run a command in your life, you can still use
this.

**1. Download it.** Click the green **Code** button at the top of this page →
**Download ZIP** → unzip it anywhere.

**2. Double-click `cv.html`.** It opens in your browser. That's the whole install.

You're looking at the example resume for "Jordan Rivera." Now change the address bar
ending to see the same person argued three ways:

```
cv.html?role=engineering
cv.html?role=product
cv.html?role=research
```

Look at the "Atlas" project in the first two. Same entry, same facts, different case.

**3. Put your own history in.** Open `cv-data.js` in any text editor and replace the
example entries with yours. It's a plain list — name, jobs, projects, schools — with
comments explaining each part.

Easier: give an AI assistant your current resume and this instruction —

> "Read `AGENTS.md` in this folder, then rewrite `cv-data.js` using my attached resume.
> Don't invent anything."

Save, refresh the browser, and it's your resume.

**4. Make a cut for a specific job.** Duplicate one of the files in `cv-variants/`,
rename it (say `acme.js`), and add its name to the `variantManifest` line near the
bottom of `cv-data.js`. Then visit `cv.html?role=acme`.

Or paste a job posting to your AI assistant:

> "Make a new variant called `acme` for this job posting. Follow the rules in
> `AGENTS.md`. Keep it to two pages."

**5. Save the PDF.** Click **Save PDF** on the page, then choose "Save as PDF" in the
print dialog. You get real pages — running headers, page numbers, no section heading
stranded at the bottom of a page — and the file names itself
`Resume_Your_Name_acme_2026-01-30.pdf`.

That's it. No account, no install, no build step, no framework.

### Keeping your real résumé out of the repo

If you fork this, or you're using it while job hunting, you don't want your phone number
and a folder named after every company you're applying to sitting in a public repo.

So `cv.html` prefers **`cv-data.local.js`** if it exists, and falls back to the example
`cv-data.js` if it doesn't. Both that file and **`cv-variants/local/`** are already in
`.gitignore`.

```
cv-data.local.js       your actual résumé          (git ignores it)
cv-variants/local/     your actual cuts            (git ignores it)
cv-data.js             the example everyone clones (committed)
cv-variants/*.js       the example cuts            (committed)
```

Point `variantsDir` at your local folder inside `cv-data.local.js`:

```js
variantsDir: "cv-variants/local/",
```

Nothing else changes — double-clicking `cv.html` finds your data automatically, and a
stranger who clones the repo sees the example. `?data=other-file.js` overrides both.

### Optional: one command, and the buttons write real files

If you have Node, run this from the folder instead of double-clicking:

```
npx recut
```

It serves the page at `http://127.0.0.1:4321/cv.html` and opens it. Everything looks the
same, except **+ New cut** now writes `cv-variants/<name>.js` and adds it to
`variantManifest` for you, and **Remove this cut** actually deletes it. No install, no
build — the server is one dependency-free file you can read in a sitting, it binds to
loopback only, and it refuses to touch anything outside the folder you served.

Without it, those buttons still work — they just hand you the starter file and the AI
prompt instead of writing to disk.

```
npx recut --dir ../somewhere   serve a different folder
npx recut --port 5000
npx recut --no-open
```

### Optional: check what a robot sees

If you're comfortable with a terminal, this reads your exported PDF the way an applicant
tracking system does and tells you what's broken:

```
npm install
npm run ats-check ~/Downloads/Resume_Your_Name_2026-01-30.pdf
```

Skip it if that means nothing to you — the resume works either way.

### Editing it with an AI

The data file *is* the interface. That's deliberate — a language model edits a
well-commented data file far more reliably than it operates someone's GUI.

`AGENTS.md` in the repo root is the operating manual: the data model, the variant keys,
the PDF gotchas, and a set of honesty rules the assistant is told to hold to (never
invent a metric, never change a date, omit rather than misdate). Claude Code, Cursor and
Codex pick that file up automatically; anywhere else, point at it.

> "Read `AGENTS.md`, then reformat my attached resume into `cv-data.js`."

> "Make a new variant called `meta` for this job posting. Cut anything that reads
> academic, lead with the interaction work, and keep it to two pages."

## Why not just use a template?

Because designed resumes quietly break in ways you cannot see.

Chrome renders a CSS `text-shadow` by painting the glyphs **twice**, so a styled
contact block can land in the PDF's text layer as:

```
EMAILEMAIL you@example.comyou@example.com
```

An applicant tracking system reads that as an invalid address. You would never know:
it looks perfect on screen and perfect on paper. It is only visible if you extract the
text layer of the exported PDF.

So this repo ships a linter:

```
npm install
npm run ats-check ~/Downloads/Resume_Your_Name_2026-01-30.pdf
```

It reports what a parser actually sees — duplicated text runs, whether your contact
block appears first or last, glued-together names, which section headings are
recognizable, and whether your portfolio links survived as real annotations.

Designed **and** parseable. Most resumes are one or the other.

## What's already handled

Small things that took a long time to find:

- `text-shadow` disabled in print, so text isn't duplicated in the PDF layer
- a non-breaking space between name lines, so it doesn't extract as `JaneDoe`
- section headings glued to their first entry, because Paged.js ignores
  `break-after: avoid`
- exports named `Resume_Name_role_date` instead of `document (3).pdf`
- links preserved as real PDF annotations

## License

MIT. Take it, fork it, put your own life in it.
