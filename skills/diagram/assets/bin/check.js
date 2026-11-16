#!/usr/bin/env node
// Checks a diagram before it goes into a document: nothing lies on anything (C), and
// every element on it has passed the selection (M).
//
//   node check.js <diagram.svg> [--scope <file.scope.md>] [--no-scope] [--lifelines] [--json]
//
// The scope file defaults to <diagram>.scope.md next to the SVG. --lifelines is for
// sequence diagrams: vertical lines are lifelines, and messages cross them by design.
// Exit code 1 when there is an error.

const fs = require("fs");
const path = require("path");
const { measure } = require("../lib/measure");
const { analyse } = require("../lib/overlap");
const { checkScope } = require("../lib/scope");

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const option = (name) => { const i = args.indexOf(name); if (i < 0) return null; return args.splice(i, 2)[1]; };
const json = flag("--json"), lifelines = flag("--lifelines"), noScope = flag("--no-scope");
let scopeFile = option("--scope");
const svg = args[0];
if (!svg) { console.error("usage: node check.js <diagram.svg> [--scope file.scope.md] [--no-scope] [--lifelines] [--json]"); process.exit(2); }

let result;
try {
  result = analyse(measure(svg), { lifelines });
} catch (e) {
  console.error("ОШИБКА: " + e.message);
  process.exit(2);
}
const problems = [...result.problems];
if (!noScope) {
  scopeFile ||= svg.replace(/\.svg$/i, "") + ".scope.md";
  if (!fs.existsSync(scopeFile)) problems.push({ level: "error", id: "M1", msg: `нет файла отбора ${path.basename(scopeFile)}: вопрос схемы и решение по каждому элементу записываются до рисования` });
  else problems.push(...checkScope(fs.readFileSync(scopeFile, "utf8"), result));
}
problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));

if (json) console.log(JSON.stringify({ problems, nodes: result.nodes.length, lines: result.edges.length, texts: result.texts.length }, null, 2));
else {
  console.log(`${path.basename(svg)}: фигур ${result.nodes.length}, линий ${result.edges.length}, надписей ${result.texts.length}`);
  for (const p of problems) console.log(`${p.level === "error" ? "ОШИБКА" : "замечание"} [${p.id}]: ${p.msg}`);
  if (!problems.length) console.log("проверка: наложений нет, отбор элементов согласован со схемой");
}
if (problems.some((p) => p.level === "error")) process.exitCode = 1;
