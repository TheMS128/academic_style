// docx → the model every check reads: paragraphs with style, text, list / table / image
// flags, the chapter and subchapter they sit under; the tables as cell text; the work
// type from the title page.

const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const textOf = (x) => unescape((x.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join(""));

function parseParagraphs(documentXml) {
  const body = documentXml.slice(documentXml.indexOf("<w:body>"));
  const out = [];
  let depth = 0;
  let section = 0;
  for (const [x] of body.matchAll(/<w:tbl>|<\/w:tbl>|<w:p\/>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    if (x === "<w:tbl>") { depth++; continue; }
    if (x === "</w:tbl>") { depth--; continue; }
    out.push({
      i: out.length,
      section,
      inTable: depth > 0,
      style: (x.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || "",
      text: textOf(x),
      list: x.includes("<w:numPr>"),
      images: [...x.matchAll(/<wp:extent cx="(\d+)"/g)].map((m) => +m[1]),
    });
    if (x.includes("<w:sectPr")) section++;
  }
  return out;
}

const parseTables = (documentXml) => [...documentXml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map(([tbl]) =>
  [...tbl.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map(([r]) =>
    [...r.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map(([c]) => textOf(c).trim())));

function parseDocument({ doc, styles, core }) {
  const all = parseParagraphs(doc);
  const body = all.filter((p) => p.section > 0);
  let chapter = "", sub = "";
  for (const p of body) {
    if (p.style === "Glava") { chapter = p.text.trim(); sub = ""; }
    else if (p.style === "Podglava") sub = p.text.trim();
    p.chapter = chapter;
    p.sub = sub;
  }
  // A subchapter has no end marker — the blocks follow it with no heading (structure.md →
  // S5–S7). Its zone is what directly follows the subheading: a list, or a paragraph plus
  // the list right after it. Rule exemptions (definitions, «Термин – значение») hold
  // only there, never for the blocks below.
  body.forEach((p) => (p.zone = ""));
  body.forEach((h, k) => {
    if (h.style !== "Podglava") return;
    let j = k + 1;
    const mark = () => { body[j].zone = h.text.trim(); j++; };
    if (body[j] && !body[j].list && body[j].text.trim() && body[j].style !== "Glava" && body[j].style !== "Podglava") mark();
    while (body[j]?.list) mark();
  });
  const titleBlock = all.find((p) => p.section === 0 && p.style === "TitulnikNazvanie");
  return {
    body,
    tables: parseTables(doc),
    styleIds: [...styles.matchAll(/w:styleId="([^"]+)"/g)].map((m) => m[1]),
    core,
    workType: /^Курсовой проект/.test(titleBlock?.text || "")
      ? "Курсовой проект"
      : ((titleBlock?.text || "").match(/^(\S+ая) работа/) || [])[1] || "",
  };
}

module.exports = { parseParagraphs, parseTables, parseDocument, textOf };
