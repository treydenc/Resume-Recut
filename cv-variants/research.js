/* Variant: research — the academic / research-lab cut.
   The inverse of engineering.js: Publications and Awards come back, Education moves
   to the top, and the shipped-product framing gives way to method and evidence.
   Preview: cv.html?role=research */
window.CV.variants.research = {
  group: "Roles",
  label: "Researcher",
  tagline: "Interaction Research × Evaluation × Prototyping",
  // No `cover` here, so this one keeps the full cover page — academic CVs can breathe.
  hideLinks: false,

  tracks: ["research", "design", "teaching"],
  exclude: [],

  // Nothing hidden: in this world the awards and publications are the point.
  hide: [],

  order: ["Education", "Publications", "Selected Work", "Experience", "Awards", "Skills"],

  overrides: {
    "edu-grad": {
      desc: "Thesis: interfaces for steering generative models. Advised by Prof. Example.",
    },
    "proj-quarry": {
      bullets: [
        "Retrieval interface that surfaces the evidence behind each result.",
        "Within-subjects study, n=40; task completion +34% (p < .01) against a baseline ranked list.",
      ],
      tags: ["Study design", "RAG", "Evaluation"],
    },
    "job-teaching": {
      bullets: [
        "TA for Creative Coding and Interaction Design across four semesters.",
        "Translated technical material into exercises a mixed studio could follow.",
      ],
    },
  },
};
