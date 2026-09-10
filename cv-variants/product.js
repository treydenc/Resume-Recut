/* Variant: product — the "I decide what to build" cut.
   Same person, different argument: outcomes and users lead, implementation detail
   recedes. Note how `proj-atlas` gets a completely different pair of bullets here
   than in engineering.js — that is the whole point of the tool.
   Preview: cv.html?role=product */
window.CV.variants.product = {
  group: "Roles",
  label: "Product Designer",
  tagline: "Product Design × Research × Prototyping",
  cover: "banner",
  hideFooter: true,

  tracks: ["design", "product", "research"],
  exclude: ["proj-signal", "job-first"],
  hide: ["Publications"],
  order: ["Selected Work", "Experience", "Skills", "Education", "Awards"],
  rename: {
    "Selected Work": "Selected Projects",
  },

  // A variant can replace the skills block wholesale.
  skills: [
    { label: "Design",    value: "Figma, prototyping, interaction design, typography" },
    { label: "Research",  value: "User testing, surveys, longitudinal studies" },
    { label: "Technical", value: "TypeScript, React, Python — enough to build the thing" },
  ],

  overrides: {
    "proj-atlas": {
      bullets: [
        "Twelve people editing one map at once, with no conflicts and no lost work.",
        "Ran the research that killed the original design and shipped the replacement to 200K users.",
      ],
      tags: ["0→1 product", "Research", "Real-time"],
    },
    "proj-quarry": {
      bullets: [
        "Search interface that shows why a passage was returned, not just that it was.",
        "Evaluated with 40 participants; task completion rose 34%.",
      ],
      tags: ["User study", "RAG", "Search UX"],
    },
    "job-acme": {
      bullets: [
        "Led design on two client products end to end, from research through production hand-off.",
        "Grew one from 0 to 30K users in eleven months.",
      ],
    },
  },
};
