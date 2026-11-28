// essay builder — public API.
//
//   node <assets>/bin/build.js essay/<name>     — essay/<name>/build.js exports a function
//   of the block calls and holds no path to the skill
//
// The title page is the lab report's (lab-report title.js) with «Реферат»; the text is
// composed by the course project's composer: contents, numbered chapters in capitals,
// sections, sources, appendices. No frame, no title block; page numbers at the bottom.

const fs = require("fs");
const path = require("path");
const { docx, labMeta, labTitle, labProfile, kpStyles, kpCompose, kpCheck, kpIndex, kpBlocks } = require("./deps");
const { Document, Paragraph, Footer, TextRun, PageNumber, AlignmentType } = docx;
const { ESSAY, mm } = require("./profile");
const { loadMeta, fileName, forTitle } = require("./meta");

const PROFILE = path.resolve(__dirname, "..", "..", "profile.json");

const { abstract, ...blocks } = kpBlocks;   // an essay has no abstract

async function buildEssay({ dir, body, description = "", keywords = "", repoRoot, out, figdir, profile = ESSAY }) {
  // an imported essay brings its title fields in meta.json and needs no RULES.MD: the file
  // then goes to the folder that holds essay/<name>
  if (!repoRoot) {
    try { repoRoot = labMeta.findRepoRoot(dir); } catch (e) {
      if (!fs.existsSync(path.join(dir, "meta.json"))) throw e;
      repoRoot = path.resolve(dir, "..", "..");
    }
  }
  const meta = loadMeta(dir, repoRoot);
  const t = meta.data.title;
  out ||= path.join(repoRoot, fileName(t));
  if (!body.length || body[0].kind !== "contents") throw new Error("body начинается с contents(): содержание — первая часть реферата после титульного листа");
  if (body.some((b) => b.kind === "abstract")) throw new Error("в реферате нет аннотации — уберите abstract(…)");

  const composed = kpCompose.compose(body, { figdir: figdir || path.join(dir, "figures"), profile });
  const { parts } = composed;
  const tx = profile.text;
  const page = {
    size: { width: profile.page.width, height: profile.page.height },
    margin: { top: mm(tx.top), bottom: mm(tx.bottom), left: mm(tx.left), right: mm(tx.right), footer: profile.footer },
  };
  const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] });
  const titleChildren = labTitle.titlePage(forTitle(t), labProfile);
  const labPage = { size: { width: labProfile.page.width, height: labProfile.page.height }, margin: labProfile.page.margin };

  const doc = new Document({
    features: { updateFields: true },
    styles: kpStyles.buildStyles(profile, { title: labProfile }),
    numbering: kpStyles.buildNumbering(composed.lists, profile),
    sections: [
      { properties: { page: labPage, verticalAlign: labProfile.title.verticalAlign }, children: titleChildren },
      { properties: { page }, footers: { default: footer }, children: parts.contents },
      { properties: { page }, footers: { default: footer }, children: parts.main },
    ],
  });

  const docProps = labMeta.nextDocProps(meta.data.docProps);
  const buf = await kpIndex.pack(doc, { title: forTitle(t), docProps, description, keywords, profile, toc: composed.toc, stamp: {} });
  fs.writeFileSync(out, buf);
  meta.data.docProps = docProps;
  labMeta.saveMeta(meta);

  const problems = kpCheck.lint(body, composed, { profile: PROFILE, required: ["intro", "chapter", "conclusion", "sources"], noun: "реферате" });
  return { out, bytes: buf.length, metaCreated: meta.fresh, metaFile: meta.file, counts: composed.counts, docProps, problems, titleWarnings: titleChildren.warnings || [] };
}

// for bin/build.js: a short summary, non-zero exit code on build or lint errors
function run(opts) {
  return buildEssay(opts)
    .then((r) => {
      const c = r.counts;
      console.log(`${path.basename(r.out)}: ${r.bytes} байт, рисунков ${c.figures}, таблиц ${c.tables}, источников ${c.sources}, приложений ${c.appendices}, ревизия ${r.docProps.revision}`);
      if (r.metaCreated) console.log(`создан ${r.metaFile} — поля титульного листа зафиксированы`);
      for (const w of r.titleWarnings) console.log(`ВНИМАНИЕ (титульник): ${w}`);
      for (const x of r.problems) console.log(`${x.level === "error" ? "ОШИБКА" : "замечание"} [${x.id}]: ${x.msg}`);
      if (!r.problems.length) console.log("lint: замечаний нет");
      console.log("содержание и номера страниц — поля: Word заполнит их при открытии (или Ctrl+A → F9)");
      if (r.problems.some((x) => x.level === "error")) process.exitCode = 1;
      return r;
    })
    .catch((e) => {
      console.error("ОШИБКА СБОРКИ: " + e.message);
      process.exitCode = 1;
    });
}

module.exports = { buildEssay, run, ESSAY, ...blocks };
