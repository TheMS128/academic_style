// course-project builder — public API.
//
//   node <assets>/bin/build.js kp/<project>     — the usual way: kp/<project>/build.js
//   exports a function of the block calls and holds no path to the skill
//
//   run({ dir, body: [...], description: "…", keywords: "…" })   — what bin/build.js calls
//
// dir holds build.js, figures/ and meta.json (written on the first build). The output
// defaults to "<repo>/<Группа>-<Дисциплина>-КП-ПЗ-<Фамилия>.docx".

const fs = require("fs");
const path = require("path");
const { docx, JSZip, labMeta, labPackage, core } = require("./deps");
const { Document, Packer, Paragraph, Header } = docx;
const { KP, mm } = require("./profile");
const { S, buildStyles, buildNumbering } = require("./styles");
const { loadMeta, fileName, forProps } = require("./meta");
const { titlePage } = require("./title");
const { compose, TOC_MARK } = require("./compose");
const { headerXml } = require("./frame");
const { lint } = require("./check");
const blocks = require("./blocks");

const HDR_MARK = /@@KP-HDR:(frame|big|small)@@/;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The contents as a TOC field with its entries already written, so the headings are in
// place before Word updates the field; the page numbers come with the update.
function tocXml(toc) {
  const fld = (type) => `<w:r><w:fldChar w:fldCharType="${type}"/></w:r>`;
  const instr = (text) => `<w:r><w:instrText xml:space="preserve"> ${text} </w:instrText></w:r>`;
  const entry = (e, i) =>
    `<w:p><w:pPr><w:pStyle w:val="${e.level === 1 ? S.toc1 : S.toc2}"/></w:pPr>` +
    (i === 0 ? fld("begin") + instr('TOC \\o "1-2" \\h \\z \\u') + fld("separate") : "") +
    `<w:hyperlink w:anchor="${e.bookmark}" w:history="1"><w:r><w:t xml:space="preserve">${esc(e.text)}</w:t></w:r><w:r><w:tab/></w:r>` +
    fld("begin") + instr(`PAGEREF ${e.bookmark} \\h`) + fld("separate") + "<w:r><w:t></w:t></w:r>" + fld("end") +
    "</w:hyperlink></w:p>";
  return toc.map(entry).join("") + `<w:p><w:pPr><w:pStyle w:val="${S.toc1}"/></w:pPr>${fld("end")}</w:p>`;
}

async function pack(doc, { title, docProps, description, keywords, profile, toc, stamp }) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  let documentXml = await zip.file("word/document.xml").async("string");
  const mark = new RegExp(`<w:p>(?:(?!<w:p>)[\\s\\S])*?${TOC_MARK}[\\s\\S]*?</w:p>`);
  if (!mark.test(documentXml)) throw new Error("в документе не найдено место содержания");
  documentXml = labPackage.mergeSectionBreaks(documentXml.replace(mark, () => tocXml(toc)));
  zip.file("word/document.xml", documentXml);

  let n = 0;
  for (const name of Object.keys(zip.files).filter((f) => /^word\/header\d*\.xml$/.test(f)).sort()) {
    const kind = ((await zip.file(name).async("string")).match(HDR_MARK) || [])[1];
    if (kind) zip.file(name, headerXml(kind, stamp, profile, 1000 + 100 * n++));
  }
  await labPackage.dropUnusedParts(zip, documentXml);
  await labPackage.stripMedia(zip);
  zip.file("docProps/core.xml", labMeta.coreXml(title, docProps, { description, keywords, language: profile.language.body }));
  zip.file("docProps/app.xml", labMeta.appXml({ title, stats: labMeta.textStats(documentXml), company: profile.organization }));
  if (zip.file("docProps/custom.xml")) zip.file("docProps/custom.xml", labMeta.customXml(title));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

async function buildProject({ dir, body, description = "", keywords = "", repoRoot, out, figdir, profile = KP }) {
  repoRoot ||= labMeta.findRepoRoot(dir);
  const meta = loadMeta(dir, repoRoot);
  const t = meta.data.title;
  out ||= path.join(repoRoot, fileName(t));
  if (!body.length || body[0].kind !== "abstract") throw new Error("body начинается с abstract(…): аннотация — первая часть записки после титульного листа");

  const composed = compose(body, { figdir: figdir || path.join(dir, "figures"), profile, pages: meta.data.pages });
  const { parts } = composed;
  const tx = profile.text, st = profile.stamp, fr = profile.frame;
  const page = (bottom) => ({
    size: { width: profile.page.width, height: profile.page.height },
    margin: { top: mm(tx.top), bottom: mm(bottom), left: mm(tx.left), right: mm(tx.right), header: 284, footer: 284 },
  });
  const under = (stamp) => fr.bottom + stamp + tx.aboveStamp;     // bottom margin of a sheet with a title block
  const hdr = (kind) => new Header({ children: [new Paragraph(`@@KP-HDR:${kind}@@`)] });
  const bigContents = st.contents === "big";

  const doc = new Document({
    features: { updateFields: true },
    styles: buildStyles(profile),
    numbering: buildNumbering(composed.lists, profile),
    sections: [
      { properties: { page: page(tx.bottom) }, headers: { default: hdr("frame") }, children: titlePage(t, profile) },
      { properties: { page: page(under(st.big)) }, headers: { default: hdr("big") }, children: parts.abstract },
      {
        properties: { page: page(under(bigContents ? st.big : st.small)), titlePage: bigContents },
        headers: bigContents ? { first: hdr("big"), default: hdr("small") } : { default: hdr("small") },
        children: parts.contents,
      },
      { properties: { page: page(under(st.small)) }, headers: { default: hdr("small") }, children: parts.main },
    ],
  });

  const docProps = labMeta.nextDocProps(meta.data.docProps);
  const stamp = { code: t["Шифр документа"], topic: t["Тема"], group: t["Группа"], author: t["Выполнил"], checker: t["Принял"] };
  const buf = await pack(doc, { title: forProps(t), docProps, description, keywords, profile, toc: composed.toc, stamp });
  fs.writeFileSync(out, buf);
  meta.data.docProps = docProps;
  labMeta.saveMeta(meta);

  return { out, bytes: buf.length, metaCreated: meta.fresh, metaFile: meta.file, counts: composed.counts, docProps, problems: lint(body, composed) };
}

// for bin/build.js: a short summary, non-zero exit code on build or lint errors
function run(opts) {
  return buildProject(opts)
    .then((r) => {
      const c = r.counts;
      console.log(`${path.basename(r.out)}: ${r.bytes} байт, рисунков ${c.figures}, таблиц ${c.tables}, источников ${c.sources}, приложений ${c.appendices}, ревизия ${r.docProps.revision}`);
      if (r.metaCreated) console.log(`создан ${r.metaFile} — поля титульного листа и основной надписи зафиксированы`);
      if (c.pages === undefined) console.log("число листов пока стоит полем: откройте файл в Word, обновите поля и впишите число в meta.json как \"pages\"");
      for (const x of r.problems) console.log(core.formatProblem(x));
      if (!r.problems.length) console.log("lint: замечаний нет");
      if (r.problems.some((x) => x.level === "error")) process.exitCode = 1;
      return r;
    })
    .catch((e) => {
      console.error("ОШИБКА СБОРКИ: " + e.message);
      process.exitCode = 1;
    });
}

module.exports = { buildProject, run, KP, ...blocks };
