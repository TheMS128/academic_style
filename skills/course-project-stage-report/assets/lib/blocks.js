// Content model. A report's build.js lists these plain descriptors; compose.js
// turns them into docx objects once figure and table numbers are known. Text refers
// to figures and tables by key, numbers are filled in at build time:
//
//   p("Результат представлен на рисунке {fig:nav}."),
//   figure("nav", "fig1.png", "Постоянная навигация сайта"),
//
// Text is a string, or an array of strings and { text, bold, italic } segments.

const chapter = (text) => ({ kind: "chapter", text });
const subchapter = (text) => ({ kind: "subchapter", text });
const p = (text) => ({ kind: "p", text });
const list = (items) => ({ kind: "list", items });

// file: PNG in the report's figures/ dir; size is read from the file.
// wide: full text-column width (diagrams, wireframes)
// fit: "height" — scale to the profile's fixed height (15 cm) instead of the width;
// for tall pictures such as phone screenshots, chosen by the user (figures.md → G7)
const figure = (key, file, caption, { wide = false, fit } = {}) => ({ kind: "figure", key, file, caption, wide, fit });

// columns: [{ title, width (relative weight), align: "left" | "center" }]
// rows: arrays of cell text. splitAt: row index where the table continues on the next
// page under «Продолжение таблицы N» with the header repeated.
const table = (key, caption, { columns, rows, splitAt, pageBreakBefore = false }) =>
  ({ kind: "table", key, caption, columns, rows, splitAt, pageBreakBefore });

// The label is always «Листинг:» — the file or language is named in the paragraph
// before it; a second argument left in an older build.js is ignored.
const listing = (code) => ({ kind: "listing", code, label: "Листинг:" });

module.exports = { chapter, subchapter, p, list, figure, table, listing };
