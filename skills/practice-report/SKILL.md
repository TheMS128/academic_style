---
name: practice-report
description: >-
  Generate a report for a practical work ("практическая работа", "ПР", "отчёт по
  практической") in IT, programming, systems analysis and web / graphic design,
  assembled as a Word (.docx) document with a title page. Use when the work the user
  names is a practical one, or `Тип работы` in the project's CONTEXT.MD is
  «Практическая». It is the lab-report skill with two differences: the title page says
  «Практическая работа» and the report has no «Вывод» unless the user asks for
  one. For a lab work use lab-report.
---

# Practice report

A practical work is reported exactly like a lab work, with two differences. This skill
holds only those two; everything else — the workflow, the rules, the builder, the lint —
is the `lab-report` skill and is not copied here.

Paths: `<skill>` = the directory holding this SKILL.md; `<lab>` = `<skill>/../lab-report`;
`<core>` = `<skill>/../core`.

## How to work

Read `<lab>/SKILL.md` and follow it step by step, as if it were this file. Wherever it
says `<skill>`, its own directory `<lab>` is meant — its `references/`, its `assets/` —
with one exception: the profile handed to the core is this skill's `<skill>/profile.json`,
which is built on the lab report's.

No `<lab>/SKILL.md` → stop and say that the `lab-report` skill is not installed next to
this one.

## The two differences

**P1. The type of the work.** `Тип работы` in the project's `CONTEXT.MD` is
`Практическая`. The title page then prints «Практическая работа №N» and the file is named
`<Аббревиатура>_ПР_<N>_<Фамилия>.docx`. A `CONTEXT.MD` that says `Лабораторная` for a work
the user calls practical is a question to the user (I1 of the lab report), not something
to change silently.

**P2. No «Вывод» by default.** The report ends with `Выполнение работы` or, when the
course asks for them, with `Контрольные вопросы`. Nothing takes the place of the Вывод: no
closing paragraph that sums the work up at the end of `Выполнение работы` (T2 of the
core).

When the methodichka's assignment has an item about a conclusion («Сделать вывод»), the
user is asked once, together with the other intake questions, whether this practical work
gets a `Вывод`. The answer goes to `notes.md` and decides both things at once:

- **no** (also the default when the user gives no answer) — there is no `Вывод`, and the
  item about it is left out of `Задания`. This is the one place where an item of the
  methodichka's assignment is dropped; the other items stay word for word (S3);
- **yes** — the item stays in `Задания` as the methodichka has it, and the `Вывод` is
  written by S10–S12 of the lab report, with the stamp «В ходе выполнения практической
  работы».

An assignment with no such item gets no question and no `Вывод`.

The lint knows both rules: with `Тип работы: Практическая` it does not ask for a `Вывод`,
and it reports a `Вывод` without the item in `Задания` or the item without a `Вывод`.
