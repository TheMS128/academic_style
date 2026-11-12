// Formatting profile — every number the document layout depends on. Another
// university or course template is another profile object passed to
// buildReport({ profile }); nothing else in lib/ changes.

const VLSU = {
  page: { width: 11906, height: 16838, margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } }, // A4, twips
  font: { body: "Times New Roman", code: "Courier New" },
  size: { body: 28, code: 22, titleHeader: 24, titleBig: 44 },                  // half-points
  indent: { firstLine: 709, listLeft: 720, listHanging: 360, signLeft: 6237 },  // twips
  gap: { chapter: 400, subchapter: 200, block: 280 },                           // 20 / 10 / 14 pt
  table: { width: 8504, border: 6, cellMargin: { top: 60, bottom: 60, left: 100, right: 100 } }, // 15 cm
  figure: { defaultPx: 580, widePx: 614,                                        // px @ 96 dpi; 614 = Word Online ceiling
            fitHeightPx: 567,                                                   // fit: "height" — 15 cm
            maxHeightPx: 900 },                                                 // taller than this does not fit a page with its caption
  language: { body: "ru-RU", code: "en-US" },
  organization: "Владимирский государственный университет (ВлГУ)",                 // document property «Организация»
  captions: {
    figure: (n, name) => `Рисунок ${n} – ${name}`,
    table: (n, name) => `Таблица ${n}. ${name}`,
    tableCont: (n, name) => `Продолжение таблицы ${n}. ${name}`,
  },
  title: {
    headerLines: [
      "Министерство науки и высшего образования Российской Федерации",
      "Федеральное государственное бюджетное образовательное учреждение",
      "высшего образования",
      "«Владимирский государственный университет",
      "имени Александра Григорьевича и Николая Григорьевича Столетовых»",
      "(ВлГУ)",
      "Кафедра информационных систем и программной инженерии",
    ],
    // the only values the «Должность» field accepts
    posts: ["зав. кафедры ИСПИ", "доцент каф. ИСПИ", "ст. преп. каф. ИСПИ", "ассистент каф. ИСПИ"],
    // exact line heights of the title styles, twips (about 1.15 x font size)
    lineHeight: { header: 276, big: 540, body: 322 },
    // block positions from the top of the text area, twips (text area height 14570)
    titleCenter: 5300,     // vertical centre of the title block
    signTop: 8600,         // top of the signatures block
    minGap: 400,           // smallest gap between blocks
    slack: 540,            // free space under the city line; absorbs one unexpected line wrap
    verticalAlign: "both", // section justified vertically, so Word pins the city line to the bottom
  },
};

module.exports = { VLSU };
