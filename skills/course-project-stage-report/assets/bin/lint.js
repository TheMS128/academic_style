#!/usr/bin/env node
// Checks a built report (assets/lint). One line per problem with the rule id;
// exit code 1 when there are errors. --project reads RULES.MD there for the theory flag.
//
//   node lint.js <report.docx> [--project <dir>]

const fs = require("fs");
const path = require("path");
const { lint, formatProblem } = require("../lint");
const { parseParagraphs } = require("../lint/parse");
const { theoryFlag } = require("../lib/meta");

if (require.main === module) {
  const args = process.argv.slice(2);
  const pi = args.indexOf("--project");
  const project = pi >= 0 ? args.splice(pi, 2)[1] : null;
  const file = args[0];
  if (!file) {
    console.error("usage: node lint.js <report.docx> [--project <dir>]");
    process.exit(2);
  }
  const ctx = {};
  if (project) {
    const rules = path.join(project, "RULES.MD");
    const ctxFile = path.join(project, "CONTEXT.MD");
    const discipline = fs.existsSync(ctxFile) ? (fs.readFileSync(ctxFile, "utf8").match(/^\s*Дисциплина\s*:\s*(.+?)\s*$/m) || [])[1] : "";
    if (fs.existsSync(rules)) ctx.theory = theoryFlag(fs.readFileSync(rules, "utf8"), discipline);
  }
  lint(file, ctx).then((problems) => {
    if (!problems.length) console.log("lint: замечаний нет");
    for (const x of problems) console.log(formatProblem(x));
    process.exitCode = problems.some((x) => x.level === "error") ? 1 : 0;
  });
}

module.exports = { lint, parseParagraphs };
