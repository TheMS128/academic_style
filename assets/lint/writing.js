// Wording: writing.md (V) and tells.md (T).

const { where, sentences, tally } = require("./util");
const { STOCK, CONNECTIVES, VAGUE } = require("./phrases");

const RIDER = /,\s*(?:что|тем самым)\s+(?:обеспечива|позволя|повыша|улучша|упроща|облегча|подчёркива|способству)|,\s*(?:обеспечивая|позволяя|повышая|улучшая|упрощая|облегчая|подчёркивая|способствуя)(?=[^а-яё])/gi;
const CLOSING = /^(Это|Таким образом|В результате|В итоге|Всё|Все|Благодаря этому|Тем самым|Данный подход|Такой подход)(?=[\s,])/;
const isFigure = (p, prev) => p.kind === "figure" || (p.kind === "caption" && /^Рисунок/.test(p.text) && prev?.kind !== "figure");

module.exports = function writing(d, r) {
  const { body, own } = d;
  const ownSet = new Set(own);

  for (const p of own) {
    // V1: register and spelling
    const mixed = p.text.match(/[A-Za-z]*[А-Яа-яЁё]+[A-Za-z]+[А-Яа-яЁё]*|[А-Яа-яЁё]*[A-Za-z]+[А-Яа-яЁё]+[A-Za-z]*/);
    if (mixed) r.err("V1", `кириллица и латиница в одном слове «${mixed[0]}»: ${where(p)}`, p);
    if (/(^|[^А-Яа-яЁё])(я|мне|меня|мной|давайте|вот ваш)(?=[^А-Яа-яЁё]|$)/i.test(p.text)) r.err("V1", `первое лицо или разговорная форма: ${where(p)}`, p);
    if (/\*\*|__|\p{Extended_Pictographic}/u.test(p.text)) r.err("V1", `разметка или эмодзи внутри текста: ${where(p)}`, p);
  }

  for (const p of own.filter((q) => q.kind === "p")) {
    // V2: no definitions
    if (/(^|[\s(])[^\s]+\s+[—–]\s+это\s/i.test(p.text) || /что такое\s/i.test(p.text))
      r.err("V2", `определение «X — это …» / «что такое X» — вводите сущность через действие и причину: ${where(p)}`, p);
    else if (/^[А-ЯЁA-Z][^.]{0,60}\([^)]{2,60}\)\s+[—–]\s/.test(p.text))
      r.warn("V2", `похоже на определение «X (расшифровка) — …»: ${where(p)}`, p);

    const ss = sentences(p.text);
    // T1: «не X, а Y»
    if (/(^|[^а-яё])не (просто|лишь|столько)[^.!?]{0,120}?,\s*(а|но)(?=[^а-яё])|(^|[^а-яё])это не [^.!?,]{1,60}, (а|это)(?=[^а-яё])/i.test(p.text))
      r.warn("T1", `противопоставление «не X, а Y» — скажите прямо, что есть: ${where(p)}`, p);
    // T2: closing sentence that retells or grades the paragraph
    const lastS = ss[ss.length - 1] || "";
    const opener = (lastS.match(CLOSING) || [""])[0];
    if (ss.length > 1 && opener && !r.limited("T2", opener) &&!/рис(ун|\.)|табл(иц|\.)/i.test(lastS))
      r.warn("T2", `замыкающая фраза «${lastS.slice(0, 50)}» — удалите или замените фактом: ${where(p)}`, p);
    // T5: empty rider «…, что обеспечивает …» — every one
    const riders = p.text.match(RIDER);
    if (riders) r.warn("T5", `хвост «${riders[0].trim()}…»${riders.length > 1 ? ` ×${riders.length}` : ""} — оценка удаляется, проверяемый эффект остаётся: ${where(p)}`, p);
    // T6: a guess instead of a fact
    const guess = p.text.match(/(?<![а-яё])(вероятно|возможно, (?:из-за|это|причина))(?![а-яё])/i);
    if (guess && !r.limited("T6", guess[1])) r.warn("T6", `догадка о причине — спросите автора или не пишите: ${where(p)}`, p);
    // T9: three sentences in a row with the same opening
    const firsts = ss.map((s) => s.split(/\s+/)[0].toLowerCase().replace(/[^а-яёa-z]/g, "").replace(/^был[аои]?$/, "был…"));
    if (firsts.some((w, i) => i >= 2 && w && w === firsts[i - 1] && w === firsts[i - 2])) r.warn("T9", `три предложения подряд начинаются одинаково: ${where(p)}`, p);
    // T13: dash as a connector — from three on; two are usually grammatical (ellipsis)
    if ((p.text.match(/ [—–] /g) || []).length >= 3) r.warn("T13", `три и более тире в абзаце — тире-связку замените запятой, двоеточием или «поэтому»: ${where(p)}`, p);
    // T15: «данный» over and over — singular forms only, «данные» is usually «data»
    const dannyi = (p.text.match(/(^|[^а-яё])данн(ый|ая|ое|ого|ой|ом|ому|ую)(?=[^а-яё]|$)/gi) || []).length;
    if (dannyi >= 2) r.warn("T15", `«данный» ×${dannyi} в абзаце — «этот» или название: ${where(p)}`, p);
    // T16: quotes
    if (/(^|[\s(])"[^"=]+"|”/.test(p.text) || /^[^„]*“/.test(p.text)) r.warn("T16", `прямые или английские кавычки — нужны «ёлочки»: ${where(p)}`, p);
    // T17: decimal point in a value
    if (/(^|[\s(])\d+\.\d+\s?(%|мс|с|сек|мин|ч|МБ|ГБ|КБ|кБ|Мб|Гб|см|мм|px|раз)(?=[^а-яёa-z]|$)/i.test(p.text))
      r.warn("T17", `десятичная точка в значении — нужна запятая (0,65): ${where(p)}`, p);
    // T23: a softener before an adjective or adverb («достаточно удобный»), not
    // «достаточно указать» or «относительно родительского блока» (-ого / -его end in «о» too)
    const soft = [...p.text.matchAll(/(?:^|[^а-яё])((?:достаточно|довольно|относительно|несколько|вполне)\s+([а-яё]+))(?=[^а-яё]|$)/gi)]
      .find((m) => (/^несколько/i.test(m[1])
        // «несколько новых экранов» is a count; only a comparative makes it a softener
        ? /(ее|ей|же|ше)$/i.test(m[2])
        : /(ый|ий|ой|ая|яя|ое|ее|ые|ие|ым|им)$/i.test(m[2]) || (/о$/i.test(m[2]) && !/(ого|его)$/i.test(m[2]))));
    if (soft) r.warn("T23", `пустой ослабитель «${soft[1]}» — уберите или дайте число: ${where(p)}`, p);
    // T25: «от простых X до сложных Y», a span with no scale
    const range = p.text.match(/(^|[^а-яё])от [а-яё]+(ых|их) [а-яё]+ до [а-яё]+(ых|их) [а-яё]+/i);
    if (range) r.warn("T25", `ложный диапазон «${range[0].trim()}» — назовите случай этой работы: ${where(p)}`, p);
    // T27: a question the next sentence answers
    if (/\?\s+[А-ЯЁ]/.test(p.text)) r.warn("T27", `вопрос с ответом в следующем предложении — дайте ответ сразу: ${where(p)}`, p);
    // V4: even rhythm — every sentence within a few words of the others
    const lens = ss.map((s) => s.split(/\s+/).filter(Boolean).length);
    if (lens.length >= 4 && Math.max(...lens) - Math.min(...lens) <= 5)
      r.warn("V4", `ровный ритм: ${lens.length} предл. по ${Math.min(...lens)}–${Math.max(...lens)} слов — разбейте или слейте одно: ${where(p)}`, p);
  }

  // stock phrases by rule; a section exempt from the rule does not count
  for (const [id, phrases] of Object.entries(STOCK)) {
    const lower = own.filter((p) => !r.silent(id, p)).map((p) => p.text.toLowerCase()).join("\n");
    for (const phrase of phrases) {
      if (r.limited(id, phrase)) continue; // counted by limits.js
      const n = lower.split(phrase).length - 1;
      if (n) r.warn(id, `«${phrase}…»${n > 1 ? ` ×${n}` : ""} — перепишите вокруг факта, не синонимом`);
    }
  }

  // T28: an attribution to nobody — unless the paragraph carries a reference
  for (const p of own) {
    const vague = VAGUE.find((v) => p.text.toLowerCase().includes(v));
    if (vague && !/\[\d+[^\]]*\]|\([^()]*\d{4}[^()]*\)/.test(p.text)) r.warn("T28", `«${vague}…» без ссылки — назовите источник или скажите от себя: ${where(p)}`, p);
  }

  // V7: each paragraph-opening connective at most twice
  const openers = own.filter((p) => p.kind === "p").map((p) => CONNECTIVES.find((c) => p.text.toLowerCase().startsWith(c + ",") || p.text.toLowerCase().startsWith(c + " ")));
  for (const [c, n] of tally(openers)) if (n > 2) r.warn("V7", `абзацы начинаются с «${c}» ${n} раз(а) — не больше двух`);

  // V5: the paragraph before a figure
  const beforeFigure = [];
  body.forEach((p, k) => {
    if (!isFigure(p, body[k - 1])) return;
    const before = body[k - 1];
    if (!before || before.kind === "heading") r.err("V5", `рисунок сразу после заголовка — перед рисунком абзац-описание: ${where(before)}`, p);
    else if (before.kind === "item" || before.kind === "table" || before.kind === "figure") r.warn("V5", `перед рисунком нет абзаца-описания: ${where(before)}`, p);
    else if (before.kind === "p") {
      beforeFigure.push(before);
      if (before.text.trim().length < 120) r.warn("V5", `абзац перед рисунком короче двух строк — что показано и какие элементы важны: ${where(before)}`, before);
    }
  });
  for (const [word, n] of tally(beforeFigure.map((p) => p.text.split(/\s+/)[0]))) {
    if (n >= 3) r.warn("V5", `${n} абзаца перед рисунками начинаются с «${word}» — разнообразьте зачины`);
  }
  // V5: a numbered figure is referred to before it appears
  for (const cap of body.filter((p) => p.kind === "caption" && /^Рисунок \d+/.test(p.text))) {
    const n = cap.text.match(/\d+/)[0];
    const first = body.find((p) => p.kind === "p" && new RegExp(`рис(?:ун[а-яё]*|\\.)\\s*${n}(?!\\d)`, "i").test(p.text));
    if (first && first.i > cap.i) r.warn("V5", `первая ссылка на рисунок ${n} стоит после самого рисунка: ${where(first)}`, first);
  }

  // V6: the same reference ending, three times or more
  const endings = own.filter((p) => p.kind === "p").map((p) => sentences(p.text).pop() || "");
  for (const re of [/рис(ун|\.)/i, /табл(иц|\.)/i]) {
    for (const [ending, n] of tally(endings.filter((s) => re.test(s)).map((s) => s.replace(/\d+/g, "N")))) {
      if (n >= 3) r.warn("V6", `концовка «${ending}» повторяется ${n} раз(а)`);
    }
  }

  // V12: three paragraphs of one size that really stand next to each other. A figure, a
  // caption, a listing, a list, a heading or a short paragraph between them breaks the run.
  let even = [];
  for (const p of body) {
    if (!ownSet.has(p) || p.kind !== "p" || p.text.length < 150) { even = []; continue; }
    even.push(p);
    if (even.length < 3) continue;
    const ls = even.slice(-3).map((q) => q.text.length);
    const avg = (ls[0] + ls[1] + ls[2]) / 3;
    if ((Math.max(...ls) - Math.min(...ls)) / avg <= 0.2) {
      r.warn("V12", `три абзаца подряд одной длины (${ls.join(", ")} зн.) — слейте, разбейте или сократите один: ${where(even[even.length - 3])}`, p);
      even = [];
    }
  }

  // T18: Title Case in a heading — two or more inner words with a capital
  for (const p of body.filter((q) => q.kind === "heading")) {
    const inner = p.text.split(/\s+/).slice(1).filter((w) => /^[А-ЯЁ][а-яё]+$/.test(w));
    if (inner.length >= 2) r.warn("T18", `заголовок с прописными в каждом слове — только первое слово: ${where(p)}`, p);
  }
};
