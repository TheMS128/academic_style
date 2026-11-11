// lab-report builder — public API.
//
//   const { run, chapter, subchapter, p, list, figure, table, listing } =
//     require(require("path").join(require("os").homedir(), "<skill-from-home>/assets/lib"));
//   (<skill-from-home>: the skill directory relative to the home dir — blocks.md → B1)
//   run({ reportDir: __dirname, body: [...], description: "…", keywords: "…" });
//
// reportDir holds build.js, figures/ and meta.json (written on the first build).
// The output defaults to "<repo>/<Аббревиатура дисциплины>_<N>_<Фамилия>.docx", e.g. "ОАиП_1_Парфеньев.docx".

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { Document, Packer } = require("docx");
const { VLSU } = require("./profile");
const { buildStyles, buildNumbering } = require("./styles");
const { loadMeta, saveMeta, nextDocProps, coreXml, appXml, findRepoRoot, reportFileName, theoryFlag } = require("./meta");
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

// docx-js always stamps created = modified = now and an empty app.xml; replace both
async function pack(doc, { title, docProps, description, keywords }) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  zip.file("word/document.xml", mergeSectionBreaks(await zip.file("word/document.xml").async("string")));
  zip.file("docProps/core.xml", coreXml(title, docProps, { description, keywords }));
  zip.file("docProps/app.xml", appXml());
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
  const buf = await pack(doc, { title: t, docProps, description, keywords });
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
