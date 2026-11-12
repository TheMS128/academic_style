// Title-page fields and document properties.
//
// Fields come from RULES.MD (student, stable) and CONTEXT.MD (current work) by exact
// key. On the first build they are frozen into <reportDir>/meta.json, so rebuilding
// an old report never picks up the next lab's CONTEXT.MD. Edit meta.json to change
// a finished report's title page.

const fs = require("fs");
const path = require("path");
const { VLSU } = require("./profile");

// [key as written in the source file, source file]
const FIELDS = [
  ["Город", "RULES.MD"],
  ["Год", "RULES.MD"],
  ["Выполнил", "RULES.MD"],
  ["Группа", "RULES.MD"],
  ["Тип работы", "CONTEXT.MD"],
  ["Номер работы", "CONTEXT.MD"],
  ["Дисциплина", "CONTEXT.MD"],
  ["Тема", "CONTEXT.MD"],
  ["Принял", "CONTEXT.MD"],
  ["Должность", "RULES.MD"],
];

// На титульнике инициалы стоят перед фамилией: «Иванов И. И.» → «И. И. Иванов».
// Значение, уже записанное в этом порядке, не трогается.
function initialsFirst(name) {
  if (!name) return name;
  const m = name.trim().match(/^([^\s.]{2,})\s+((?:[А-ЯЁA-Z]\.\s*){1,3})$/);
  return m ? `${m[2].match(/[А-ЯЁA-Z]\./g).join(" ")} ${m[1]}` : name.trim();
}

// Фамилия из «Фамилия И. О.» или из «И. О. Фамилия».
function surname(name) {
  const words = String(name || "").trim().split(/\s+/).filter((w) => !/^[А-ЯЁA-Z]\.$/.test(w) && !/^([А-ЯЁA-Z]\.)+$/.test(w));
  return words[0] || "";
}

// Аббревиатура дисциплины: первые буквы слов, служебные слова — строчной буквой.
// «Основы алгоритмизации и программирования» → «ОАиП».
const FUNCTION_WORDS = new Set(["и", "в", "во", "на", "по", "с", "со", "для", "о", "об", "к", "из", "от", "до", "а"]);
function disciplineAbbr(name) {
  return String(name || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => (FUNCTION_WORDS.has(w.toLowerCase()) ? w[0].toLowerCase() : w[0].toUpperCase()))
    .join("");
}

// «Лабораторная» → «ЛР», «Практическая» → «ПР», «Курсовой проект» → «КП»; незнакомый тип —
// null (старое имя без префикса). У курсового проекта «Номер работы» — номер этапа.
const WORK_TYPE_ABBR = { "Лабораторная": "ЛР", "Практическая": "ПР", "Курсовой проект": "КП" };
const isCourseProject = (type) => type === "Курсовой проект";
function workTypeAbbr(type) {
  return WORK_TYPE_ABBR[type] || null;
}

// Имя файла отчёта: Аббревиатура_Тип_Номер_Фамилия, например «ОАиП_ЛР_1_Парфеньев».
// Тип работы в имени нужен, чтобы лабораторная и практическая с одним номером в одной
// дисциплине не перезаписывали друг друга; для нераспознанного типа — имя как раньше.
function reportFileName(t) {
  const abbr = workTypeAbbr(t["Тип работы"]);
  const parts = [disciplineAbbr(t["Дисциплина"]), abbr, t["Номер работы"], surname(t["Выполнил"])].filter(Boolean);
  return `${parts.join("_")}.docx`;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// a template placeholder — «<город университета>», «(…)», «[…]» — counts as empty
const isPlaceholder = (v) => /^[<([].*[>)\]]$/.test(v) || /<[^>]*>/.test(v);

// first line `Key: value`, key compared exactly
function readKey(text, key) {
  const m = text.match(new RegExp("^\\s*" + escapeRe(key) + "\\s*:\\s*(\\S.*?)\\s*$", "m"));
  return m && !isPlaceholder(m[1]) ? m[1] : null;
}

// Values the title page can print. Returns «Поле: причина» for every bad value.
const NAME = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)? [А-ЯЁ]\.(?: ?[А-ЯЁ]\.)?$/;
function invalidFields(fields, profile = VLSU) {
  const posts = profile.title.posts || [];
  const rules = {
    "Год": [(v) => /^\d{4}$/.test(v), "четыре цифры"],
    "Номер работы": [(v) => /^\d+$/.test(v), "число"],
    "Тип работы": [(v) => /^(Лабораторная|Практическая|Курсовой проект)$/.test(v), "«Лабораторная», «Практическая» или «Курсовой проект»"],
    "Выполнил": [(v) => NAME.test(v), "формат «Фамилия И. О.»"],
    "Принял": [(v) => NAME.test(v), "формат «Фамилия И. О.», должность — отдельным полем"],
    "Должность": [(v) => !posts.length || posts.includes(v), `одно из: ${posts.join("; ")}`],
  };
  return Object.entries(rules)
    .filter(([key, [ok]]) => fields[key] && !ok(fields[key]))
    .map(([key, [, why]]) => `${key}: «${fields[key]}» — нужно ${why}`);
}

