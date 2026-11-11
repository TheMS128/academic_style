// The genre profile (references/profile.md): loading, validation, and the compiled form
// the checks use. A profile that does not pass validation stops the lint — a switch
// with a typo in the rule id or without a reason is how rules drift apart.

const fs = require("fs");
const path = require("path");

const range = (letter, n) => Array.from({ length: n }, (_, k) => `${letter}${k + 1}`);
const RULES = new Set([...range("V", 14), ...range("L", 6), ...range("F", 3), ...range("T", 28)]);
const FIELDS = ["genre", "reader", "sources", "verbatim", "exempt", "off", "limits", "norms", "extends"];
const SCOPES = ["paragraph", "section", "text"];
const LISTS = ["sources", "verbatim", "exempt", "off", "limits", "norms"];

function validate(profile) {
  const bad = [];
  const str = (v) => typeof v === "string" && v.trim();
  const rule = (at, v) => { if (!RULES.has(v)) bad.push(`${at}: нет правила «${v}» — ядру принадлежат V1–V14, L1–L6, F1–F3, T1–T28`); };
  const why = (at, e) => { if (!str(e.why)) bad.push(`${at}: нет поля why — переключатель без причины не принимается`); };
  const section = (at, v) => {
    if (!str(v)) return bad.push(`${at}: нет поля section`);
    try { new RegExp(v); } catch (e) { bad.push(`${at}: section — не регулярное выражение (${e.message})`); }
  };

  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return ["профиль — это объект JSON"];
  for (const k of Object.keys(profile)) if (!FIELDS.includes(k)) bad.push(`неизвестное поле «${k}»`);
  for (const k of ["genre", "reader"]) if (!str(profile[k])) bad.push(`нет поля ${k}`);
  for (const k of LISTS) if (k in profile && !Array.isArray(profile[k])) bad.push(`${k}: нужен массив`);
  if (bad.length) return bad;

  for (const k of ["sources", "norms"]) (profile[k] || []).forEach((v, i) => { if (!str(v)) bad.push(`${k}[${i}]: нужна строка`); });
  (profile.verbatim || []).forEach((e, i) => { section(`verbatim[${i}]`, e.section); why(`verbatim[${i}]`, e); });
  (profile.exempt || []).forEach((e, i) => { rule(`exempt[${i}]`, e.rule); section(`exempt[${i}]`, e.section); why(`exempt[${i}]`, e); });
  (profile.off || []).forEach((e, i) => { rule(`off[${i}]`, e.rule); why(`off[${i}]`, e); });
  (profile.limits || []).forEach((e, i) => {
    const at = `limits[${i}]`;
    rule(at, e.rule);
    why(at, e);
    if (!Array.isArray(e.phrases) || !e.phrases.length || !e.phrases.every(str)) bad.push(`${at}: phrases — непустой массив строк`);
    if (!Number.isInteger(e.max) || e.max < 0) bad.push(`${at}: max — целое число от 0`);
    if (!SCOPES.includes(e.per)) bad.push(`${at}: per — одно из ${SCOPES.join(", ")}`);
  });
  return bad;
}

// «extends» names the profile this one is built on, relative to the file. Lists are
// appended to the parent's, the other fields replace it.
function load(file, seen = []) {
  const full = path.resolve(file);
  if (seen.includes(full)) throw new Error(`профиль ${file}: extends замкнут в цикл`);
  const own = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!own.extends) return own;
  const parent = load(path.resolve(path.dirname(full), own.extends), [...seen, full]);
  const merged = { ...parent, ...own };
  for (const k of LISTS) merged[k] = [...(parent[k] || []), ...(own[k] || [])];
  delete merged.extends;
  return merged;
}

const word = (phrase) => new RegExp(`(?<![а-яё])${phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![а-яё])`, "gi");

function compile(profile) {
  const problems = validate(profile);
  if (problems.length) throw new Error(`профиль «${profile?.genre || "?"}» не принят:\n  ${problems.join("\n  ")}`);
  const re = (s) => new RegExp(s, "i");
  const under = (p, rx) => (p.heads || []).some((h) => rx.test(h));
  const verbatim = (profile.verbatim || []).map((v) => re(v.section));
  const exempt = (profile.exempt || []).map((e) => ({ rule: e.rule, rx: re(e.section) }));
  const off = new Set((profile.off || []).map((o) => o.rule));
  const limits = (profile.limits || []).map((l) => ({ ...l, phrases: l.phrases.map((s) => s.toLowerCase()), res: l.phrases.map(word) }));
  return {
    limits,
    isVerbatim: (p) => verbatim.some((rx) => under(p, rx)),
    // a rule is silent when the genre switched it off, or exempted the section the entry is in
    silent: (id, p) => off.has(id) || (!!p && exempt.some((e) => e.rule === id && under(p, e.rx))),
    // a phrase the genre permits up to a limit is counted by the limit, not by the rule's own check
    limited: (id, phrase) => limits.some((l) => l.rule === id && l.phrases.includes(phrase.toLowerCase())),
  };
}

module.exports = { validate, load, compile, RULES };
