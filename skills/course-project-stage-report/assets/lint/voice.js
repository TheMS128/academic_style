// Wording (voice.md) and what the text may name (facts.md → F5).

const { isCode, isHeading, where, sentences, tally, prose, own } = require("./util");
const { STOCK, TOOLING, CONNECTIVES } = require("./phrases");

const EXEMPT_DEF = /^(Теоретические сведения|Словарь предметной области)$/;
const RIDER = /,\s*(?:что|тем самым)\s+(?:обеспечива|позволя|повыша|улучша|упроща|облегча|подчёркива|способству)|,\s*(?:обеспечивая|позволяя|повышая|улучшая|упрощая|облегчая|подчёркивая|способствуя)(?=[^а-яё])/gi;
const CLOSING = /^(Это|Таким образом|В результате|В итоге|Всё|Все|Благодаря этому|Тем самым|Данный подход|Такой подход)(?=[\s,])/;

module.exports = function voice(d, r) {
  const { body } = d;
  const all = prose(body);
  const mine = own(body);

  for (const p of all) {
    // V1: register and spelling
    const mixed = p.text.match(/[A-Za-z]*[А-Яа-яЁё]+[A-Za-z]+[А-Яа-яЁё]*|[А-Яа-яЁё]*[A-Za-z]+[А-Яа-яЁё]+[A-Za-z]*/);
    if (mixed) r.err("V1", `кириллица и латиница в одном слове «${mixed[0]}»: ${where(p)}`);
    if (/(^|[^А-Яа-яЁё])(я|мне|меня|мной|давайте|вот ваш)(?=[^А-Яа-яЁё]|$)/i.test(p.text)) r.err("V1", `первое лицо или разговорная форма: ${where(p)}`);
    if (/\*\*|(^|\n)#{1,6}\s|\p{Extended_Pictographic}/u.test(p.text)) r.err("V1", `маркдаун или эмодзи в тексте: ${where(p)}`);
  }

  // B3: list items «Термин: пояснение» — outside the glossary; a task item that opens
  // with an infinitive and ends in an enumeration is fine
  for (const p of body.filter((q) => q.list && !isCode(q) && !q.inTable)) {
    const task = /^[А-Яа-яЁё]+(ть|ться|чь|чься|ти)\s/i.test(p.text);
    if (!task && p.zone !== "Словарь предметной области" && /^[^.,;:—–]{1,40}(:\s|\s[—–]\s)/.test(p.text))
      r.warn("B3", `пункт списка вида «Термин: пояснение» — перепишите предложением: ${where(p)}`);
  }

  for (const p of mine) {
    // theory and glossary as a subchapter or a chapter (S7a); a контрольный вопрос often
    // asks «что такое X» and its answer is a definition (S13)
    const exempt = EXEMPT_DEF.test(p.zone) || EXEMPT_DEF.test(p.chapter) || p.chapter === "Контрольные вопросы";
    // V2: no definitions
    if (!exempt && (/(^|[\s(])[^\s]+\s+[—–]\s+это\s/i.test(p.text) || /что такое\s/i.test(p.text)))
      r.err("V2", `определение «X — это …» / «что такое X» — вводите сущность через действие и причину: ${where(p)}`);
    else if (!exempt && /^[А-ЯЁA-Z][^.]{0,60}\([^)]{2,60}\)\s+[—–]\s/.test(p.text))
      r.warn("V2", `похоже на определение «X (расшифровка) — …»: ${where(p)}`);

    const ss = sentences(p.text);
    // T1: «не X, а Y»
    if (/(^|[^а-яё])не (просто|лишь|столько)[^.!?]{0,120}?,\s*(а|но)(?=[^а-яё])|(^|[^а-яё])это не [^.!?,]{1,60}, (а|это)(?=[^а-яё])/i.test(p.text))
      r.warn("T1", `противопоставление «не X, а Y» — скажите прямо, что есть: ${where(p)}`);
    // T2: closing sentence that retells or grades the paragraph
    const lastS = ss[ss.length - 1] || "";
    if (ss.length > 1 && CLOSING.test(lastS) && !/рис(ун|\.)|табл(иц|\.)/i.test(lastS))
      r.warn("T2", `замыкающая фраза «${lastS.slice(0, 50)}» — удалите или замените фактом: ${where(p)}`);
    // T5: empty rider «…, что обеспечивает …» — every one
    const riders = p.text.match(RIDER);
    if (riders) r.warn("T5", `хвост «${riders[0].trim()}…»${riders.length > 1 ? ` ×${riders.length}` : ""} — оценка удаляется, проверяемый эффект остаётся: ${where(p)}`);
    // T6: a guess instead of a fact
    if (/(^|[^а-яё])(вероятно|возможно, (?:из-за|это|причина))(?=[^а-яё]|$)/i.test(p.text)) r.warn("T6", `догадка о причине — спросите студента или не пишите: ${where(p)}`);
    // T9: three sentences in a row with the same opening
    const firsts = ss.map((s) => s.split(/\s+/)[0].toLowerCase().replace(/[^а-яёa-z]/g, "").replace(/^был[аои]?$/, "был…"));
    if (firsts.some((w, i) => i >= 2 && w && w === firsts[i - 1] && w === firsts[i - 2])) r.warn("T9", `три предложения подряд начинаются одинаково: ${where(p)}`);
    // T13: dash as a connector — from three on; two are usually grammatical (ellipsis)
    if ((p.text.match(/ [—–] /g) || []).length >= 3) r.warn("T13", `три и более тире в абзаце — тире-связку замените запятой, двоеточием или «поэтому»: ${where(p)}`);
    // T15: «данный» over and over — singular forms only, «данные» is usually «data»
    const dannyi = (p.text.match(/(^|[^а-яё])данн(ый|ая|ое|ого|ой|ом|ому|ую)(?=[^а-яё]|$)/gi) || []).length;
    if (dannyi >= 2) r.warn("T15", `«данный» ×${dannyi} в абзаце — «этот» или название: ${where(p)}`);
    // T16: quotes
    if (/(^|[\s(])"[^"=]+"|”/.test(p.text) || /^[^„]*“/.test(p.text)) r.warn("T16", `прямые или английские кавычки — нужны «ёлочки»: ${where(p)}`);
    // T17: decimal point in a value
    if (/(^|[\s(])\d+\.\d+\s?(%|мс|с|сек|мин|ч|МБ|ГБ|КБ|кБ|Мб|Гб|см|мм|px|раз)(?=[^а-яёa-z]|$)/i.test(p.text))
      r.warn("T17", `десятичная точка в значении — нужна запятая (0,65): ${where(p)}`);
    // V4: even rhythm — every sentence within a few words of the others
    const lens = ss.map((s) => s.split(/\s+/).filter(Boolean).length);
    if (lens.length >= 4 && Math.max(...lens) - Math.min(...lens) <= 5)
      r.warn("V4", `ровный ритм: ${lens.length} предл. по ${Math.min(...lens)}–${Math.max(...lens)} слов — разбейте или слейте одно: ${where(p)}`);
  }

  // stock phrases by rule, and the capture harness (F5)
  const lower = mine.map((p) => p.text.toLowerCase()).join("\n");
  for (const [id, phrases] of Object.entries(STOCK)) {
    for (const phrase of phrases) {
      const n = lower.split(phrase).length - 1;
      if (n) r.warn(id, `«${phrase}…»${n > 1 ? ` ×${n}` : ""} — перепишите вокруг факта, не синонимом`);
    }
  }
  for (const phrase of TOOLING) if (lower.includes(phrase)) r.warn("F5", `инструмент фиксации «${phrase}» — способ съёмки не описывается`);

  // V7: each paragraph-opening connective at most twice
  const openers = mine.map((p) => CONNECTIVES.find((c) => p.text.toLowerCase().startsWith(c + ",") || p.text.toLowerCase().startsWith(c + " ")));
  for (const [c, n] of tally(openers)) if (n > 2) r.warn("V7", `абзацы начинаются с «${c}» ${n} раз(а) — не больше двух`);

  // V5: the paragraph before a figure
  body.forEach((p, k) => {
    if (!p.images.length) return;
    const before = body[k - 1];
    if (!before || isHeading(before)) r.err("V5", `рисунок сразу после заголовка — перед рисунком абзац-описание: ${where(before)}`);
    else if (!isCode(before) && before.text.trim() && before.text.trim().length < 120)
      r.warn("V5", `абзац перед рисунком короче двух строк — что показано и какие элементы важны: ${where(before)}`);
  });
  const beforeFigure = body.filter((p, k) => !p.images.length && !isCode(p) && p.text.trim() && body[k + 1]?.images.length > 0);
  for (const [word, n] of tally(beforeFigure.map((p) => p.text.split(/\s+/)[0]))) {
    if (n >= 3) r.warn("V5", `${n} абзаца перед рисунками начинаются с «${word}» — разнообразьте зачины`);
  }
  // V5: the figure is referred to before it appears
  for (const cap of d.figCaps || []) {
    const first = (d.figRefs || []).find((x) => x.n === cap.n);
    if (first && first.p.i > cap.p.i) r.warn("V5", `первая ссылка на рисунок ${cap.n} стоит после самого рисунка: ${where(first.p)}`);
  }

  // V6: the same reference ending, three times or more
  const endings = all.map((p) => sentences(p.text).pop() || "");
  for (const re of [/рис(ун|\.)/i, /табл(иц|\.)/i]) {
    for (const [ending, n] of tally(endings.filter((s) => re.test(s)).map((s) => s.replace(/\d+/g, "N")))) {
      if (n >= 3) r.warn("V6", `концовка «${ending}» повторяется ${n} раз(а)`);
    }
  }

  // V4: a run of list items all the same length
  let run = [];
  const flush = () => {
    if (run.length >= 4) {
      const lens = run.map((p) => p.text.trim().length);
      const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
      if (avg > 0 && (Math.max(...lens) - Math.min(...lens)) / avg <= 0.3) r.warn("V4", `список из ${run.length} пунктов почти одинаковой длины: ${where(run[0])}`);
    }
    run = [];
  };
  for (const p of body) (p.list && !isCode(p) && !p.inTable ? run.push(p) : flush());
  flush();
};
