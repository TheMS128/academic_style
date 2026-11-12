const S = {
  chapter: "Glava", subchapter: "Podglava", figCaption: "OsnTekstPodpisRisunka",
  codeLabel: "ListingZagolovok", code: "Listing",
};

const isCode = (p) => p?.style === S.code;
const isHeading = (p) => p?.style === S.chapter || p?.style === S.subchapter;
// the caption form only — «Рисунок N – Название», «Таблица N. Название»; «Рисунок N
// отражает …» is a reference sentence
const isCaptionText = (t) => /^(Рисунок|Таблица|Продолжение таблицы) \d+\s*(?:[–—-]|\.)\s/.test(t);
const where = (p) => (p ? `абз. ${p.i + 1} «${p.text.slice(0, 45)}${p.text.length > 45 ? "…" : ""}»` : "начало");
// split only before a capital or an opening quote, so «рис. 3» and «т. е.» do not cut
const sentences = (t) => t.trim().split(/(?<=[.!?…])\s+(?=[А-ЯЁA-Z«(])/).filter(Boolean);
const tally = (keys) => keys.filter(Boolean).reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
const REF_FIG = /рис(?:ун\p{L}*|\.)\s*(\d+)/giu;
const REF_TAB = /табл(?:иц\p{L}*|\.)\s*(\d+)/giu;

module.exports = { S, isCode, isHeading, isCaptionText, where, sentences, tally, REF_FIG, REF_TAB };
