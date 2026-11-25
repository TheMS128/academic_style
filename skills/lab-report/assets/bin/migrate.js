#!/usr/bin/env node
// Turns a build.js of the older kind — one that requires the builder from a skill folder
// in the home directory — into the current form: a function of the block API with no path
// to the skill (blocks.md → B1). The original is kept next to it as build.old.js. Nothing
// else in the file is touched: helpers that read code from the project, escape-hatch
// paragraphs, the profile — all stay as they are.
//
//   node migrate.js reports/<lab> [--check]
//
// --check only reports whether the file can be migrated and writes nothing.

const fs = require("fs");
const path = require("path");

const fail = (msg) => { console.error(msg); process.exit(2); };

const args = process.argv.slice(2);
const check = args.includes("--check");
const dir = args.find((a) => !a.startsWith("--"));
if (!dir) fail("usage: node migrate.js reports/<lab> [--check]");
const file = path.join(path.resolve(dir), "build.js");
const backup = path.join(path.resolve(dir), "build.old.js");
if (!fs.existsSync(file)) fail(`нет файла ${file}`);

const src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
let s = src.replace(/\r\n/g, "\n");

if (/^module\.exports\s*=\s*(\(|async\s*\(|function)/m.test(s) && !/require\.main === module/.test(s))
  fail(`${file} уже в новом формате — миграция не нужна`);

const done = [];
const step = (what, re, to) => {
  const before = s;
  s = s.replace(re, to);
  if (s !== before) done.push(what);
};

// the builder, required by a path into a skill folder: whole expression → the API object
step("подключение сборщика",
  /require\(\s*(?:require\(["']path["']\)|path)\.join\([^;]*?["'][^"']*assets(?:\/lib)?["']\s*\)(?:\s*,\s*["']lib["']\s*\))?\s*\)/g,
  "__api");
step("подключение сборщика",
  /require\(\s*path\.join\(\s*\w+\s*,\s*["']lib["']\s*\)\s*\)/g,
  "__api");
// docx from the skill's node_modules (escape hatch, B10)
step("подключение docx",
  /require\(\s*require\.resolve\(\s*["']docx["']\s*,\s*\{[\s\S]*?\}\s*\)\s*\)/g,
  "__api.docx");
step("подключение docx",
  /require\(\s*require\.resolve\(\s*["']docx["']\s*\)\s*\)/g,
  "__api.docx");
step("подключение docx", /require\(\s*["']docx["']\s*\)/g, "__api.docx");
// the variable that only held the path to the skill — must not be used anywhere after
const pathVar = (s.match(/^const (\w+) = (?:require\(["']path["']\)|path)\.join\(require\(["']os["']\)\.homedir\(\),/m) || [])[1];
step("путь к скиллу",
  /^const \w+ = (?:require\(["']path["']\)|path)\.join\(require\(["']os["']\)\.homedir\(\),[^\n]*\n/m,
  "");
// the tail: export + direct run → return the options
step("экспорт", /^module\.exports\s*=\s*\{\s*body\s*\};?\s*\n/m, "");
step("запуск", /if\s*\(\s*require\.main\s*===\s*module\s*\)\s*run\(/, "return (");

const left = [];
if (/\.claude\/skills|\.claude\\\\skills/.test(s)) left.push("в файле остался путь к папке скилла");
if (pathVar && new RegExp(`\\b${pathVar}\\b`).test(s)) left.push(`переменная пути к скиллу «${pathVar}» используется дальше в коде`);
if (!/return \(/.test(s)) left.push("не найден запуск `if (require.main === module) run(…)`");

if (left.length) fail(`${file}: автоматически не переводится — ${left.join("; ")}. Перенесите вручную по B1.`);

const out = [
  "// Content of the report. Built with: node <lab-report assets>/bin/build.js <this folder>",
  `// Migrated from the older form; the original is ${path.basename(backup)}.`,
  "module.exports = (__api) => {",
  s.trimEnd().split("\n").map((l) => (l ? "  " + l : l)).join("\n"),
  "};",
  "",
].join("\n");

if (check) {
  console.log(`${file}: переводится (${[...new Set(done)].join(", ")})`);
  process.exit(0);
}
if (fs.existsSync(backup)) fail(`${backup} уже есть — миграция, видимо, уже делалась; сравните файлы вручную`);
fs.copyFileSync(file, backup);
fs.writeFileSync(file, out.replace(/\n/g, eol));
console.log(`${file}: переведён (${[...new Set(done)].join(", ")}); оригинал — ${path.basename(backup)}`);
