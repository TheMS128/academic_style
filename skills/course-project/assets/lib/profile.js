// Formatting profile of the explanatory note — every number the layout depends on.
// Another department's template is another profile object returned from build.js;
// nothing else in lib/ changes. Lengths marked mm are millimetres from the page edges.

const mm = (x) => Math.round(x * 56.6929); // millimetres → twips

const KP = {
  page: { width: 11906, height: 16838 },                       // A4, twips
  // the frame of ГОСТ 2.104 and the text inside it, mm from the page edges
  frame: { left: 20, top: 5, right: 5, bottom: 5 },
  text: { left: 25, right: 15, top: 15, bottom: 15, aboveStamp: 10 },
  // the title block («основная надпись»): form 2 on the first sheets, form 2а after them
  stamp: {
    big: 40, small: 15,                                        // heights, mm
    contents: "big",                                           // «Содержание» opens with form 2 as well ("small" — form 2а)
    letter: "У",                                               // «Лит.»
    kind: "Пояснительная записка",                             // second line of the name cell
    line: 19050, thin: 3175,                                   // EMU: 1.5 pt and 0.25 pt
    size: { label: 16, name: 14, title: 20, code: 32, group: 28, sheet: 20 }, // half-points
  },
  font: { body: "Times New Roman", code: "Courier New", title: "Arial", stamp: "Arial" },
  size: { body: 28, code: 22, title: 28, titleBig: 32 },       // half-points
  line: { body: 360, code: 240 },                              // 1.5 and 1.0
  indent: { firstLine: 720, nested: 1440 },                    // twips
  gap: { chapter: 240, sectionBefore: 240, sectionAfter: 360, point: 240, figure: 360 },
  table: { border: 6, cellMargin: { top: 40, bottom: 40, left: 100, right: 100 }, captionAlign: "right" },
  figure: { maxWidthCm: 16, maxHeightCm: 20 },
  language: { body: "ru-RU", code: "en-US" },
  organization: "Владимирский государственный университет (ВлГУ)",
  captions: {
    figure: (n, name) => `Рисунок ${n} – ${name}`,
    table: (n, name) => `Таблица ${n} – ${name}`,
  },
  // list markers: a dash, «1)» and «а)» for the nested level
  lists: { dash: "–", number: "%1)", nested: "%2)", source: "%1)" },
  headings: {
    abstract: "АННОТАЦИЯ", abstractEn: "ABSTRACT", contents: "СОДЕРЖАНИЕ", intro: "ВВЕДЕНИЕ",
    conclusion: "ЗАКЛЮЧЕНИЕ", sources: "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ", appendix: "ПРИЛОЖЕНИЕ",
  },
  appendixLetters: "АБВГДЕЖИКЛМНПРСТУФХЦШЩЭЮЯ",                 // ГОСТ 2.105: without Ё, З, Й, О, Ч, Ъ, Ы, Ь
  toc: { levels: 2, listsItself: true },                       // «Аннотация» and «Содержание» are entries of the contents
  title: {
    headerLines: [
      "Федеральное государственное бюджетное образовательное учреждение высшего образования",
      "«Владимирский государственный университет",
      "имени Александра Григорьевича и Николая Григорьевича Столетовых»",
      "",
      "Кафедра информационных систем и программной инженерии",
    ],
    work: "КУРСОВОЙ ПРОЕКТ",
    italic: true,
    lineHeight: { body: 480, big: 560 },                       // exact, twips
    workTop: 4300,                                             // top of «КУРСОВОЙ ПРОЕКТ» from the top of the text area
    signTop: 8400,                                             // top of the signatures block
    signLeft: 5103,                                            // its left indent, 9 cm
    minGap: 480,
  },
};

module.exports = { KP, mm };
