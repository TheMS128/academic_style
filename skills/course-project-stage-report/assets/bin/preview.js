#!/usr/bin/env node
// Renders a .docx to PNG through docx-preview in headless Edge and reports how many
// pages each section takes. docx-preview breaks pages only at explicit page and
// section breaks, so this checks the title page (section 1 must be exactly one page)
// and the overall look of styles — not where Word breaks the flowing text.
//
//   node preview.js <report.docx> [out.png] [--height 2400]

const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");
const { runEdge } = require("../lib/edge");

const lib = (rel) => pathToFileURL(path.join(__dirname, "../node_modules", rel)).href;

function preview(docx, png, height = 2400) {
  const b64 = fs.readFileSync(docx).toString("base64");
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#777">
<pre id="report" style="display:none">pending</pre><div id="c"></div>
<script src="${lib("jszip/dist/jszip.min.js")}"></script>
<script src="${lib("docx-preview/dist/docx-preview.min.js")}"></script>
<script>
const bin = Uint8Array.from(atob("${b64}"), (c) => c.charCodeAt(0));
docx.renderAsync(new Blob([bin]), document.getElementById("c"), null,
  { breakPages: true, ignoreLastRenderedPageBreak: true, experimental: true })
  .then(() => {
    const sections = [...document.querySelectorAll("section.docx")];
    document.getElementById("report").textContent =
      JSON.stringify(sections.map((s) => [s.offsetHeight, parseFloat(getComputedStyle(s).minHeight)]));
  })
  .catch((e) => { document.getElementById("report").textContent = "ERR " + e.message; });
</script>`;
  const htmlPath = path.join(os.tmpdir(), `lab-report-preview-${process.pid}.html`);
  fs.writeFileSync(htmlPath, html);
  const common = ["--allow-file-access-from-files", "--virtual-time-budget=10000"];
  try {
    if (png) {
      fs.rmSync(path.resolve(png), { force: true });
      runEdge([...common, "--hide-scrollbars", `--screenshot=${path.resolve(png)}`, `--window-size=860,${height}`, htmlPath],
        { stdio: "ignore", timeout: 120000 });
      // Edge exits 0 without writing the file when it cannot (e.g. a path over 260 chars)
      if (!fs.existsSync(path.resolve(png))) throw new Error(`Edge не записал ${path.resolve(png)} — путь длиннее 260 символов или каталог недоступен`);
    }
    const dom = runEdge([...common, "--dump-dom", htmlPath], { timeout: 120000, maxBuffer: 1 << 30 }).toString();
    const raw = (dom.match(/<pre id="report"[^>]*>([^<]*)<\/pre>/) || [])[1] || "no report";
    if (!raw.startsWith("[")) throw new Error("docx-preview: " + raw);
    return JSON.parse(raw).map(([h, pageH], i) => ({ section: i + 1, pages: Math.round((h / pageH) * 10) / 10 }));
  } finally {
    fs.rmSync(htmlPath, { force: true });
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const hi = args.indexOf("--height");
  const height = hi >= 0 ? +args.splice(hi, 2)[1] : 2400;
  const [docx, png] = args;
  if (!docx) {
    console.error("usage: node preview.js <report.docx> [out.png] [--height 2400]");
    process.exit(2);
  }
  let sections;
  try {
    sections = preview(docx, png, height);
  } catch (e) {
    console.error("ОШИБКА: " + e.message);
    process.exit(1);
  }
  for (const s of sections) console.log(`раздел ${s.section}: ${s.pages} стр.`);
  if (sections[0] && sections[0].pages > 1) {
    console.log("ОШИБКА: титульник не помещается на одну страницу");
    process.exitCode = 1;
  }
  if (png) console.log("PNG: " + path.resolve(png));
}

module.exports = { preview };
