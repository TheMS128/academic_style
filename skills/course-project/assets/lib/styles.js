// Named paragraph styles of the explanatory note. All formatting lives here; paragraphs
// only reference a style. Ids are ASCII (stable in XML), names are what Word shows.

const { docx } = require("./deps");
const { AlignmentType, LineRuleType, LevelFormat, TabStopType, LeaderType } = docx;
const { mm } = require("./profile");

const S = {
  body: "KpTekst",
  plain: "KpTekstBezOtstupa",
  dash: "KpSpisok",
  figure: "KpRisunok",
  caption: "KpPodpis",
  tabCaption: "KpPodpisTablicy",
  tabCell: "KpTablica",
  tabHead: "KpShapkaTablicy",
  code: "KpKod",
  source: "KpIstochnik",
  chapter: "KpGlava",
  section: "KpPodglava",
  point: "KpPunkt",
  centered: "KpZagolovokVnutri",
  title: "KpTitul",
  titleBig: "KpTitulRabota",
  titleSign: "KpTitulPodpisi",
  toc1: "TOC1",
  toc2: "TOC2",
};

const textWidth = (p) => p.page.width - mm(p.text.left) - mm(p.text.right);

function buildStyles(p) {
  const { CENTER, LEFT, RIGHT, JUSTIFIED } = AlignmentType;
  const style = (id, name, def) => ({ id, name, quickFormat: true, ...def });
  const body = { before: 0, after: 0, line: p.line.body, lineRule: LineRuleType.AUTO };
  const noIndent = { firstLine: 0 };
  const run = { font: p.font.body, size: p.size.body, color: "000000" };
  const exact = (line) => ({ before: 0, after: 0, line, lineRule: LineRuleType.EXACT });
  const tocTab = [{ type: TabStopType.RIGHT, position: textWidth(p), leader: LeaderType.DOT }];
  const titleRun = { font: p.font.title, size: p.size.title, italics: p.title.italic, color: "000000" };

  return {
    default: {
      document: {
        run: { font: p.font.body, size: p.size.body, language: { value: p.language.body } },
        paragraph: { spacing: { before: 0, after: 0 } },
      },
    },
    paragraphStyles: [
      style(S.body, "КП — основной текст", { run, paragraph: { alignment: JUSTIFIED, indent: { firstLine: p.indent.firstLine }, spacing: body } }),
      style(S.plain, "КП — текст без отступа", { basedOn: S.body, paragraph: { indent: noIndent } }),
      style(S.dash, "КП — список", { basedOn: S.body }),
      style(S.figure, "КП — рисунок", { basedOn: S.body, next: S.caption, paragraph: { alignment: CENTER, indent: noIndent, spacing: { before: p.gap.figure, line: 240 }, keepNext: true } }),
      style(S.caption, "КП — подпись рисунка", { basedOn: S.body, next: S.body, paragraph: { alignment: CENTER, indent: noIndent, spacing: { after: p.gap.figure }, keepLines: true } }),
      style(S.tabCaption, "КП — название таблицы", { basedOn: S.body, next: S.body, paragraph: { alignment: p.table.captionAlign === "left" ? LEFT : RIGHT, indent: noIndent, spacing: { before: p.gap.figure }, keepNext: true } }),
      style(S.tabCell, "КП — таблица", { basedOn: S.body, paragraph: { alignment: LEFT, indent: noIndent, spacing: { line: 240 } } }),
      style(S.tabHead, "КП — шапка таблицы", { basedOn: S.tabCell, paragraph: { alignment: CENTER } }),
      style(S.code, "КП — исходный код", { run: { font: p.font.code, size: p.size.code, color: "000000", language: { value: p.language.code } }, paragraph: { alignment: LEFT, indent: noIndent, spacing: { before: 0, after: 0, line: p.line.code, lineRule: LineRuleType.AUTO } } }),
      style(S.source, "КП — источник", { basedOn: S.body }),

      style(S.chapter, "КП — глава", { basedOn: S.body, next: S.body, run: { bold: true }, paragraph: { alignment: CENTER, indent: noIndent, spacing: { after: p.gap.chapter }, keepNext: true, keepLines: true, pageBreakBefore: true, outlineLevel: 0 } }),
      style(S.section, "КП — подглава", { basedOn: S.body, next: S.body, run: { bold: true }, paragraph: { alignment: LEFT, spacing: { before: p.gap.sectionBefore, after: p.gap.sectionAfter }, keepNext: true, keepLines: true, outlineLevel: 1 } }),
      style(S.point, "КП — пункт", { basedOn: S.body, next: S.body, run: { bold: true }, paragraph: { alignment: LEFT, spacing: { before: p.gap.point, after: p.gap.point }, keepNext: true, keepLines: true, outlineLevel: 2 } }),
      style(S.centered, "КП — заголовок внутри раздела", { basedOn: S.body, next: S.body, paragraph: { alignment: CENTER, indent: noIndent, spacing: { before: p.gap.chapter, after: p.gap.chapter }, keepNext: true } }),

      // exact line heights: title.js computes the page from them
      style(S.title, "КП — титульный лист", { run: titleRun, paragraph: { alignment: CENTER, indent: noIndent, spacing: exact(p.title.lineHeight.body) } }),
      style(S.titleBig, "КП — титульный лист, вид работы", { basedOn: S.title, run: { size: p.size.titleBig, bold: true }, paragraph: { spacing: exact(p.title.lineHeight.big) } }),
      style(S.titleSign, "КП — титульный лист, подписи", { basedOn: S.title, paragraph: { alignment: LEFT, indent: { left: p.title.signLeft } } }),

      style(S.toc1, "toc 1", { basedOn: S.body, next: S.body, paragraph: { alignment: LEFT, indent: noIndent, tabStops: tocTab } }),
      style(S.toc2, "toc 2", { basedOn: S.body, next: S.body, paragraph: { alignment: LEFT, indent: { firstLine: 0, left: 284 }, tabStops: tocTab } }),
    ],
  };
}

// One definition per list, so every list starts from the beginning. The marker stands at
// the paragraph indent and the text wraps to the left edge, as ГОСТ 2.105 sets lists.
function buildNumbering(lists, p) {
  const level = (level, format, text, firstLine) => ({
    level, format, text, alignment: AlignmentType.LEFT, suffix: "space",
    style: { paragraph: { indent: { left: 0, firstLine } } },
  });
  const kinds = {
    dash: [level(0, LevelFormat.BULLET, p.lists.dash, p.indent.firstLine), level(1, LevelFormat.BULLET, p.lists.dash, p.indent.nested)],
    number: [level(0, LevelFormat.DECIMAL, p.lists.number, p.indent.firstLine), level(1, LevelFormat.RUSSIAN_LOWER, p.lists.nested, p.indent.nested)],
    source: [level(0, LevelFormat.DECIMAL, p.lists.source, p.indent.firstLine)],
  };
  return { config: lists.map(({ reference, kind }) => ({ reference, levels: kinds[kind] })) };
}

module.exports = { S, buildStyles, buildNumbering, textWidth };
