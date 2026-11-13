// Checks of the explanatory note, made on the content model before it becomes a document.
// K — structure (references/structure.md), E — the document (references/document.md);
// the text itself is checked by the core lint with this skill's profile.

const path = require("path");
const { core } = require("./deps");
const { plain, itemText, itemNested } = require("./compose");
const { checkEntry } = require("./sources");

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

  // K4 — the introduction states the aim
  if (seen.includes("intro") && !/цел[ьию]/i.test(textIn("intro"))) warn("K4", "во введении не названа цель работы");

  // K5, E3 — headings
  let chapter = null, sections = 0;
  const closeChapter = () => { if (chapter && sections === 1) warn("K5", `в главе «${chapter.text}» одна подглава: подглав либо нет, либо не меньше двух`); };
  for (const b of body) {
    if (b.kind !== "heading") continue;
    if (/[.:;,]$/.test(b.text.trim())) err("E3", `заголовок «${b.text}» кончается знаком препинания`);
    if (/^\d/.test(b.text.trim())) err("E3", `заголовок «${b.text}» начинается с номера: номера ставит сборщик`);
    if (b.level === 1) { closeChapter(); chapter = b; sections = 0; } else if (b.level === 2) sections++;
    if (b.level > 1 && !chapter) err("K5", `подглава «${b.text}» стоит вне главы`);
  }
  closeChapter();

  // K9 — the conclusion is text only
  if (body.some((b) => partOf.get(b) === "conclusion" && ["figure", "table", "listing"].includes(b.kind)))
    warn("K9", "в заключении есть рисунок, таблица или листинг: заключение подводит итог словами");

  // K10 — sources: every entry is referred to and follows ГОСТ Р 7.0.100
  const all = body.flatMap(blockText).join("\n");
  const urls = new Map();
  for (const b of body.filter((x) => x.kind === "sources"))
    for (const [key, entry] of b.items) {
      if (!all.includes(`{src:${key}}`)) warn("K10", `на источник «${key}» нет ссылки в тексте`);
      const r = checkEntry(entry);
      for (const m of r.errors) err("K10", `источник «${key}»: ${m}`);
      for (const m of r.warns) warn("K10", `источник «${key}»: ${m}`);
      if (r.url) {
        const same = urls.get(r.url.replace(/\/$/, ""));
        if (same) err("K10", `источники «${same}» и «${key}» — одна и та же страница`);
        else urls.set(r.url.replace(/\/$/, ""), key);
      }
    }

  // E8 — every figure, listing and table is referred to in the text, before it appears
  const before = new Set();
  for (const b of body) {
    for (const t of blockText(b)) for (const m of t.matchAll(/\{(fig|tab):([^}\s]+)\}/g)) before.add(`${m[1]}:${m[2]}`);
    if (!["figure", "listing", "table"].includes(b.kind)) continue;
    const ref = `${b.kind === "table" ? "tab" : "fig"}:${b.key}`;
    const what = b.kind === "table" ? "таблицу" : b.kind === "listing" ? "листинг" : "рисунок";
    if (!all.includes(`{${ref}}`)) err("E8", `на ${what} «${b.key}» нет ссылки в тексте`);
    else if (!before.has(ref)) warn("E8", `первая ссылка на ${what} «${b.key}» стоит после него`);
    // E5 — captions
    const caption = plain(b.caption).trim();
    if (/[.:;,]$/.test(caption)) err("E5", `название «${caption}» кончается знаком препинания`);
    if (/^[а-яёa-z]/.test(caption)) err("E5", `название «${caption}» начинается со строчной буквы`);
  }

  // E8 — a reference to a source belongs to its sentence
  if (/[.!?]\s*\[\{src:/.test(all)) warn("E8", "ссылка на источник стоит после точки: она входит в предложение — «… на рисунке 3 [5].»");

  // E8 — numbers written by hand instead of a reference by key
  if (/(?:рисун\S*|таблиц\S*|приложени\S*)\s+\d/i.test(all)) warn("E8", "номер рисунка или таблицы написан в тексте цифрой: ссылка ставится ключом — {fig:…}, {tab:…}");
  if (/\[\d+(?:[,–-]\s*\d+)*\]/.test(all)) warn("E8", "номер источника написан цифрой: ссылка ставится ключом — [{src:…}]");

  // one mistake repeated in every entry of the list is one problem
  const bySource = new Map();
  const rest = [];
  for (const x of problems) {
    const m = x.msg.match(/^источник «([^»]+)»: (.+)$/);
    if (!m) { rest.push(x); continue; }
    const key = `${x.level}|${m[2]}`;
    if (!bySource.has(key)) bySource.set(key, { ...x, keys: [], what: m[2] });
    bySource.get(key).keys.push(m[1]);
  }
  for (const g of bySource.values())
    rest.push({ level: g.level, id: g.id, msg: g.keys.length < 3 ? `источник «${g.keys.join("», «")}»: ${g.what}` : `${g.what} — ${g.keys.length} источников: «${g.keys.slice(0, 3).join("», «")}», …` });
  return rest;
}

function lint(body, composed) {
  const profile = core.loadProfile(PROFILE);
  const own = check(body, composed);
  const text = fold(core.check(composed.entries.filter((e) => e.kind !== "source"), profile));
  return [...own, ...text].sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}

// A note is long, and one habit of its author gives the same problem dozens of times.
// Problems that differ only in the paragraph they point at are reported once, with the
// count and the first places.
function fold(problems) {
  const groups = new Map();
  for (const x of problems) {
    const cut = x.msg.indexOf(": абз. ");
    const key = `${x.level}|${x.id}|${cut < 0 ? x.msg : x.msg.slice(0, cut)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(x);
  }
  return [...groups.values()].map((g) => {
    if (g.length < 4) return g;
    const cut = g[0].msg.indexOf(": абз. ");
    const places = g.slice(0, 3).map((x) => x.msg.slice(cut + 2)).join("; ");
    return [{ ...g[0], msg: `${g[0].msg.slice(0, cut)} — ${g.length} мест: ${places}; …` }];
  }).flat();
}

module.exports = { lint, check, PROFILE };
