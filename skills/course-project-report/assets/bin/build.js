#!/usr/bin/env node
// Builds the explanatory note from its content file. The content file holds no path to
// this skill: it exports a function that receives the block API and returns the note.
//
//   node build.js kp/<project>
//
//   // kp/<project>/build.js
//   module.exports = ({ abstract, intro, chapter, section, p, sources, conclusion }) => ({
//     description: "…",
//     keywords: "…",
//     body: [abstract(["…"], ["…"]), intro(), p("…"), chapter("Анализ предметной области"), …],
//   });
//
// The function may also return `profile` (start from the `KP` it is given) and `out`.

const fs = require("fs");
const path = require("path");

const fail = (msg) => { console.error(msg); process.exit(2); };

const arg = process.argv[2];
if (!arg) fail("usage: node build.js kp/<project>");
const dir = path.resolve(arg);
const file = path.join(dir, "build.js");
if (!fs.existsSync(file)) fail(`нет файла ${file}`);

let lib;
try { lib = require("../lib"); } catch (e) { fail(e.message); }
const { run, buildProject, ...api } = lib;
const content = require(file);
if (typeof content !== "function") fail(`${file}: файл должен экспортировать функцию от блоков`);

const note = content(api);
if (!note || !Array.isArray(note.body)) fail(`${file}: функция должна вернуть объект с массивом body`);
run({ dir, ...note });