// «Лабораторная» → «лабораторной»: the Вывод stamp «В ходе выполнения <…> работы»
const workTypeGenitive = (type) => String(type || "").toLowerCase().replace(/ая$/, "ой");

// Вывод stamp: «В ходе выполнения лабораторной работы»; a course-project stage —
// «В ходе выполнения этапа курсового проекта».
const conclusionStamp = (type) => isCourseProject(type)
  ? "В ходе выполнения этапа курсового проекта"
  : `В ходе выполнения ${workTypeGenitive(type || "Лабораторная")} работы`;

// First line of the title block: «Лабораторная работа №2»; a course-project stage prints
// «Курсовой проект» — the stage itself is named in Тема («Этап 1. …»).
const workHeading = (t) => isCourseProject(t["Тип работы"])
  ? "Курсовой проект"
  : `${t["Тип работы"]} работа №${t["Номер работы"]}`;

// RULES.MD line «Теоретический блок: требуется / не требуется (<дисциплина>)» for this
// discipline → "required" | "not"; no line or a placeholder → undefined
function theoryFlag(rulesText, discipline) {
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  for (const m of String(rulesText || "").matchAll(/^\s*Теоретический блок\s*:\s*(требуется|не требуется)\s*\(([^)]*)\)/gim)) {
    if (norm(m[2]) === norm(discipline)) return m[1].toLowerCase() === "требуется" ? "required" : "not";
  }
  return undefined;
}

const TEMPLATES = path.resolve(__dirname, "..", "..", "templates");

// The skill lives outside the project; the project supplies RULES.MD (student) and
// CONTEXT.MD (current work). Both are required — without them there is no title page.
function findRepoRoot(from) {
  for (let d = path.resolve(from); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, "RULES.MD"))) return d;
    if (path.dirname(d) === d) {
      throw new Error(
        `RULES.MD не найден ни в ${path.resolve(from)}, ни выше. Скилл lab-report хранится вне проекта, ` +
        `а данные студента и текущей работы берутся из проекта: создайте в корне проекта RULES.MD и CONTEXT.MD ` +
        `по образцам из ${TEMPLATES} и заполните их.`);
    }
  }
}

function requireProjectFiles(repoRoot) {
  const missing = ["RULES.MD", "CONTEXT.MD"].filter((f) => !fs.existsSync(path.join(repoRoot, f)));
  if (missing.length) {
    throw new Error(
      `в корне проекта ${repoRoot} нет ${missing.join(" и ")}. ` +
      `Скопируйте образец из ${TEMPLATES} и заполните: RULES.MD — постоянные данные студента, ` +
      `CONTEXT.MD — тип, номер, дисциплина, тема и преподаватель текущей работы.`);
  }
}

function readSources(repoRoot) {
  requireProjectFiles(repoRoot);
  const cache = {};
  const load = (file) => (cache[file] ??= fs.readFileSync(path.join(repoRoot, file), "utf8"));
  const fields = {};
  const missing = [];
  for (const [key, file] of FIELDS) {
    const value = readKey(load(file), key);
    if (value) fields[key] = value;
    else missing.push(`${key} (${file})`);
  }
  return { fields, missing };
}

function loadMeta(reportDir, repoRoot, profile = VLSU) {
  const file = path.join(reportDir, "meta.json");
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const missing = FIELDS.map(([key]) => key).filter((key) => !data.title?.[key] || isPlaceholder(data.title[key]));
    if (missing.length) throw new Error(`${file}: не заполнены поля ${missing.join(", ")}`);
    const bad = invalidFields(data.title, profile);
    if (bad.length) throw new Error(`${file}: неверные поля — ${bad.join("; ")}`);
    return { file, data, fresh: false };
  }
  const { fields, missing } = readSources(repoRoot);
  if (missing.length) throw new Error("Не заполнены поля титульника: " + missing.join(", "));
  const bad = invalidFields(fields, profile);
  if (bad.length) throw new Error("Неверные поля титульника (RULES.MD / CONTEXT.MD): " + bad.join("; "));
  return { file, data: { title: fields, docProps: null }, fresh: true };
}

