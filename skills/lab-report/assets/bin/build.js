#!/usr/bin/env node
// Builds a report from its content file. The content file holds no path to this skill:
// it exports a function that receives the block API and returns the report.
//
//   node build.js reports/<lab>
//
//   // reports/<lab>/build.js
//   module.exports = ({ chapter, subchapter, p, list, figure, table, listing }) => ({
//     description: "…",
//     keywords: "…",
//     body: [chapter("Цель работы"), p("…")],
//   });
//
// The function may also return `profile` (start from the `VLSU` it is given) and `out`.

const fs = require("fs");
const path = require("path");

const fail = (msg) => { console.error(msg); process.exit(2); };

const arg = process.argv[2];
if (!arg) fail("usage: node build.js reports/<lab>");
const reportDir = path.resolve(arg);
const file = path.join(reportDir, "build.js");
if (!fs.existsSync(file)) fail(`нет файла ${file}`);
if (!fs.existsSync(path.join(__dirname, "..", "node_modules", "docx")))
  fail(`зависимости не установлены — выполните один раз: npm i (в папке ${path.join(__dirname, "..")})`);

const { run, buildReport, ...api } = require("../lib");
const content = require(file);
if (typeof content !== "function")
  fail(`${file} написан в старом формате (сам подключает сборщик) — запустите его напрямую: node "${file}"`);

const report = content(api);
if (!report || !Array.isArray(report.body)) fail(`${file}: функция должна вернуть объект с массивом body`);
run({ reportDir, ...report });
