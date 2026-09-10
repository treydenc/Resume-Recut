/* =====================================================================
   cv-data.js — everything you have ever done, once.

   This file is a .js file rather than .json on purpose: cv.html loads it with a
   <script> tag, so you can open cv.html straight from disk. JSON would need fetch(),
   which browsers block on file:// URLs — and you would lose these comments.

   • Add an entry once, here. Never copy content into a variant.
   • Every item takes an `id` (stable, kebab-case) and `tracks` (what kind of work it is).
     A variant asks for tracks; an item appears if ANY of its tracks is requested.
     Items with no `tracks` always appear.
   • Track vocabulary is yours to invent. This example uses:
       design, engineering, product, research, teaching, leadership, art
   • Tag liberally. Filtering out is easier than remembering what you forgot.
   • View a cut:  cv.html?role=engineering   (no role = whatever `defaultRole` says)
   ===================================================================== */

const CV = {
  theme: "warm",                    // "default" (blue/red), "warm", or "chanel"
  cover: "banner",                  // "banner" = slim header strip at the top of page one.
                                    // Remove this line for a full-page cover instead.
  name: ["Jordan", "Rivera"],       // rendered on two lines
  tagline: "Design Engineer × Interaction × Research",
  profile: "",                      // optional one-line intro, shown under the tagline
  repoUrl: "https://github.com/YOURNAME/recut",   // "How this works" link at the foot of
                                    // the Cuts panel. Delete this line to hide it.
  // backHref: "/",                 // only if you host this inside your own site:
                                    // adds a "← Back to website" link in the corner

  colophon: [
    { k: "Email",     v: "jordan@example.com", href: "mailto:jordan@example.com" },
    { k: "Portfolio", v: "jordanrivera.example", href: "https://example.com" },
    { k: "GitHub",    v: "github.com/example", href: "https://github.com/example" },
    { k: "Based in",  v: "Lisbon, PT" },
  ],

  sections: [
    {
      title: "Education", meta: "2016 — 2024", type: "entries",
      items: [
        { id: "edu-grad", tracks: ["design", "research"],
          when: "2022 — 2024", role: "Institute of Design — MS, Interaction Design",
          desc: "Thesis: interfaces for steering generative models." },
        { id: "edu-undergrad", tracks: ["design", "art"],
          when: "2016 — 2020", role: "State University — BFA, Graphic Design",
          desc: "Minor in computer science." },
      ],
    },

    {
      title: "Selected Work", meta: "Practice", type: "entries",
      items: [
        /* ── Copy this block to add a project ────────────────────────────
           `bullets` is optional. Give it an array and the entry renders as a
           list; leave it out and `desc` renders as a paragraph. Variants can
           override either one.                                            */
        { id: "proj-atlas", tracks: ["engineering", "product", "design"],
          when: "2024", role: "Atlas — Collaborative Map Editor",
          desc: "Real-time multiplayer map editor where edits from twelve people merge without conflicts. Built the CRDT sync layer and the whole front end.",
          tags: ["TypeScript", "WebGL", "Real-time"],
          link: { href: "https://example.com/atlas", label: "View project" } },

        { id: "proj-quarry", tracks: ["research", "design"],
          when: "2023 — 2024", role: "Quarry — Search for Long Documents",
          desc: "Retrieval interface that shows why a passage was returned, not just that it was. Evaluated with 40 participants; task completion rose 34%.",
          tags: ["RAG", "User study", "Python"],
          link: { href: "https://example.com/quarry", label: "View project" } },

        { id: "proj-signal", tracks: ["engineering", "art"],
          when: "2022", role: "Signal Garden — Generative Installation",
          desc: "Audio-reactive projection installed in a public library for six weeks; roughly 4,000 visitors interacted with it.",
          tags: ["Three.js", "Audio", "Installation"] },
      ],
    },

    {
      title: "Experience", meta: "2020 — Present", type: "entries",
      items: [
        { id: "job-northwind", tracks: ["engineering", "product", "design"],
          when: "2024 — Present", role: "Northwind — Design Engineer",
          desc: "Build the design system and the prototypes that decide what ships. Shipped 6 features to 200K monthly users." },

        { id: "job-acme", tracks: ["design", "product"],
          when: "2022 — 2024", role: "Acme Studio — Product Designer",
          desc: "Led design on two client products end to end, from research through production hand-off. Grew one from 0 to 30K users." },

        { id: "job-teaching", tracks: ["teaching", "design"],
          when: "2021 — 2023", role: "State University — Teaching Assistant",
          desc: "TA for Creative Coding and Interaction Design. Translated technical material into exercises a mixed studio could follow." },

        { id: "job-first", tracks: ["design"],
          when: "2020 — 2022", role: "Small Agency — Junior Designer",
          desc: "Brand and web work for 15 clients. Learned to ship on someone else's deadline." },
      ],
    },

    {
      title: "Skills", meta: "Toolkit", type: "skills",
      items: [
        { label: "Front-End",     value: "TypeScript, JavaScript, React, CSS, WebGL" },
        { label: "Design",        value: "Figma, prototyping, interaction design, typography" },
        { label: "Back-End",      value: "Python, Postgres, SQL, API design" },
        { label: "Research",      value: "User testing, surveys, longitudinal studies" },
      ],
    },

    /* `rows` sections are compact one-liners — good for awards, talks, publications. */
    {
      title: "Awards", meta: "2020 — 2024", type: "rows",
      rows: [
        { when: "2024", what: "Institute of Design Thesis Prize" },
        { when: "2022", what: "Interaction Awards, shortlist", note: "Signal Garden" },
        { tracks: ["art"], when: "2020", what: "Undergraduate Studio Award" },
      ],
    },

    {
      title: "Publications", type: "rows",
      rows: [
        { tracks: ["research"], when: "2024",
          what: "“Showing the Why: Explaining Retrieval in Long-Document Search”",
          note: "ACM CHI Late-Breaking Work" },
      ],
    },
  ],

  /* Leave this EMPTY. Each file in cv-variants/ registers itself into it on load
     (`window.CV.variants.engineering = {...}`), so the key has to exist first. */
  variants: {},

  /* Every variant file-stem, loaded by cv.html after this file.
     Add a cut = one new file in cv-variants/ + one string here. */
  variantManifest: ["engineering", "product", "research"],
  variantsDir: "cv-variants/",

  /* What cv.html shows with no ?role= in the URL.
     Leave empty for the full resume. `?role=full` always escapes back to everything. */
  defaultRole: "",
};

window.CV = CV;