const saveMeta = ({ file, data }) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

// Properties in the shape Word for the web leaves behind: created some days before
// the last edit, a revision count in the tens that grows with every rebuild.
function nextDocProps(prev, now = new Date()) {
  if (!prev) {
    const created = new Date(now.getTime() - rnd(24, 14 * 24) * 3600e3 - rnd(0, 59) * 60e3);
    created.setUTCSeconds(0, 0);
    return { created: iso(created), modified: iso(now), revision: rnd(20, 50) };
  }
  return { created: prev.created, modified: iso(now), revision: prev.revision + rnd(1, 3) };
}

const xml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// «Лабораторная работа», «Практическая работа», «Курсовой проект»
const workCategory = (type) => (isCourseProject(type) ? "Курсовой проект" : `${type} работа`);

function coreXml(title, props, { description = "", keywords = "", language = "ru-RU" } = {}) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:title>${xml(title["Тема"])}</dc:title>` +
    `<dc:subject>${xml(isCourseProject(title["Тип работы"]) ? `Курсовой проект, этап ${title["Номер работы"]}` : workHeading(title))}</dc:subject>` +
    `<dc:creator>${xml(initialsFirst(title["Выполнил"]))}</dc:creator>` +
    `<cp:keywords>${xml(keywords)}</cp:keywords>` +
    `<dc:description>${xml(description)}</dc:description>` +
    `<cp:lastModifiedBy>${xml(initialsFirst(title["Выполнил"]))}</cp:lastModifiedBy>` +
    `<cp:revision>${props.revision}</cp:revision>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${props.created}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${props.modified}</dcterms:modified>` +
    `<cp:category>${xml(workCategory(title["Тип работы"]))}</cp:category>` +
    `<dc:language>${xml(language)}</dc:language>` +
    "</cp:coreProperties>";
}

// Counts of the text as it stands in document.xml: words, characters without and with
// spaces, non-empty paragraphs. Pages and lines are not counted — only Word lays the
// text out, and it writes them itself on the first save.
function textStats(documentXml) {
  const paragraphs = (documentXml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [])
    .map((p) => (p.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join("")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&"))
    .filter((t) => t.trim());
  const all = paragraphs.join(" ");
  return {
    words: all.split(/\s+/).filter(Boolean).length,
    characters: all.replace(/\s/g, "").length,
    charactersWithSpaces: paragraphs.reduce((n, t) => n + t.length, 0),
    paragraphs: paragraphs.length,
  };
}

// title: the frozen title fields; stats: textStats(); company: the profile's organization
function appXml({ title = {}, stats, company = "" } = {}) {
  const manager = initialsFirst(title["Принял"]);
  const name = title["Тема"];
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
    "<Template>Normal.dotm</Template>" +
    (stats ? `<Words>${stats.words}</Words><Characters>${stats.characters}</Characters>` : "") +
    "<Application>Microsoft Word for the web</Application><DocSecurity>0</DocSecurity>" +
    (stats ? `<Paragraphs>${stats.paragraphs}</Paragraphs>` : "") +
    "<ScaleCrop>false</ScaleCrop>" +
    (name
      ? '<HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Название</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>' +
        `<TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>${xml(name)}</vt:lpstr></vt:vector></TitlesOfParts>`
      : "") +
    (manager ? `<Manager>${xml(manager)}</Manager>` : "") +
    (company ? `<Company>${xml(company)}</Company>` : "") +
    "<LinksUpToDate>false</LinksUpToDate>" +
    (stats ? `<CharactersWithSpaces>${stats.charactersWithSpaces}</CharactersWithSpaces>` : "") +
    "<SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged>" +
    "<AppVersion>16.0000</AppVersion></Properties>";
}

// docProps/custom.xml: the title fields that have no place among the standard properties
function customXml(title) {
  const props = ["Дисциплина", "Тип работы", "Номер работы", "Группа"].filter((k) => title[k]);
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
    props.map((k, i) => `<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="${i + 2}" name="${xml(k).replace(/"/g, "&quot;")}"><vt:lpwstr>${xml(title[k])}</vt:lpwstr></property>`).join("") +
    "</Properties>";
}

module.exports = {
  FIELDS, initialsFirst, surname, disciplineAbbr, reportFileName, readKey, isPlaceholder, invalidFields,
  workTypeGenitive, conclusionStamp, workHeading, isCourseProject, theoryFlag, findRepoRoot, readSources, loadMeta, saveMeta, nextDocProps, coreXml, appXml, customXml, textStats, workCategory,
  requireProjectFiles,
};
