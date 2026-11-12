#!/usr/bin/env node
// CLI: node render.js <input.md> <output.docx> --title "Название" [--year 2026]

const { buildMethodichka } = require("../lib");

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const input = process.argv[2];
const out = process.argv[3];
if (!input || !out) {
  console.error("Использование: node render.js <input.md> <output.docx> --title \"…\" [--year 2026]");
  process.exit(1);
}

buildMethodichka({
  input,
  out,
  title: arg("title", "Учебная дисциплина"),
  year: Number(arg("year", new Date().getFullYear())),
  author: arg("author", ""),
})
  .then((r) => console.log(`${r.out}: ${r.bytes} байт`))
  .catch((e) => { console.error("ОШИБКА: " + e.message); process.exit(1); });
