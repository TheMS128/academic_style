// The scope file of a diagram against the diagram itself (references/selection.md, M).
// The file says which question the picture answers and, for every candidate element,
// whether it is on the picture and why:
//
//   Вопрос: Из каких сущностей состоит основная структура данных приложения?
//
//   | Элемент | На схеме | Почему |
//   | --- | --- | --- |
//   | Subject | да | центральная сущность, владеет лекциями и тестами |
//   | DbSetMock | нет | вспомогательный класс тестов, в структуру данных не входит |
//
// checkScope(text, analysed) → problems

const norm = (s) => s.toLowerCase().replace(/ё/g, "е").replace(/[«»"'`*_]/g, "").replace(/\s+/g, " ").trim();

function parseScope(text) {
  const question = ((text.match(/^\s*Вопрос\s*:\s*(.+?)\s*$/m) || [])[1] || "").trim();
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.length < 3 || /^-+$/.test(cells[0].replace(/[:\s]/g, "")) || /^элемент$/i.test(cells[0])) continue;
    rows.push({ name: cells[0], on: norm(cells[1]), why: cells.slice(2).join(" | ") });
  }
  return { question, rows };
}

function checkScope(text, { nodes, texts }) {
  const problems = [];
  const err = (id, msg) => problems.push({ level: "error", id, msg });
  const warn = (id, msg) => problems.push({ level: "warn", id, msg });
  const { question, rows } = parseScope(text);

  if (!question) err("M1", "в файле отбора нет строки «Вопрос: …» — на какой один вопрос отвечает схема");
  else if (!/\?$/.test(question)) err("M1", `«${question}» — это не вопрос: схема отвечает на один вопрос, и он записан с вопросительным знаком`);
  else if (/ и (как|какие|какой|что|где|зачем|почему) /i.test(question)) warn("M1", "в строке «Вопрос» два вопроса — это две схемы");
  if (!rows.length) { err("M2", "в файле отбора нет таблицы «Элемент | На схеме | Почему»"); return problems; }

  for (const r of rows) {
    if (!["да", "нет"].includes(r.on)) err("M2", `элемент «${r.name}»: в столбце «На схеме» стоит «${r.on}» — нужно «да» или «нет»`);
    if (r.why.replace(/[\s.—–-]/g, "").length < 8) err("M2", `элемент «${r.name}»: не сказано, почему он ${r.on === "нет" ? "оставлен вне схемы" : "на схеме"}`);
  }
  const yes = rows.filter((r) => r.on === "да"), no = rows.filter((r) => r.on === "нет");
  if (!no.length && !/Кандидатов вне схемы нет\s*:\s*\S{8,}/i.test(text))
    err("M3", "в таблице нет ни одного элемента, оставленного вне схемы: перечислите кандидатов, которые рассматривались и не вошли, или напишите «Кандидатов вне схемы нет: <почему>»");

  const labelled = nodes.filter((n) => n.texts.length).map((n) => ({ n, text: norm(n.texts.map((t) => t.text).join(" ")), title: n.texts.slice().sort((a, b) => a.box.y0 - b.box.y0)[0].text }));
  const all = norm(texts.map((t) => t.text).join(" "));
  for (const l of labelled) {
    // a group frame is named by its own caption, a box — by everything written in it
    if (!yes.some((r) => l.text.includes(norm(r.name)) || norm(r.name).includes(norm(l.title))))
      err("M2", `на схеме есть «${l.title}», а в файле отбора его нет: каждый элемент схемы проходит отбор`);
  }
  for (const r of yes) if (!all.includes(norm(r.name))) err("M2", `элемент «${r.name}» отмечен «да», но на схеме его нет`);
  for (const r of no) if (labelled.some((l) => norm(l.title) === norm(r.name))) err("M2", `элемент «${r.name}» отмечен «нет», но он есть на схеме`);
  if (yes.length > 15) warn("M5", `на схеме ${yes.length} элементов — больше пятнадцати читатель не удержит: разделите её на две по двум вопросам`);
  return problems;
}

module.exports = { checkScope, parseScope };
