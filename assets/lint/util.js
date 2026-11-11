// The model every check reads. A text is a list of entries
//   { i, kind, text, heads, level?, rows? }
// kind: "heading" | "p" | "item" | "code" | "caption" | "figure" | "table"
// heads: the headings the entry sits under, outermost first.
// A genre skill that parses its own document (a .docx) builds the same entries and
// calls check() from index.js — the rules are checked in one place.

const where = (p) => (p ? `абз. ${p.i + 1} «${p.text.slice(0, 45)}${p.text.length > 45 ? "…" : ""}»` : "начало");
// split only before a capital or an opening quote, so «рис. 3» and «т. е.» do not cut
const sentences = (t) => t.trim().split(/(?<=[.!?…])\s+(?=[А-ЯЁA-Z«(])/).filter(Boolean);
const tally = (keys) => keys.filter(Boolean).reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
// the caption form only — «Рисунок N – Название», «Таблица N. Название»; «Рисунок N
// отражает …» is a reference sentence
const isCaptionText = (t) => /^(Рисунок|Таблица|Продолжение таблицы) \d+\s*(?:[–—-]|\.)\s/.test(t);

// The profile, compiled: which entries are someone else's words, which rule is off where.
function compile(profile = {}) {
  const re = (s) => new RegExp(s, "i");
  const under = (p, rx) => (p.heads || []).some((h) => rx.test(h));
  const verbatim = (profile.verbatim || []).map((v) => re(v.section));
  const exempt = (profile.exempt || []).map((e) => ({ rule: e.rule, rx: re(e.section) }));
  const off = new Set((profile.off || []).map((o) => (typeof o === "string" ? o : o.rule)));
  return {
    isVerbatim: (p) => verbatim.some((rx) => under(p, rx)),
    // a rule is silent when the genre switched it off, or exempted the section the entry is in
    silent: (id, p) => off.has(id) || (!!p && exempt.some((e) => e.rule === id && under(p, e.rx))),
  };
}

module.exports = { where, sentences, tally, isCaptionText, compile };
