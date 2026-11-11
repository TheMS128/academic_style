#!/usr/bin/env node
// Title-page fields a build of <reportDir> will use, as the markdown table for the
// confirmation step (intake.md → I2). Reads meta.json if the report was built before,
// otherwise RULES.MD / CONTEXT.MD. A missing or invalid value is marked in the table.
//
//   node fields.js <reportDir>

const fs = require("fs");
const path = require("path");
const { FIELDS, readSources, findRepoRoot, invalidFields, theoryFlag } = require("../lib/meta");
const { VLSU } = require("../lib/profile");

const reportDir = path.resolve(process.argv[2] || ".");
const metaFile = path.join(reportDir, "meta.json");
const repoRoot = findRepoRoot(reportDir);

let rows, title;
if (fs.existsSync(metaFile)) {
  title = JSON.parse(fs.readFileSync(metaFile, "utf8")).title || {};
  rows = FIELDS.map(([key]) => [key, title[key], "meta.json"]);
} else {
  title = readSources(repoRoot).fields;
  rows = FIELDS.map(([key, file]) => [key, title[key], file]);
}
const bad = new Map(invalidFields(title, VLSU).map((m) => [m.split(":")[0], m.slice(m.indexOf("—") + 2)]));
const header = VLSU.title.headerLines;
rows.push(
  ["Институт", header.slice(3, 6).join(" "), "профиль ВлГУ"],
  ["Кафедра", header[6].replace(/^Кафедра\s+/, ""), "профиль ВлГУ"],
);

console.log("| Поле | Значение | Источник |");
console.log("| --- | --- | --- |");
for (const [key, value, source] of rows) {
  const shown = value == null ? "**НЕ ЗАПОЛНЕНО**" : bad.has(key) ? `${value} — **НЕВЕРНО: ${bad.get(key)}**` : value;
  console.log(`| ${key} | ${shown} | ${source} |`);
}

const rules = path.join(repoRoot, "RULES.MD");
const flag = theoryFlag(fs.existsSync(rules) ? fs.readFileSync(rules, "utf8") : "", title["Дисциплина"]);
console.log(`\nТеоретический блок: ${flag === "required" ? "требуется" : flag === "not" ? "не требуется" : "**НЕ УКАЗАН в RULES.MD — спросить (intake.md → I5)**"}`);
