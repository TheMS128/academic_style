// Named paragraph styles. All formatting lives here; paragraphs only reference a
// style. Five families: Основной текст (+ variants), Глава, Подглава, Титульник
// (+ variants), Листинг. Ids are ASCII (stable in XML), names are what Word shows.

const { AlignmentType, LineRuleType, LevelFormat } = require("docx");

const S = {
  body: "OsnTekst",
  list: "OsnTekstSpisok",
  figure: "OsnTekstRisunok",
  figCaption: "OsnTekstPodpisRisunka",
  tabCaption: "OsnTekstPodpisTablicy",
  tabCell: "OsnTekstTablica",
  tabHead: "OsnTekstShapkaTablicy",
  chapter: "Glava",
  subchapter: "Podglava",
  title: "Titulnik",
  titleHeader: "TitulnikShapka",
  titleBig: "TitulnikNazvanie",
  titleSign: "TitulnikPodpisi",
  codeLabel: "ListingZagolovok",
  code: "Listing",
};

const SINGLE = { line: 240, lineRule: LineRuleType.AUTO };

function buildStyles(p) {
  const { CENTER, LEFT, JUSTIFIED } = AlignmentType;
  const style = (id, name, def) => ({ id, name, quickFormat: true, ...def });
  const flat = { before: 0, after: 0, ...SINGLE };
  const noIndent = { firstLine: 0 };
  const plainRun = { font: p.font.body, size: p.size.body, color: "000000" };

  return {
    default: {
      document: {
        run: { font: p.font.body, size: p.size.body, language: { value: p.language.body } },
        paragraph: { spacing: flat },
      },
    },
    paragraphStyles: [
      style(S.body, "Основной текст", { run: plainRun, paragraph: { alignment: JUSTIFIED, indent: { firstLine: p.indent.firstLine }, spacing: flat } }),
      style(S.list, "Основной текст — список", { basedOn: S.body, paragraph: { indent: { left: p.indent.listLeft, hanging: p.indent.listHanging } } }),
      style(S.figure, "Основной текст — рисунок", { basedOn: S.body, next: S.figCaption, paragraph: { alignment: CENTER, indent: noIndent, spacing: { before: p.gap.block }, keepNext: true, keepLines: true } }),
      style(S.figCaption, "Основной текст — подпись рисунка", { basedOn: S.body, next: S.body, paragraph: { alignment: CENTER, indent: noIndent, spacing: { after: p.gap.block }, keepLines: true } }),
      style(S.tabCaption, "Основной текст — подпись таблицы", { basedOn: S.body, next: S.body, paragraph: { alignment: CENTER, indent: noIndent, spacing: { before: p.gap.block }, keepNext: true } }),
      style(S.tabCell, "Основной текст — таблица", { basedOn: S.body, paragraph: { alignment: LEFT, indent: noIndent } }),
      style(S.tabHead, "Основной текст — шапка таблицы", { basedOn: S.tabCell, run: { bold: true }, paragraph: { alignment: CENTER } }),

      style(S.chapter, "Глава", { basedOn: S.body, next: S.body, run: { bold: true }, paragraph: { alignment: CENTER, indent: noIndent, spacing: { before: p.gap.chapter }, keepNext: true, outlineLevel: 0 } }),
      style(S.subchapter, "Подглава", { basedOn: S.body, next: S.body, run: { bold: true }, paragraph: { alignment: LEFT, spacing: { before: p.gap.subchapter }, keepNext: true, outlineLevel: 1 } }),

      // exact line heights: title.js computes the page layout from them
      style(S.title, "Титульник", { run: plainRun, paragraph: { alignment: CENTER, indent: noIndent, spacing: { before: 0, after: 0, line: p.title.lineHeight.body, lineRule: LineRuleType.EXACT } } }),
      style(S.titleHeader, "Титульник — шапка", { basedOn: S.title, run: { size: p.size.titleHeader }, paragraph: { spacing: { line: p.title.lineHeight.header, lineRule: LineRuleType.EXACT } } }),
      style(S.titleBig, "Титульник — название", { basedOn: S.title, run: { size: p.size.titleBig }, paragraph: { spacing: { line: p.title.lineHeight.big, lineRule: LineRuleType.EXACT } } }),
      style(S.titleSign, "Титульник — подписи", { basedOn: S.title, paragraph: { alignment: LEFT, indent: { left: p.indent.signLeft } } }),

      style(S.codeLabel, "Листинг — заголовок", { basedOn: S.body, next: S.code, paragraph: { alignment: LEFT, indent: noIndent, spacing: { before: p.gap.block }, keepNext: true } }),
      style(S.code, "Листинг", { run: { font: p.font.code, size: p.size.code, color: "000000", language: { value: p.language.code } }, paragraph: { alignment: LEFT, indent: noIndent, spacing: flat } }),
    ],
  };
}

// one decimal numbering definition per list, so every list restarts at 1
function buildNumbering(refs, p) {
  return {
    config: refs.map((reference) => ({
      reference,
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: p.indent.listLeft, hanging: p.indent.listHanging } } },
      }],
    })),
  };
}

module.exports = { S, buildStyles, buildNumbering };
