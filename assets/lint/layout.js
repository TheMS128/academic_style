// Lists and tables: layout.md (L), and the list part of V4.
// Only the mechanical tests live here. Whether a list or a table has a ground at all
// (L2, L4, L6) is a judgement the lint cannot make — it flags the shapes that almost
// never have one.

const { where } = require("./util");

const blank = (c) => !c || /^[—–-]$/.test(c);

module.exports = function layout(d, r) {
  const { body, own, isVerbatim } = d;

  // consecutive items form one list
  const lists = [];
  body.forEach((p, k) => {
    if (p.kind !== "item") return;
    if (body[k - 1]?.kind === "item") lists[lists.length - 1].push(p);
    else lists.push([p]);
  });

  for (const list of lists.filter((l) => !isVerbatim(l[0]))) {
    const first = list[0];
    const lens = list.map((p) => p.text.trim().length);
    // L2: too few items to be a list
    if (list.length <= 2) r.warn("L2", `список из ${list.length} пункт(ов) — это предложение: ${where(first)}`, first);
    else if (list.length === 3 && Math.max(...lens) < 60) r.warn("L2", `три коротких пункта — перечисление внутри предложения: ${where(first)}`, first);
    // L3: «Термин: пояснение»; an item that opens with an infinitive and ends in an
    // enumeration is a task and is fine
    for (const p of list) {
      const task = /^[А-Яа-яЁё]+(ть|ться|чь|чься|ти)\s/i.test(p.text);
      if (!task && /^[^.,;:—–]{1,40}(:\s|\s[—–]\s)/.test(p.text)) r.warn("L3", `пункт вида «Термин: пояснение» — перепишите предложением: ${where(p)}`, p);
    }
    // V4: items all of one length
    if (list.length >= 4) {
      const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
      if (avg > 0 && (Math.max(...lens) - Math.min(...lens)) / avg <= 0.3) r.warn("V4", `список из ${list.length} пунктов почти одинаковой длины: ${where(first)}`, first);
    }
  }

  // L3: a section that consists of lists alone
  const bySection = new Map();
  for (const p of own) {
    const key = (p.heads || []).join(" / ");
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key).push(p);
  }
  for (const [key, ps] of bySection) {
    if (key && ps.some((p) => p.kind === "item") && !ps.some((p) => p.kind === "p"))
      r.warn("L3", `раздел «${key.split(" / ").pop()}» состоит из одного списка — нужен текст вокруг него`, ps[0]);
  }

  // L1: more list than prose in the author's own text
  const items = own.filter((p) => p.kind === "item" && !r.silent("L3", p)).length;
  const paras = own.filter((p) => p.kind === "p").length;
  if (items >= 6 && items > paras) r.warn("L1", `пунктов списков (${items}) больше, чем абзацев (${paras}) — текст по умолчанию пишется прозой`);

  // L5: table tests
  for (const t of body.filter((p) => p.kind === "table" && !isVerbatim(p))) {
    const [head = [], ...data] = t.rows || [];
    const cols = head.length;
    const name = `таблица «${head.join(" | ").slice(0, 45)}»`;
    if (!data.length) continue;
    if (data.length <= 2 || (data.length <= 4 && cols <= 2)) r.warn("L5", `${name}: ${data.length} строк(и) — это одно-два предложения`, t);
    for (let c = 0; c < cols; c++) {
      const col = data.map((row) => row[c] || "");
      if (data.length >= 3 && col.every((v) => v && v === col[0])) r.warn("L5", `${name}: столбец «${head[c]}» повторяет одно значение`, t);
      else if (data.length >= 3 && col.filter(blank).length * 2 >= col.length) r.warn("L5", `${name}: столбец «${head[c]}» наполовину пуст`, t);
    }
    const words = (v) => v.split(/\s+/).filter(Boolean).length;
    if (cols === 2 && data.every((row) => words(row[1] || "") >= 6)) r.warn("L5", `${name}: строки вида «заголовок | одно предложение» — это список или проза`, t);
    else if (data.some((row) => row.some((v) => words(v) >= 25))) r.warn("L5", `${name}: в ячейках целые абзацы — рассуждение пишется текстом`, t);
  }
};
