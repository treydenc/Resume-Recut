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
| `cv.html` | The renderer. Open it in a browser. That's the whole toolchain. |
| `cv-print.css` | The print stylesheet. Paged.js uses it to make a real PDF. |

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

1. Clone this repo.
2. Open `cv.html` in a browser. You'll see the example resume.
3. Replace `cv-data.js` with your own history.
4. Copy `cv-variants/engineering.js` to start a cut of your own.
5. Hit **Save PDF**. Paged.js paginates it properly — running headers, folios,
   no orphaned section headings — and names the file
   `Resume_Your_Name_role_2026-01-30.pdf`.

No install. No build. No account.

### Editing it with an AI

The data file *is* the interface. That's deliberate — a language model edits a
well-commented data file far more reliably than it operates someone's GUI.

> "Read `ABOUT.md`, then reformat my attached resume into `cv-data.js`."

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
