// Chapters, subchapters and what each chapter holds (structure.md).
// ctx.theory: "required" | "not" | undefined — RULES.MD for this discipline.

const { S, isCode, isHeading, isCaptionText, where, sentences, REF_FIG, REF_TAB } = require("./util");
const { LEADINS } = require("./phrases");
const { conclusionStamp } = require("../lib/meta");

const THEORY = "Теоретические сведения";
const GLOSSARY = "Словарь предметной области";
const QUESTIONS = "Контрольные вопросы";

// ord is the place in the document; chapters sharing an ord stand in any order between
// themselves (the assignment, theory, the glossary). optional: silent when absent.
const CHAPTERS = [
  { re: /^Цель работы$/, name: "Цель работы", ord: 0, required: true },
  { re: /^Задани[ея](?: \(Вариант \d+\))?$/, name: "Задание / Задания", ord: 1, required: false },
  { re: new RegExp(`^${THEORY}$`), name: THEORY, ord: 1, optional: true },
  { re: new RegExp(`^${GLOSSARY}$`), name: GLOSSARY, ord: 1, optional: true },
  { re: /^Выполнение работы$/, name: "Выполнение работы", ord: 2, required: true },
  { re: /^Вывод$/, name: "Вывод", ord: 3, required: true },
  { re: new RegExp(`^${QUESTIONS}$`), name: QUESTIONS, ord: 4, optional: true },
];
const ORDER = "Цель работы → Задание / Задания → Выполнение работы → Вывод";
const INFINITIVE = /^[А-ЯЁа-яё]+(ть|ться|чь|чься|ти|тись)$/;

