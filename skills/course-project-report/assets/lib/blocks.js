// Content model of the explanatory note. build.js lists these plain descriptors;
// compose.js turns them into the document once all numbers are known.
//
// Text is a string, or an array of strings and { text, bold, italic } segments. It refers
// to numbered things by key, and the numbers are filled in at build time:
//
//   {fig:key}  figure or listing     {tab:key}  table
//   {src:key}  source — «[{src:uml}]» prints «[3]»      {app:key}  appendix letter
//
// Counts for the abstract: {pages}, {figures}, {tables}, {sources}, {appendices}. With word
// forms the number agrees with the noun: {figures:рисунок|рисунка|рисунков},
// {pages:page|pages}. The page count is a Word field until it is written into meta.json.

// the abstract: paragraphs in Russian and in English
const abstract = (ru, en) => ({ kind: "abstract", ru, en });

const intro = () => ({ kind: "part", part: "intro" });
const conclusion = () => ({ kind: "part", part: "conclusion" });

// «1 НАЗВАНИЕ», «1.1 Название», «1.1.1 Название» — numbers are set by the builder
const chapter = (text) => ({ kind: "heading", level: 1, text });
const section = (text) => ({ kind: "heading", level: 2, text });
const point = (text) => ({ kind: "heading", level: 3, text });

const p = (text) => ({ kind: "p", text });

// a list with dashes; steps — «1)», «2)». An item is text or [text, [nested items]]
const list = (items) => ({ kind: "list", marker: "dash", items });
const steps = (items) => ({ kind: "list", marker: "number", items });

// file: PNG in the project's figures/ dir. width: cm, when the natural size is not wanted
const figure = (key, file, caption, { width } = {}) => ({ kind: "figure", key, file, caption, width });

// columns: [{ title, width (relative weight), align: "left" | "center" }]; rows: arrays of cell text
const table = (key, caption, { columns, rows }) => ({ kind: "table", key, caption, columns, rows });

// code set in a monospaced font; it is numbered with the figures and captioned below
const listing = (key, code, caption) => ({ kind: "listing", key, code, caption });

// items: [key, entry] pairs, in the order of the list
const sources = (items) => ({ kind: "sources", items });

// «ПРИЛОЖЕНИЕ А» and its title; everything up to the next appendix belongs to it
const appendix = (key, title) => ({ kind: "appendix", key, title });

module.exports = { abstract, intro, conclusion, chapter, section, point, p, list, steps, figure, table, listing, sources, appendix };
