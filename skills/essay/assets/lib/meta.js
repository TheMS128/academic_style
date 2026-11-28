// Title fields of the essay. They come from the project's RULES.MD (the student, stable)
// and CONTEXT.MD (the essay at hand) by exact key and are frozen into <dir>/meta.json on
// the first build; later builds read only meta.json. An essay imported from a .docx
// (bin/import.js) gets its meta.json from the title page of that file.

const fs = require("fs");
const path = require("path");
const { labMeta } = require("./deps");
const { readKey, isPlaceholder, invalidFields, surname, disciplineAbbr } = labMeta;

// [key as written in the source file, source file]
const FIELDS = [
  ["Город", "RULES.MD"],
  ["Год", "RULES.MD"],
  ["Выполнил", "RULES.MD"],
  ["Группа", "RULES.MD"],
  ["Должность", "RULES.MD"],
  ["Дисциплина", "CONTEXT.MD"],
  ["Тема", "CONTEXT.MD"],
  ["Принял", "CONTEXT.MD"],
];

function loadMeta(dir, repoRoot) {
  const file = path.join(dir, "meta.json");
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const missing = FIELDS.map(([key]) => key).filter((key) => !data.title?.[key] || isPlaceholder(data.title[key]));
    if (missing.length) throw new Error(`${file}: не заполнены поля ${missing.join(", ")} — впишите их в meta.json`);
    const bad = invalidFields(data.title);
    if (bad.length) throw new Error(`${file}: неверные поля — ${bad.join("; ")}`);
    return { file, data, fresh: false };
  }
  labMeta.requireProjectFiles(repoRoot);
  const fields = {}, missing = [];
  for (const [key, source] of FIELDS) {
    const value = readKey(fs.readFileSync(path.join(repoRoot, source), "utf8"), key);
    if (value) fields[key] = value;
    else missing.push(`${key} (${source})`);
  }
  Object.assign(fields, labMeta.readOptional(repoRoot).fields);   // «Кафедра», «Университет»
  if (missing.length) throw new Error("Не заполнены поля титульного листа: " + missing.join(", "));
  const bad = invalidFields(fields);
  if (bad.length) throw new Error("Неверные поля (RULES.MD / CONTEXT.MD): " + bad.join("; "));
  return { file, data: { title: fields, docProps: null }, fresh: true };
}

// «ВвП_Реферат_Онисимчук.docx»: discipline, kind of work, surname
const fileName = (t) => `${[disciplineAbbr(t["Дисциплина"]), "Реферат", surname(t["Выполнил"])].join("_")}.docx`;

// the title fields as the lab report's title page and document properties expect them
const forTitle = (t) => ({ ...t, "Тип работы": "Реферат" });

module.exports = { FIELDS, loadMeta, fileName, forTitle };
