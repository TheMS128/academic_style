// Checks a built report. Every problem carries the id of the rule it enforces
// (S — structure.md, B — blocks.md, V / T — voice.md, F — facts.md), so a fix starts
// from that one rule. Errors first.
//
//   lint(file, { theory: "required" | "not" })

const fs = require("fs");
const JSZip = require("jszip");
const { parseDocument } = require("./parse");

const CHECKS = [require("./format"), require("./structure"), require("./voice")]; // format first: it numbers figures

async function lint(file, ctx = {}) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const read = (name) => (zip.file(name) ? zip.file(name).async("string") : Promise.resolve(""));
  const [doc, styles, core] = await Promise.all([read("word/document.xml"), read("word/styles.xml"), read("docProps/core.xml")]);
  const d = parseDocument({ doc, styles, core });
  const problems = [];
  const r = {
    err: (id, msg) => problems.push({ level: "error", id, msg }),
    warn: (id, msg) => problems.push({ level: "warn", id, msg }),
  };
  for (const check of CHECKS) check(d, r, ctx);
  return problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}

const formatProblem = (x) => `${x.level === "error" ? "ОШИБКА" : "замечание"} [${x.id}]: ${x.msg}`;

module.exports = { lint, formatProblem };
