// lab-report builder — public API.
//
//   node <assets>/bin/build.js reports/<lab>     — the usual way: reports/<lab>/build.js
//   exports a function of the block calls and holds no path to the skill (blocks.md → B1)
//
//   run({ reportDir, body: [...], description: "…", keywords: "…" })   — what bin/build.js calls
//
// reportDir holds build.js, figures/ and meta.json (written on the first build).
// The output defaults to "<repo>/<Аббревиатура дисциплины>_<N>_<Фамилия>.docx", e.g. "ОАиП_1_Парфеньев.docx".

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { Document, Packer } = require("docx");
const { VLSU } = require("./profile");
const { buildStyles, buildNumbering } = require("./styles");
const { loadMeta, saveMeta, nextDocProps, coreXml, appXml, customXml, textStats, findRepoRoot, reportFileName, theoryFlag } = require("./meta");
const { titlePage } = require("./title");
const { compose } = require("./compose");
const { lint, formatProblem } = require("../lint");
const blocks = require("./blocks");

// docx-js closes every non-final section with an extra empty paragraph that holds the
// section break, and that paragraph takes a line of its own on the title page. Move
// the break into the section's last paragraph instead.
function mergeSectionBreaks(xml) {
  const empty = /<w:p><w:pPr>(<w:sectPr>[\s\S]*?<\/w:sectPr>)<\/w:pPr><\/w:p>/g;
  let out = "";
  let last = 0;
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

// docx-js writes comments, footnotes and endnotes parts into every package, used or not.
// A part the document never refers to is dropped together with its relationship and its
// content type; one that is in use stays.
const UNUSED_PARTS = [
  { part: "comments", ref: /<w:comment(Reference|RangeStart)\b/ },
  { part: "footnotes", ref: /<w:footnoteReference\b/ },
  { part: "endnotes", ref: /<w:endnoteReference\b/ },
];
async function dropUnusedParts(zip, documentXml) {
  const relsFile = "word/_rels/document.xml.rels";
  let rels = await zip.file(relsFile).async("string");
  let types = await zip.file("[Content_Types].xml").async("string");
  for (const { part, ref } of UNUSED_PARTS) {
    if (ref.test(documentXml) || !zip.file(`word/${part}.xml`)) continue;
    zip.remove(`word/${part}.xml`);
    zip.remove(`word/_rels/${part}.xml.rels`);
    rels = rels.replace(new RegExp(`<Relationship [^>]*Target="${part}\\.xml"[^>]*/>`, "g"), "");
    types = types.replace(new RegExp(`<Override [^>]*PartName="/word/${part}\\.xml"[^>]*/>`, "g"), "");
  }
  zip.file(relsFile, rels);
  zip.file("[Content_Types].xml", types);
}

// A PNG may carry text, time and EXIF chunks — the tool that made it, a date, a device.
// None of it belongs in the report: only the chunks that draw the picture are kept.
const PNG_DRAWING = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "bKGD", "pHYs"]);
function stripPngMetadata(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return buf;
  const out = [buf.subarray(0, 8)];
  for (let o = 8; o + 12 <= buf.length; ) {
    const size = 12 + buf.readUInt32BE(o);
    if (PNG_DRAWING.has(buf.toString("latin1", o + 4, o + 8))) out.push(buf.subarray(o, o + size));
    o += size;
  }
  return Buffer.concat(out);
}

// docx-js always stamps created = modified = now and an empty app.xml and custom.xml;
// replace all three
async function pack(doc, { title, docProps, description, keywords, profile }) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  const documentXml = mergeSectionBreaks(await zip.file("word/document.xml").async("string"));
  zip.file("word/document.xml", documentXml);
  await dropUnusedParts(zip, documentXml);
  for (const name of Object.keys(zip.files).filter((n) => /^word\/media\/.+\.png$/i.test(n)))
    zip.file(name, stripPngMetadata(await zip.file(name).async("nodebuffer")));
  zip.file("docProps/core.xml", coreXml(title, docProps, { description, keywords, language: profile.language.body }));
  zip.file("docProps/app.xml", appXml({ title, stats: textStats(documentXml), company: profile.organization }));
  if (zip.file("docProps/custom.xml")) zip.file("docProps/custom.xml", customXml(title));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

async function buildReport({ reportDir, body, description = "", keywords = "", repoRoot, out, figdir, profile = VLSU }) {
  repoRoot ||= findRepoRoot(reportDir);
  const meta = loadMeta(reportDir, repoRoot, profile);
  const t = meta.data.title;
  out ||= path.join(repoRoot, reportFileName(t));

  const { children, numberingRefs, counts } = compose(body, { figdir: figdir || path.join(reportDir, "figures"), profile });
  const page = { margin: profile.page.margin, size: { width: profile.page.width, height: profile.page.height } };
  const doc = new Document({
    styles: buildStyles(profile),
    numbering: buildNumbering(numberingRefs, profile),
    sections: [
      {
        properties: { page, ...(profile.title.verticalAlign ? { verticalAlign: profile.title.verticalAlign } : {}) },
        children: titlePage(t, profile),
      },
      { properties: { page }, children },
    ],
  });

  const docProps = nextDocProps(meta.data.docProps);
  const buf = await pack(doc, { title: t, docProps, description, keywords, profile });
  fs.writeFileSync(out, buf);
  meta.data.docProps = docProps;
  saveMeta(meta);

  const rules = path.join(repoRoot, "RULES.MD");
  const theory = theoryFlag(fs.existsSync(rules) ? fs.readFileSync(rules, "utf8") : "", t["Дисциплина"]);
  return { out, bytes: buf.length, metaCreated: meta.fresh, metaFile: meta.file, ...counts, docProps, problems: await lint(out, { theory }) };
}

// for build.js: short summary, non-zero exit code on build or lint errors
function run(opts) {
  return buildReport(opts)
    .then((r) => {
      console.log(`${path.basename(r.out)}: ${r.bytes} байт, рисунков ${r.figures}, таблиц ${r.tables}, ревизия ${r.docProps.revision}`);
      if (r.metaCreated) console.log(`создан ${r.metaFile} — поля титульника зафиксированы`);
      for (const x of r.problems) console.log(formatProblem(x));
      if (!r.problems.length) console.log("lint: замечаний нет");
      if (r.problems.some((x) => x.level === "error")) process.exitCode = 1;
      return r;
    })
    .catch((e) => {
      console.error("ОШИБКА СБОРКИ: " + e.message);
      process.exitCode = 1;
    });
}

module.exports = { buildReport, run, VLSU, ...blocks };
