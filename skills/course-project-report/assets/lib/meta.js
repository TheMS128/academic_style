// Fields of the title page and of the title block. They come from the project's RULES.MD
// (the student, stable) and CONTEXT.MD (the project at hand) by exact key and are frozen
// into <dir>/meta.json on the first build; later builds read only meta.json.

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
  ["Шифр документа", "CONTEXT.MD"],
];

// «ВлГУ.09.03.04.16 ПЗ»: organisation, code of the programme, number, kind of document
const CODE = /^\S+(\.\d+)+ ПЗ$/;

function check(fields) {
  const bad = invalidFields(fields);
  if (fields["Шифр документа"] && !CODE.test(fields["Шифр документа"]))
    bad.push(`Шифр документа: «${fields["Шифр документа"]}» — нужен вид «ВлГУ.09.03.04.16 ПЗ»`);
  return bad;
}

function loadMeta(dir, repoRoot) {
  const file = path.join(dir, "meta.json");
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const missing = FIELDS.map(([key]) => key).filter((key) => !data.title?.[key] || isPlaceholder(data.title[key]));
    if (missing.length) throw new Error(`${file}: не заполнены поля ${missing.join(", ")}`);
    const bad = check(data.title);
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
  if (missing.length) throw new Error("Не заполнены поля титульного листа и основной надписи: " + missing.join(", "));
  const bad = check(fields);
  if (bad.length) throw new Error("Неверные поля (RULES.MD / CONTEXT.MD): " + bad.join("; "));
  return { file, data: { title: fields, docProps: null }, fresh: true };
}

// «ПРИ123-ТП-КП-ПЗ-Иванов.docx»: group without the hyphen, discipline, kind of work and document, surname
const fileName = (t) => `${[t["Группа"].replace(/-/g, ""), disciplineAbbr(t["Дисциплина"]), "КП", "ПЗ", surname(t["Выполнил"])].join("-")}.docx`;

// the title fields in the shape the shared document properties expect
const forProps = (t) => ({ ...t, "Тип работы": "Курсовой проект" });

module.exports = { FIELDS, loadMeta, fileName, forProps };
