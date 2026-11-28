#!/usr/bin/env node
// Builds an essay from its content file. The content file holds no path to this skill:
// it exports a function that receives the block API and returns the essay.
//
//   node build.js essay/<name>
//
//   // essay/<name>/build.js
//   module.exports = ({ contents, intro, chapter, section, point, p, list, steps, figure,
//                       table, listing, conclusion, sources, appendix }) => ({
//     description: "…",
//     keywords: "…",
//     body: [contents(), intro(), p("…"), chapter("История вопроса"), …, conclusion(), p("…"),
//            sources([["key", "Запись по ГОСТ Р 7.0.100"]])],
//   });

const fs = require("fs");
const path = require("path");

const fail = (msg) => { console.error(msg); process.exit(2); };

const arg = process.argv[2];
if (!arg) fail("usage: node build.js essay/<name>");
const dir = path.resolve(arg);
const file = path.join(dir, "build.js");
if (!fs.existsSync(file)) fail(`нет файла ${file}`);

let lib;
try { lib = require("../lib"); } catch (e) { fail(e.message); }
const { run, buildEssay, ...api } = lib;
const content = require(file);
if (typeof content !== "function") fail(`${file}: файл должен экспортировать функцию от блоков`);

const essay = content(api);
if (!essay || !Array.isArray(essay.body)) fail(`${file}: функция должна вернуть объект с массивом body`);
run({ dir, ...essay });
