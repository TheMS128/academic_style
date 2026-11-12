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
const { mergeSectionBreaks, dropUnusedParts, stripMedia } = require("./package");

// docx-js always stamps created = modified = now and an empty app.xml and custom.xml;
// replace all three
async function pack(doc, { title, docProps, description, keywords, profile }) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  const documentXml = mergeSectionBreaks(await zip.file("word/document.xml").async("string"));
  zip.file("word/document.xml", documentXml);
  await dropUnusedParts(zip, documentXml);
  await stripMedia(zip);
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
