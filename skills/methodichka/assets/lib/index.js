// methodichka builder — рендер Markdown-методички в .docx со стилями ВлГУ.
//
//   node assets/bin/render.js <input.md> <output.docx> --title "…" --year 2026
//
// Обложка формируется из параметров и профиля; тело — из Markdown после первого
// разделителя «---» (всё, что выше него, считается заглушкой обложки).

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { Document, Packer, Paragraph, TextRun, TableOfContents, AlignmentType, Footer, PageNumber } = require("docx");
const { VLSU } = require("./profile");
const { buildStyles, buildNumbering, S } = require("./styles");
const { coverPage } = require("./cover");
const { mdToDoc } = require("./md");

// нижний колонтитул тела: номер страницы по центру
function pageFooter() {
  return new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })],
  });
}

// Оглавление: заголовок «СОДЕРЖАНИЕ» (не входит в TOC) и поле TOC по «Разделам»
// (уровень 1) и «Главам» (уровень 2). Word заполняет поле при открытии (F9).
function tableOfContents() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: { firstLine: 0 },
      spacing: { after: 200 },
      children: [new TextRun({ text: "СОДЕРЖАНИЕ", bold: true })],
    }),
    new TableOfContents("Содержание", {
      hyperlink: true,
      headingStyleRange: "1-2",
      useAppliedParagraphOutlineLevel: true, // \u — собирать по уровню структуры абзаца (Раздел, Глава)
    }),
  ];
}

// docx-js закрывает нефинальную секцию лишним пустым абзацем с разрывом секции —
// на обложке он занимает отдельную строку. Переносим разрыв в последний абзац секции.
function mergeSectionBreaks(xml) {
  const empty = /<w:p><w:pPr>(<w:sectPr>[\s\S]*?<\/w:sectPr>)<\/w:pPr><\/w:p>/g;
  let out = "", last = 0;
  for (const m of xml.matchAll(empty)) {
    const head = xml.slice(last, m.index);
    const start = head.lastIndexOf("<w:p>");
    if (head.endsWith("</w:p>") && start >= 0) {
      const prev = head.slice(start);
      const merged = prev.includes("</w:pPr>")
        ? prev.replace("</w:pPr>", `${m[1]}</w:pPr>`)
        : prev.replace("<w:p>", `<w:p><w:pPr>${m[1]}</w:pPr>`);
      out += head.slice(0, start) + merged;
    } else {
      out += head + m[0];
    }
    last = m.index + m[0].length;
  }
  return out + xml.slice(last);
}

// тело — всё после первой строки-разделителя «---»
function bodyMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^\s*---+\s*$/.test(l));
  return idx >= 0 ? lines.slice(idx + 1).join("\n") : md;
}

async function buildMethodichka({ input, out, title, year, author, profile = VLSU }) {
  const md = fs.readFileSync(input, "utf8");
  const p = { ...profile, cover: { ...profile.cover, year: year || new Date().getFullYear(), author } };
  const page = { margin: p.page.margin, size: { width: p.page.width, height: p.page.height } };

  const { children, numbering } = mdToDoc(bodyMarkdown(md), p, { baseDir: path.dirname(input) });
  const doc = new Document({
    features: { updateFields: true }, // попросить Word обновить оглавление при открытии
    styles: buildStyles(p),
    numbering: buildNumbering(numbering, p),
    sections: [
      { properties: { page, verticalAlign: "both" }, children: coverPage(title, p) },
      {
        properties: { page: { ...page, pageNumbers: { start: 1 } } },
        footers: { default: pageFooter() },
        children: [...tableOfContents(), ...children],
      },
    ],
  });

  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  let xml = await zip.file("word/document.xml").async("string");
  xml = mergeSectionBreaks(xml);
  // пометить поля «грязными», чтобы Word пересчитал их (оглавление, номера) при открытии
  xml = xml.replace(/<w:fldChar w:fldCharType="begin"\s*\/>/g, '<w:fldChar w:fldCharType="begin" w:dirty="true"/>');
  zip.file("word/document.xml", xml);
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(out, buf);
  return { out, bytes: buf.length };
}

module.exports = { buildMethodichka };