module.exports = function structure(d, r, ctx = {}) {
  const { body } = d;
  const headings = body.filter(isHeading);

  // S1: headings — no final period, no ALL CAPS, sentence case
  for (const h of headings) {
    const letters = h.text.replace(/[^А-Яа-яЁёA-Za-z]/g, "");
    if (/[.:]\s*$/.test(h.text)) r.err("S1", `точка или двоеточие в конце заголовка: ${where(h)}`);
    if (letters.length >= 4 && letters === letters.toUpperCase()) r.err("S1", `заголовок прописными буквами: ${where(h)}`);
    else if (h.text.split(/\s+/).slice(1).filter((w) => /^[А-ЯЁ][а-яё]+$/.test(w)).length >= 2)
      r.warn("S1", `заголовок с прописной в каждом слове — только первое слово: ${where(h)}`);
  }

  // S1: the chapter set and its order
  const chapters = headings.filter((h) => h.style === S.chapter);
  let last = -1;
  const seen = new Set();
  for (const h of chapters) {
    const k = CHAPTERS.findIndex((c) => c.re.test(h.text.trim()));
    if (/дополнительн/i.test(h.text)) { r.err("S8", `глава «${h.text}»: дополнительные задания идут блоками в «Выполнении работы», без заголовка`); continue; }
    if (k < 0) { r.err("S1", `глава «${h.text}» вне структуры: ${ORDER}`); continue; }
    if (seen.has(k)) r.err("S1", `глава «${CHAPTERS[k].name}» повторяется`);
    else if (CHAPTERS[k].ord < last) r.err("S1", `глава «${h.text}» стоит не на своём месте: ${ORDER}; «${THEORY}» и «${GLOSSARY}» — до «Выполнения работы», «${QUESTIONS}» — после «Вывода»`);
    seen.add(k);
    last = Math.max(last, CHAPTERS[k].ord);
  }
  // S1: a practical work has no «Вывод»
  const practical = d.workType === "Практическая";
  const conclusion = CHAPTERS.findIndex((c) => c.name === "Вывод");
  if (practical && seen.has(conclusion)) r.err("S1", "в практической работе главы «Вывод» нет");
  CHAPTERS.forEach((c, k) => {
    if (seen.has(k) || c.optional || (practical && k === conclusion)) return;
    if (c.required) r.err("S1", `нет главы «${c.name}»`);
    else r.warn("S3", `нет главы «${c.name}» — она пишется, когда методичка формулирует задание`);
  });

  const inChapter = (re) => body.filter((p) => re.test(p.chapter) && !isHeading(p));
  const content = (ps) => ps.filter((p) => p.text.trim() || p.images.length);

  // S5–S8: subchapters — only theory and glossary, inside «Выполнение работы», before the blocks
  const subs = headings.filter((h) => h.style === S.subchapter);
  const work = body.filter((p) => p.chapter === "Выполнение работы");
  const firstBlock = work.findIndex((p) => p.images.length || isCode(p) || isCaptionText(p.text));
  let theoryAt = -1;
  for (const h of subs) {
    const t = h.text.trim();
    if (h.chapter !== "Выполнение работы") { r.err("S5", `подглава «${t}» вне главы «Выполнение работы»`); continue; }
    if (/дополнительн/i.test(t)) { r.err("S8", `подглава «${t}»: дополнительные задания идут блоками, без заголовка`); continue; }
    if (t !== THEORY && t !== GLOSSARY) {
      r.warn("S5", `подглава «${t}»: подглавы — только «${THEORY}» и «${GLOSSARY}»; работа идёт блоками без заголовков, если методичка прямо не требует нумерованных подразделов`);
      continue;
    }
    const at = work.indexOf(h);
    if (firstBlock >= 0 && at > firstBlock) r.warn("S5", `подглава «${t}» стоит после начала блоков — её место в начале «Выполнения работы»`);
    if (t === THEORY) theoryAt = at;
    if (t === GLOSSARY && theoryAt < 0 && subs.some((s) => s.text.trim() === THEORY)) r.warn("S5", `«${GLOSSARY}» стоит раньше «${THEORY}» — порядок: теория, затем словарь`);
  }

  // S7a: theory and glossary stand as a subchapter of «Выполнение работы» or, when the
  // course template asks for it, as a chapter of their own — one form per report
  const asChapter = (name) => body.filter((p) => p.chapter === name && !isHeading(p));
  const hasChapter = (name) => chapters.some((h) => h.text.trim() === name);
  const hasSub = (name) => subs.some((h) => h.text.trim() === name);
  const zone = (name) => (hasChapter(name) ? asChapter(name) : work.filter((p) => p.zone === name));
  for (const name of [THEORY, GLOSSARY])
    if (hasChapter(name) && hasSub(name)) r.err("S7a", `«${name}» и главой, и подглавой — одна форма на отчёт`);

  // S6: theory — against RULES.MD, one paragraph of 3–6 sentences (up to 10 as a chapter) or a short list
  const theory = zone(THEORY);
  const hasTheory = hasChapter(THEORY) || hasSub(THEORY);
  if (hasTheory && !content(theory).length) r.err("S6", `«${THEORY}» пусто — сразу под заголовком абзац или список`);
  // the RULES.MD flag is about the course's labs; a course-project stage is not one
  if (ctx.theory === "required" && !hasTheory && d.workType !== "Курсовой проект") r.err("S6", `RULES.MD: теоретический блок требуется, «${THEORY}» нет`);
  if (ctx.theory === "not" && hasTheory) r.warn("S6", `RULES.MD: теоретический блок не требуется — оставьте, только если пункт «Ознакомиться…» ответили «писать» (intake.md → I6)`);
  if (theory.length && !theory.some((p) => p.list)) {
    const n = theory.reduce((a, p) => a + sentences(p.text).length, 0);
    const max = hasChapter(THEORY) ? 10 : 6;
    if (n < 3 || n > max) r.warn("S6", `«${THEORY}»: ${n} предл. — нужно 3–${max}`);
  }

  // S7: glossary — a list of «Термин – значение» directly under the heading
  const glossary = zone(GLOSSARY);
  const hasGlossary = hasChapter(GLOSSARY) || hasSub(GLOSSARY);
  if ((hasGlossary && !content(glossary).length) || (glossary.length && !glossary.some((p) => p.list)))
    r.err("S7", `«${GLOSSARY}»: сразу под заголовком список «Термин – значение»`);
  for (const p of glossary.filter((q) => q.list)) {
    if (!/^[^–—]{1,60} [–—] \S/.test(p.text)) r.warn("S7", `пункт словаря не по форме «Термин – значение»: ${where(p)}`);
  }

  // S13: контрольные вопросы — the question word for word, its answer in the paragraph under it
  const questions = content(asChapter(QUESTIONS));
  if (hasChapter(QUESTIONS)) {
    if (!questions.length) r.err("S13", `глава «${QUESTIONS}» пустая — вопрос методички, под ним ответ`);
    else if (!questions.some((p) => /\?\s*$/.test(p.text)))
      r.warn("S13", `в «${QUESTIONS}» нет вопросов — вопрос стоит отдельным абзацем, слово в слово по методичке`);
    questions.forEach((p, i) => {
      if (/\?\s*$/.test(p.text) && (!questions[i + 1] || /\?\s*$/.test(questions[i + 1].text)))
        r.err("S13", `вопрос без ответа: ${where(p)}`);
    });
  }

  // S2: Цель — one paragraph, 1–2 sentences, opens with an infinitive
  const goal = content(inChapter(/^Цель работы$/));
  if (goal.some((p) => p.list || p.images.length)) r.err("S2", "в «Цели работы» только абзац — без списков и рисунков");
  const goalText = goal.map((p) => p.text).join(" ").trim();
  if (goalText) {
    if (sentences(goalText).length > 2) r.err("S2", `«Цель работы»: ${sentences(goalText).length} предл. — нужно 1–2`);
    if (!INFINITIVE.test(goalText.split(/\s+/)[0])) r.warn("S2", `«Цель работы» начинается не с инфинитива: «${goalText.split(/\s+/)[0]}»`);
  }

  // S3–S4: Задание / Задания
  const taskHead = chapters.find((h) => /^Задани/.test(h.text));
  if (taskHead) {
    const items = content(inChapter(/^Задани/));
    const plural = /^Задания/.test(taskHead.text);
    const variant = (taskHead.text.match(/Вариант (\d+)/) || [])[1];
    const lower = items.map((p) => p.text.toLowerCase()).join("\n");
    const leadin = LEADINS.find((phrase) => lower.includes(phrase));
    if (leadin) r.err("S3", `вводная фраза «…${leadin}» — в главе задания только сами задания`);
    const lastP = items[items.length - 1];
    const variantP = /^(По варианту|Условие варианта) \d+/.test(lastP?.text || "") ? lastP : null;
    if (variant && (!variantP || !variantP.text.includes(variant))) r.err("S4", `«${taskHead.text}»: последним абзацем должно идти «По варианту ${variant} …» или «Условие варианта ${variant}. …»`);
    if (!variant && variantP) r.err("S4", `условие варианта есть, а в заголовке нет «(Вариант N)»: ${where(variantP)}`);
    const rest = items.filter((p) => p !== variantP);
    if (plural) {
      if (!rest.length || !rest[0].list) r.err("S3", "«Задания»: сразу под заголовком — нумерованный список задач");
      const stray = rest.filter((p) => !p.list);
      if (stray.length) r.err("S3", `«Задания»: кроме списка (и условия варианта последним абзацем) ничего нет — ${where(stray[0])}`);
      if (rest.filter((p) => p.list).length === 1) r.warn("S3", "«Задания» с одним пунктом — одна задача пишется как «Задание» абзацем");
    } else {
      if (rest.some((p) => p.list)) r.err("S3", "«Задание» пишется абзацем; несколько задач — «Задания» со списком");
      const n = rest.reduce((a, p) => a + sentences(p.text).length, 0);
      if (n > 3) r.warn("S3", `«Задание»: ${n} предл. — обычно 1–3`);
    }
  }

  // S9: no «Задание N.» labels inside the work
  for (const p of work) {
    if (/^(Задание|Упражнение|Задача)\s*№?\s*\d+/.test(p.text.trim()) && !isHeading(p))
      r.err("S9", `ярлык «${p.text.trim().split(/\s+/).slice(0, 2).join(" ")}» — блок открывается действием, не номером задания: ${where(p)}`);
  }

  // S10–S11: Вывод — one paragraph, the stamp by work type, ≤ 3 sentences, the Цель copied
  const concl = content(inChapter(/^Вывод$/));
  if (concl.length) {
    if (concl.length > 1 || concl.some((p) => p.list || p.images.length)) r.err("S11", "«Вывод» — один абзац, без списков и рисунков");
    const text = concl.map((p) => p.text).join(" ").trim();
    const stamp = conclusionStamp(d.workType);
    if (!text.startsWith(stamp)) r.err("S10", `«Вывод» начинается не со штампа «${stamp}»`);
    const n = sentences(text).length;
    if (n > 3) r.err("S11", `«Вывод»: ${n} предл. — не больше 3`);
    if (new RegExp(REF_FIG.source, "iu").test(text) || new RegExp(REF_TAB.source, "iu").test(text)) r.err("S11", "«Вывод» ссылается на рисунок или таблицу — это пересказ работы");
    const words = (goalText.toLowerCase().match(/[а-яёa-z0-9#+]+/g) || []).slice(1).filter((w) => w.length >= 4);
    const lowerText = text.toLowerCase();
    if (words.length >= 3) {
      const kept = words.filter((w) => lowerText.includes(w.slice(0, Math.min(5, w.length)))).length / words.length;
      if (kept < 0.6) r.warn("S10", `«Вывод» сохранил ${Math.round(kept * 100)}% слов Цели — Цель копируется дословно (или работа не совпадает с Целью — S12)`);
    }
  }
};
