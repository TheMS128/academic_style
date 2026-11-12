// Checks of the explanatory note, made on the content model before it becomes a document.
// K — structure (references/structure.md), E — the document (references/document.md);
// the text itself is checked by the core lint with this skill's profile.

const path = require("path");
const { core } = require("./deps");
const { plain, itemText, itemNested } = require("./compose");

const PROFILE = path.resolve(__dirname, "..", "..", "profile.json");

// all text of a block, tokens unresolved
function blockText(b) {
  switch (b.kind) {
    case "p": return [plain(b.text)];
    case "list": return b.items.flatMap((i) => [plain(itemText(i)), ...itemNested(i).map(plain)]);
    case "abstract": return [...b.ru, ...(b.en || [])].map(plain);
    case "table": return b.rows.flat().map((c) => plain(String(c)));
    default: return [];
  }
}

function check(body, { counts }) {
  const problems = [];
  const err = (id, msg) => problems.push({ level: "error", id, msg });
  const warn = (id, msg) => problems.push({ level: "warn", id, msg });
  const kindOf = (b) => (b.kind === "part" ? b.part : b.kind === "heading" && b.level === 1 ? "chapter" : b.kind);

  // K1 — the parts and their order
  const ORDER = ["abstract", "intro", "chapter", "conclusion", "sources", "appendix"];
  const NAMES = { abstract: "аннотация", intro: "введение", chapter: "главы", conclusion: "заключение", sources: "список использованных источников", appendix: "приложения" };
  const seen = body.map(kindOf).filter((k) => ORDER.includes(k));
  for (const k of ORDER.slice(0, 5)) if (!seen.includes(k)) err("K1", `в записке нет части «${NAMES[k]}»`);
  for (const k of ["abstract", "intro", "conclusion", "sources"]) if (seen.filter((x) => x === k).length > 1) err("K1", `часть «${NAMES[k]}» встречается больше одного раза`);
  for (let i = 1; i < seen.length; i++)
    if (ORDER.indexOf(seen[i]) < ORDER.indexOf(seen[i - 1])) { err("K1", `часть «${NAMES[seen[i]]}» стоит после части «${NAMES[seen[i - 1]]}»`); break; }

  // which part every block belongs to
  let part = null;
  const partOf = new Map();
  for (const b of body) { if (ORDER.includes(kindOf(b))) part = kindOf(b); partOf.set(b, part); }
  const textIn = (name) => body.filter((b) => partOf.get(b) === name).flatMap(blockText).join("\n");

  // K2 — the abstract names the size of the note through the counts
  const abstract = body.find((b) => b.kind === "abstract");
  if (abstract) {
    const ru = abstract.ru.map(plain).join("\n");
    if (!abstract.ru.length) err("K2", "в аннотации нет текста на русском языке");
    if (!abstract.en || !abstract.en.length) err("K2", "в аннотации нет текста на английском языке");
    const need = [["pages", "листов"], ["figures", "рисунков"], ["tables", "таблиц"], ["sources", "источников"], ["appendices", "приложений"]];
    for (const [name, word] of need) {
      if (name !== "pages" && !counts[name]) continue;
      if (!ru.includes(`{${name}`)) err("K2", `аннотация не называет число ${word}: впишите его как {${name}:…} — число подставит сборщик`);
      if (abstract.en && abstract.en.length && !abstract.en.map(plain).join("\n").includes(`{${name}`))
        warn("K2", `английский текст аннотации не называет число ${word} ({${name}:…})`);
    }
    if (/\b\d+\s+(лист|рисун|таблиц|источник|приложени)/i.test(ru)) err("K2", "в аннотации число листов, рисунков, таблиц или источников написано цифрой — замените на {pages:…}, {figures:…} и так далее");
  }

  // K3 — the introduction states the aim
  if (seen.includes("intro") && !/цел[ьию]/i.test(textIn("intro"))) warn("K3", "во введении не названа цель работы");

  // K4 — headings
  let chapter = null, sections = 0;
  const closeChapter = () => { if (chapter && sections === 1) warn("K4", `в главе «${chapter.text}» одна подглава: подглав либо нет, либо не меньше двух`); };
  for (const b of body) {
    if (b.kind !== "heading") continue;
    if (/[.:;,]$/.test(b.text.trim())) err("K4", `заголовок «${b.text}» кончается знаком препинания`);
    if (/^\d/.test(b.text.trim())) err("K4", `заголовок «${b.text}» начинается с номера: номера ставит сборщик`);
    if (b.level === 1) { closeChapter(); chapter = b; sections = 0; } else if (b.level === 2) sections++;
    if (b.level > 1 && !chapter) err("K4", `подглава «${b.text}» стоит вне главы`);
  }
  closeChapter();

  // K5 — the conclusion is text only
  if (body.some((b) => partOf.get(b) === "conclusion" && ["figure", "table", "listing"].includes(b.kind)))
    warn("K5", "в заключении есть рисунок, таблица или листинг: заключение подводит итог словами");

  // K6 — sources
  const all = body.flatMap(blockText).join("\n");
  for (const b of body.filter((x) => x.kind === "sources"))
    for (const [key, entry] of b.items) {
      if (!all.includes(`{src:${key}}`)) warn("K6", `на источник «${key}» нет ссылки в тексте`);
      const e = entry.trim();
      if (!/\.$/.test(e)) err("K6", `источник «${key}»: запись кончается точкой`);
      if (/\S:\s*\[?сайт\]?/.test(e)) warn("K6", `источник «${key}»: перед двоеточием в «Название сайта : [сайт]» нужен пробел`);
      if (!/https?:\/\//.test(e)) continue;
      if (!/\(дата обращения: \d{2}\.\d{2}\.\d{4}\)/.test(e)) err("K6", `источник «${key}»: у электронного ресурса нет «(дата обращения: ДД.ММ.ГГГГ)»`);
      if (!/– Текст : электронный/.test(e)) err("K6", `источник «${key}»: у электронного ресурса нет сведений «– Текст : электронный» после названия`);
      if (!/– URL: https?:\/\//.test(e)) err("K6", `источник «${key}»: адрес пишется как «– URL: https://…»`);
    }

  // E3 — every figure, listing and table is referred to in the text, before it appears
  const before = new Set();
  for (const b of body) {
    for (const t of blockText(b)) for (const m of t.matchAll(/\{(fig|tab):([^}\s]+)\}/g)) before.add(`${m[1]}:${m[2]}`);
    if (!["figure", "listing", "table"].includes(b.kind)) continue;
    const ref = `${b.kind === "table" ? "tab" : "fig"}:${b.key}`;
    const what = b.kind === "table" ? "таблицу" : b.kind === "listing" ? "листинг" : "рисунок";
    if (!all.includes(`{${ref}}`)) err("E3", `на ${what} «${b.key}» нет ссылки в тексте`);
    else if (!before.has(ref)) warn("E3", `первая ссылка на ${what} «${b.key}» стоит после него`);
    // E4 — captions
    const caption = plain(b.caption).trim();
    if (/[.:;,]$/.test(caption)) err("E4", `название «${caption}» кончается знаком препинания`);
    if (/^[а-яёa-z]/.test(caption)) err("E4", `название «${caption}» начинается со строчной буквы`);
  }

  // E5 — numbers written by hand instead of a reference by key
  if (/(?:рисун\S*|таблиц\S*|приложени\S*)\s+\d/i.test(all)) warn("E5", "номер рисунка или таблицы написан в тексте цифрой: ссылка ставится ключом — {fig:…}, {tab:…}");
  if (/\[\d+(?:[,–-]\s*\d+)*\]/.test(all)) warn("E5", "номер источника написан цифрой: ссылка ставится ключом — [{src:…}]");

  return problems;
}

function lint(body, composed) {
  const profile = core.loadProfile(PROFILE);
  const own = check(body, composed);
  const text = core.check(composed.entries.filter((e) => e.kind !== "source"), profile);
  return [...own, ...text].sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}

module.exports = { lint, check, PROFILE };
