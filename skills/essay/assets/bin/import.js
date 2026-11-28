#!/usr/bin/env node
// Imports an essay written elsewhere (a .docx) so that it can be rebuilt by this skill:
// the title fields go to meta.json, the text to build.js in the block calls, the pictures
// to figures/. The words are carried over as they stand — the rebuild changes the layout,
// not the text. What the importer could not recognise is listed for the agent to check.
//
//   node import.js <essay.docx> essay/<name>
//
// It reads a usual essay: a title page, «СОДЕРЖАНИЕ», «ВВЕДЕНИЕ», chapters numbered «1.» /
// «1» with sections «1.1» and «1.1.1», «ЗАКЛЮЧЕНИЕ», a list of sources, «ПРИЛОЖЕНИЕ А» with
// its name on the next line. References «[3]» become {src:…}, «рисунок 2» becomes {fig:…}.

const fs = require("fs");
const path = require("path");
const { JSZip } = require("../lib/deps");

const fail = (msg) => { console.error(msg); process.exit(2); };
const [src, dirArg] = process.argv.slice(2);
if (!src || !dirArg) fail("usage: node import.js <essay.docx> essay/<name>");
const dir = path.resolve(dirArg);
if (fs.existsSync(path.join(dir, "build.js"))) fail(`${path.join(dir, "build.js")} уже есть — импорт его не перезаписывает`);

