#!/usr/bin/env node
// Title-page fields a build of <reportDir> will use, as the markdown table for the
// confirmation step (intake.md → I2). Reads meta.json if the report was built before,
// otherwise RULES.MD / CONTEXT.MD. A missing or invalid value is marked in the table.
//
//   node fields.js <reportDir>

const fs = require("fs");
const path = require("path");
const { FIELDS, readSources, findRepoRoot, invalidFields, theoryFlag, titleHeader } = require("../lib/meta");
const { VLSU } = require("../lib/profile");

const reportDir = path.resolve(process.argv[2] || ".");
const metaFile = path.join(reportDir, "meta.json");
const repoRoot = findRepoRoot(reportDir);

let rows, title, sources = {};
if (fs.existsSync(metaFile)) {
  title = JSON.parse(fs.readFileSync(metaFile, "utf8")).title || {};
  rows = FIELDS.map(([key]) => [key, title[key], "meta.json"]);
  for (const key of ["Институт", "Кафедра"]) if (title[key]) sources[key] = "meta.json";
} else {
  ({ fields: title, sources } = readSources(repoRoot));
  rows = FIELDS.map(([key, file]) => [key, title[key], file]);
}
const bad = new Map(invalidFields(title, VLSU).map((m) => [m.split(":")[0], m.slice(m.indexOf("—") + 2)]));
// the institute and the department: the optional fields «Институт» / «Кафедра» when set,
// otherwise the department of the profile
const own = VLSU.title.headerLines;
const ownDept = own.find((l) => /^Кафедра\s/.test(l)) || "";
rows.push(
  title["Институт"]
    ? ["Институт", title["Институт"], sources["Институт"]]
    : ["Институт", "не печатается (необязательное поле «Институт:» в RULES.MD / CONTEXT.MD)", "—"],
  title["Кафедра"]
    ? ["Кафедра", title["Кафедра"], sources["Кафедра"]]
    : ["Кафедра", ownDept.replace(/^Кафедра\s+/, "") + " (по умолчанию; другая — поле «Кафедра:» в RULES.MD / CONTEXT.MD)", "профиль ВлГУ"],
);
if (title["Кафедра"] || title["Институт"]) {
  const shown = titleHeader(title, own).slice(own.indexOf("(ВлГУ)") + 1);
  console.log(`Шапка титульника после «(ВлГУ)»: ${shown.join(" / ")}\n`);
}

console.log("| Поле | Значение | Источник |");
console.log("| --- | --- | --- |");
for (const [key, value, source] of rows) {
  const shown = value == null ? "**НЕ ЗАПОЛНЕНО**" : bad.has(key) ? `${value} — **НЕВЕРНО: ${bad.get(key)}**` : value;
  console.log(`| ${key} | ${shown} | ${source} |`);
}

const rules = path.join(repoRoot, "RULES.MD");
const flag = theoryFlag(fs.existsSync(rules) ? fs.readFileSync(rules, "utf8") : "", title["Дисциплина"]);
console.log(`\nТеоретический блок: ${flag === "required" ? "требуется" : flag === "not" ? "не требуется" : "**НЕ УКАЗАН в RULES.MD — спросить (intake.md → I5)**"}`);
