/* Variant: engineering — the "I build things" cut.
   Leads with shipped software, drops the art and teaching history, and rewrites
   two entries to sound like engineering rather than design.
   Preview: cv.html?role=engineering */
window.CV.variants.engineering = {
  group: "Roles",                       // groups this cut in the left-hand Cuts panel
  label: "Design Engineer",             // what that panel calls it
  tagline: "Design Engineer × Real-Time Systems × Front-End Craft",
  cover: "banner",                      // slim page-1 strip instead of a full cover page
  hideFooter: true,

  // Only entries carrying one of these tracks survive.
  tracks: ["engineering", "product", "design"],

  // ...minus anything named here, regardless of tracks.
  exclude: ["job-first"],

  // Whole sections that don't help this argument.
  hide: ["Awards", "Publications"],

  // Sections not listed here sink to the bottom.
  order: ["Selected Work", "Experience", "Skills", "Education"],

  rename: {
    "Selected Work": "Selected Projects",
  },

  // Per-entry rewrites. `bullets` replaces `desc` with a list; `role`, `tags` and
  // `link` can be overridden too. The base data file is never touched.
  overrides: {
    "proj-atlas": {
      bullets: [
        "Built a real-time multiplayer map editor where edits from twelve concurrent users merge without conflicts.",
        "Owned the CRDT sync layer and the entire front end; p95 sync latency under 80ms.",
      ],
      tags: ["TypeScript", "WebGL", "CRDT"],
    },
    "job-northwind": {
      bullets: [
        "Build the design system and the prototypes that decide what ships.",
        "Shipped 6 features to 200K monthly users.",
      ],
    },
  },
};