const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const clean = (s) => s.replace(/ /g, " ").replace(/[ \t]+/g, " ").trim();
const q = (s) => JSON.stringify(s);

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(src));
  const xml = await zip.file("word/document.xml").async("string");
  const relsXml = zip.file("word/_rels/document.xml.rels") ? await zip.file("word/_rels/document.xml.rels").async("string") : "";
  // attributes of a relationship come in any order
  const attr = (tag, name) => (tag.match(new RegExp(`[ \t\r\n]${name}="([^"]+)"`)) || [])[1];
  const rels = new Map([...relsXml.matchAll(/<Relationship[ \t\r\n][^>]*>/g)].map(([r]) => [attr(r, "Id"), attr(r, "Target")]));

  // paragraphs in order: text, alignment, list flag, image, page break after
  const paras = [];
  for (const [p] of xml.slice(xml.indexOf("<w:body>")).matchAll(/<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g)) {
    const text = clean(unescape((p.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join("")));
    const image = (p.match(/r:embed="([^"]+)"/) || [])[1];
    paras.push({
      text,
      center: /<w:jc w:val="center"\/>/.test(p),
      list: /<w:numPr>/.test(p),
      image: image ? rels.get(image) : null,
      pageBreak: /w:type="page"|<w:sectPr/.test(p),
    });
  }

  // the title page: everything before the first page break
  const firstBreak = paras.findIndex((p) => p.pageBreak);
  const titleParas = paras.slice(0, firstBreak + 1).map((p) => p.text).filter(Boolean);
  const title = {};
  const NAME = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)? [А-ЯЁ]\.\s?[А-ЯЁ]\.$/;
  for (const [i, line] of titleParas.entries()) {
    let m;
    if ((m = line.match(/по дисциплине\s+[«"](.+)[»"]$/i))) title["Дисциплина"] = m[1];
    else if ((m = line.match(/^(?:на тему|тема:?)\s+[«"](.+)[»"]$/i))) title["Тема"] = m[1];
    else if ((m = line.match(/^Вариант\s*№?\s*(\d+)/i))) title["Вариант"] = m[1];
    else if ((m = line.match(/(?:группы|гр\.)\s+([А-ЯЁA-Z]+-?\d+)/))) title["Группа"] = m[1];
    else if ((m = line.match(/^([А-ЯЁ][а-яё]+)\s+(\d{4})(?:\s*г\.?)?$/))) { title["Город"] = m[1]; title["Год"] = m[2]; }
    else if (NAME.test(line.replace(/\.\s?([А-ЯЁ])\.$/, ". $1."))) {
      const name = line.replace(/([А-ЯЁ])\.\s?([А-ЯЁ])\.$/, "$1. $2.");
      const role = titleParas.slice(0, i).reverse().find((l) => /^(Выполнил|Выполнила|Проверил|Проверила|Принял|Приняла)/.test(l)) || "";
      if (/^Выполнил/.test(role)) title["Выполнил"] = name;
      else {
        title["Принял"] = name;
        const before = titleParas[i - 1];
        if (before && !/^(Проверил|Принял)/.test(before)) title["Должность"] = before;
      }
    }
  }

  // the body starts at «ВВЕДЕНИЕ» standing alone (the contents lists it with a page number)
  const start = paras.findIndex((p, k) => k > firstBreak && /^ВВЕДЕНИЕ$/i.test(p.text));
  if (start < 0) fail("не найден заголовок «ВВЕДЕНИЕ» — структура файла не распознана");

  const body = ["contents()"];
  const notes = [];
  const sources = [];
  let mode = "text", figN = 0, appN = 0, list = [];
  const flushList = () => { if (list.length) { body.push(`list([\n      ${list.map(q).join(",\n      ")},\n    ])`); list = []; } };
  // «[3]», «[3, 5]» → «[{src:s3}]»; «рисунке 2», «рис. 2» → «рисунке {fig:f2}»
  const refs = (t) => t
    .replace(/\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g, (_, n) => `[${n.split(/\s*,\s*/).map((x) => x.replace(/^(\d+)$/, "{src:s$1}")).join(", ")}]`)
    .replace(/(рисун\S*|рис\.)\s+(\d+)/gi, (_, w, n) => `${w} {fig:f${n}}`);

  fs.mkdirSync(path.join(dir, "figures"), { recursive: true });
  for (let k = start; k < paras.length; k++) {
    const p = paras[k];
    const t = p.text;
    if (!t && !p.image) continue;
    let m;
    if (/^ВВЕДЕНИЕ$/i.test(t)) { flushList(); mode = "text"; body.push("intro()"); }
    else if (/^ЗАКЛЮЧЕНИЕ$/i.test(t)) { flushList(); mode = "text"; body.push("conclusion()"); }
    else if (/^СПИСОК\s+(ИСПОЛЬЗ\S+|ЛИТЕРАТУРЫ)/i.test(t)) { flushList(); mode = "sources"; }
    else if ((m = t.match(/^ПРИЛОЖЕНИЕ\s+([А-ЯA-Z])$/i))) {
      flushList(); mode = "text";
      const name = (paras.slice(k + 1).find((x) => x.text) || { text: "" }).text;
      k = paras.indexOf(paras.slice(k + 1).find((x) => x.text));
      body.push(`appendix(${q(`app${++appN}`)}, ${q(name.replace(/[.:]$/, ""))})`);
    } else if (mode === "sources" && (p.list || /^\d+[.)]\s/.test(t))) {
      sources.push(t.replace(/^\d+[.)]\s*/, ""));
    } else if ((m = t.match(/^(\d+)\.(\d+)\.(\d+)\.?\s+(.+)$/)) && t.length < 150) { flushList(); body.push(`point(${q(m[4].replace(/[.:]$/, ""))})`); }
    else if ((m = t.match(/^(\d+)\.(\d+)\.?\s+(.+)$/)) && t.length < 150) { flushList(); body.push(`section(${q(m[3].replace(/[.:]$/, ""))})`); }
    else if ((m = t.match(/^(\d+)\.?\s+(.+)$/)) && t.length < 150 && (p.center || m[2] === m[2].toUpperCase())) { flushList(); mode = "text"; body.push(`chapter(${q(m[2].replace(/[.:]$/, ""))})`); }
    else if (p.image) {
      flushList();
      const media = p.image.replace(/^\.?\/?/, "");
      const file = zip.file(`word/${media}`) || zip.file(media);
      const ext = path.extname(media) || ".png";
      const name = `fig${++figN}${ext}`;
      if (file) fs.writeFileSync(path.join(dir, "figures", name), await file.async("nodebuffer"));
      else notes.push(`рисунок ${figN}: файл ${media} не найден в документе`);
      if (ext.toLowerCase() !== ".png") notes.push(`рисунок ${figN}: ${name} не PNG — переведите в PNG и поправьте имя в build.js`);
      const capPara = paras.slice(k + 1).find((x) => x.text);
      const cap = capPara && capPara.text.match(/^Рисунок\s+\d+\s*[—–-]\s*(.+?)\.?$/);
      if (cap) k = paras.indexOf(capPara);
      else notes.push(`рисунок ${figN}: подпись не найдена — впишите название`);
      body.push(`figure(${q(`f${figN}`)}, ${q(name.replace(ext, ".png"))}, ${q(cap ? cap[1] : "НАЗВАНИЕ РИСУНКА")})`);
    } else if (p.list) list.push(refs(t).replace(/[;.]$/, ""));
    else { flushList(); body.push(`p(${q(refs(t))})`); }
  }
  flushList();
  if (sources.length) {
    // the conclusion is followed by the sources; appendices stay after them
    const at = body.findIndex((b) => b.startsWith("appendix("));
    const block = `sources([\n      ${sources.map((s, i) => `[${q(`s${i + 1}`)}, ${q(s)}]`).join(",\n      ")},\n    ])`;
    if (at < 0) body.push(block); else body.splice(at, 0, block);
  } else notes.push("список источников не найден");

  const out = `// Imported from «${path.basename(src)}» by essay/assets/bin/import.js. The words are the
// original's; headings, lists, figures and sources were recognised automatically — check
// them against the original before the first build.
module.exports = ({ contents, intro, chapter, section, point, p, list, figure, conclusion, sources, appendix }) => ({
  description: ${q(title["Тема"] ? `Реферат на тему «${title["Тема"]}»` : "Реферат")},
  keywords: "",
  body: [
    ${body.join(",\n    ")},
  ],
});
`;
  fs.writeFileSync(path.join(dir, "build.js"), out);

  const variant = title["Вариант"];
  delete title["Вариант"];
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ title, docProps: null }, null, 2) + "\n");
  if (variant) notes.push(`вариант № ${variant}: на титульном листе по шаблону не печатается`);

  const need = ["Город", "Год", "Выполнил", "Группа", "Должность", "Дисциплина", "Тема", "Принял"].filter((k) => !title[k]);
  console.log(`${path.join(dir, "build.js")}: блоков ${body.length}, рисунков ${figN}, источников ${sources.length}, приложений ${appN}`);
  console.log(`${path.join(dir, "meta.json")}: ${Object.entries(title).map(([k, v]) => `${k}: ${v}`).join("; ")}`);
  if (need.length) console.log(`НЕ НАЙДЕНО на титульном листе: ${need.join(", ")} — впишите в meta.json перед сборкой`);
  for (const n of notes) console.log(`проверить: ${n}`);
})().catch((e) => { console.error("ОШИБКА: " + e.message); process.exit(1); });
