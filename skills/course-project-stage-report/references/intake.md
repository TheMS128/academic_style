# Intake — what to ask, where the answers go

Before the first build of a lab, one message carries every open question below; ask only
what the sources (`RULES.MD`, `CONTEXT.MD`, `notes.md`, the assignment, `facts.js`) do
not already answer. Never fill a gap with a guess.

**I1. Project files.** `RULES.MD` (student, stable) and `CONTEXT.MD` (current work) in
the project root. Missing → create from `<skill>/templates`, ask for
the values, no build before they are filled.

**I2. Title fields.** Show the table from `fields.js` and ask: «Данные верны? Если нет —
пришлите строки в формате `Поле: значение`.» A value marked **НЕВЕРНО** or **НЕ
ЗАПОЛНЕНО** is asked about in the same message. Corrections go to `RULES.MD` /
`CONTEXT.MD` before the first build, to `meta.json` after it. Names are `Фамилия И. О.`
in the sources; the title page prints `И. О. Фамилия` itself. Ask again whenever the
user changes a field.

**I3. Должность.** No `Должность` in `RULES.MD` → ask for exactly one of `зав. кафедры
ИСПИ`, `доцент каф. ИСПИ`, `ст. преп. каф. ИСПИ`, `ассистент каф. ИСПИ`; record it there.

**I4. Variant.** The assignment has individual variants and the number is unknown →
ask for it.

**I5. Theory block.** `fields.js` reports «НЕ УКАЗАН» → «Требует ли методичка
теоретическую часть?»; record in `RULES.MD` as `Теоретический блок: требуется / не
требуется (<дисциплина>)`.

**I6. «Ознакомиться с …».** An assignment item so worded is asked about for this lab,
even when `RULES.MD` holds a course-wide answer: «Пункт «Ознакомиться с …» — писать по
нему теоретическую часть?» Answer → `notes.md`. Its effect: S6.

**I7. Optional exercises.** Only when the assignment text offers them — marked
«дополнительные», «по желанию», «повышенной сложности», or a minimum «не менее N»: «Выполнять
ли дополнительные задания? Если да, то какие?» Only the named ones are written. No such
exercises in the text → nothing is asked and nothing is invented; a mandatory minimum
already closed → no exercise is added to «усилить» the report. Placement: S8.

**I8. Facts.** `notes.md` missing or thin → 3–5 of these, only the unanswered ones:

- Что не получилось с первого раза и как это решили?
- Где реализация отличается от методички и почему?
- Почему выбран именно этот вариант — библиотека, структура, цвета, раскладка?
- Что заняло больше всего времени?
- Что сделано упрощённо или осталось недоделанным?

«Не знаю» or a skipped question means writing without that fact.

**I9. Judgement calls** — asked, never decided alone: `Задание` vs `Задания` when it is
genuinely unclear (S3); a requirement vs an example of the methodichka (F4).

**Asked later, once per report, when it comes up:** a figure that does not fit a page
(G7); a missing toolchain for run figures (G1).

| Answer | Goes to |
| --- | --- |
| title fields, Должность, theory flag | `RULES.MD` / `CONTEXT.MD` (after the first build: `meta.json`) |
| variant, «Ознакомиться», optional exercises, facts, tall-figure choice | `reports/<lab>/notes.md` (format F6) |
