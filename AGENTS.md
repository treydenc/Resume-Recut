# AGENTS.md — how to work on a `recut` resume

Instructions for an AI assistant editing this repo. Read this before changing anything.

## What this is

A resume that lives in one data file and is rendered into per-application "cuts."
No build step: `cv.html` is opened directly in a browser.

```
cv-data.js         every entry the person has, once. The source of truth.
cv-variants/*.js   one file per application. Filters and rewrites — never new content.
cv.html            the renderer, the screen styles, the print styles, and the PDF export.
tools/ats-check.mjs  reads an exported PDF the way a parser does.
```

## Which files hold the real résumé

`cv.html` loads **`cv-data.local.js`** when it exists and falls back to `cv-data.js`
otherwise. The `.local` file and `cv-variants/local/` are gitignored, because a résumé in
progress contains a phone number and the name of every company the person is applying to.

**So: if `cv-data.local.js` exists, that is the source of truth — edit it, not
`cv-data.js`.** New cuts go in the directory named by its `variantsDir` (usually
`cv-variants/local/`), and their file-stems go in *its* `variantManifest`. Treat the
committed `cv-data.js` and `cv-variants/*.js` as the shipped example: change them only
when the person is working on the tool itself, never when they're working on their résumé.

Never move real content into the committed example files, and never commit the local ones.

The print stylesheet lives **inside `cv.html`**, in a `<script type="text/css" id="print-css">`
the browser never executes. Do not move it back out to a file: Paged.js fetches its
stylesheets, browsers block `fetch()` of local files on `file://` pages, and the whole
point is that a non-technical person can double-click `cv.html` and still get a real PDF.
`printStylesheets()` wraps that CSS in a blob: URL, which is fetchable anywhere.

## The one rule that matters

**A variant never holds content that isn't in `cv-data.js`.** It filters, reorders,
renames, and rewrites existing entries by `id`. If the person did something new, it
goes in `cv-data.js` first, then a variant can foreground it.

Why: variants are disposable, the data file is not. Someone with fifteen cuts should be
able to delete fourteen of them and lose nothing true.

## Data model

Every item in a section carries:

- `id` — stable, kebab-case, never reused. Variants address entries by this.
- `tracks` — what kind of work it is (`design`, `engineering`, `research`, …). A variant
  requests tracks; an item appears if **any** of its tracks match. No `tracks` = always appears.
- `when`, `role`, `desc` — the visible content. `desc` is prose.
- `bullets` — optional array. If present it renders as a list *instead of* `desc`.
- `tags`, `link` — optional.

Section `type` is `entries` (dated blocks), `rows` (compact one-liners: awards, talks,
publications), or `skills` (label/value pairs).

## Variant keys

```js
window.CV.variants.<key> = {
  label, group,        // name and bucket in the left-hand Cuts panel
  tagline, theme, cover, profile, colophon,   // header overrides
  hideHero, hideFooter, hideLinks,
  tracks: [],          // which entries qualify
  exclude: [],         // entry ids to drop regardless of tracks
  hide: [],            // whole section titles to drop
  order: [],           // section titles, in order. Unlisted sections sink.
                       // NOTE: use ORIGINAL titles here — `rename` is applied after sorting.
  rename: {},          // { "Original Title": "New Title" }
  skills: [],          // replaces the skills section wholesale
  rows: {},            // { "Section Title": [...] } replaces that section's rows
  overrides: {},       // { entryId: { role?, desc?, bullets?, tags?, link? } }
};
```

Register it: add the file-stem to `variantManifest` in `cv-data.js`. One file, one line.
A broken variant file only breaks that cut — the full resume still renders.

## Making a new cut for a job posting

1. Read the posting. Note the **minimum** qualifications separately from the preferred
   ones — the minimums are what a recruiter checks literally.
2. Copy the closest existing variant. Do not start from scratch.
3. Choose `tracks` and `exclude` so the entries that survive are the ones that argue
   for *this* job. Cutting good work is normal; a cut is an argument, not an inventory.
4. Rewrite entries in `overrides` using the posting's own vocabulary — but only where it
   describes what actually happened.
5. Put the strongest evidence in the first section. Sections after the fold are read less.
6. Aim for two pages. Check it.

## Honesty rules — these are not negotiable

The whole tool is built to make many *true* versions, not many flattering ones.

- **Never invent a metric.** If a number isn't in `cv-data.js` or supplied by the person,
  leave it out and tell them which number would strengthen the entry.
- **Never change dates.** If a role overlaps awkwardly or looks like too many jobs at once,
  the fix is to *omit the entry from that cut*. Omission is honest; misdating is not, and
  dates are checked against references.
- **Never inflate a title.** A variant may retitle an entry to a truthful synonym
  ("Mixed Reality Developer" → "Mixed Reality Designer"); it may not promote someone.
- **Flag unverifiable claims** rather than writing around them. If a tag or phrase asserts
  something the person may not be able to defend in an interview, say so.
- **Don't stuff keywords.** Mirroring a posting's language is good when it names the same
  work. Adding a tool they haven't used is not.

## PDF and ATS gotchas already handled — don't undo these

- `text-shadow` is disabled in the print stylesheet. Chrome paints shadowed text **twice**,
  so the PDF text layer emits `EMAILEMAIL you@example.comyou@example.com` and parsers store
  an invalid address. Invisible on screen and on paper.
- Name lines are joined with `&nbsp;`, not a plain space, which HTML collapses — otherwise
  the text layer reads `JaneDoe`.
- `buildPrintContent()` wraps each section heading with its first entry in `.sec-keep`,
  because Paged.js ignores `break-after: avoid` and strands headings at page feet.
- The print CSS is inlined and passed to Paged.js as a blob: URL. A path to a `.css` file
  would fail on `file://` and export an unstyled PDF for anyone who double-clicked the page.
- Avoid absolutely-positioned text in anything that reaches the PDF: positioned content is
  painted after the normal flow, so it extracts *last* regardless of DOM order. This is why
  a beautiful floating header can land after the body text for a parser.

After any layout change, export a PDF and run:

```
npm run ats-check path/to/export.pdf
```

## Importing someone's existing resume

Map it into `cv-data.js`: one item per role, project, degree, award. Give every item an
`id` and generous `tracks`. Keep the person's own wording — do not rewrite into
"professional" phrasing, and do not add achievements that were not there. Then ask which
job they're targeting and build the first variant from that.
