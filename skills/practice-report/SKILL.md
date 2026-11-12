---
name: practice-report
description: >-
  Generate a report for a practical work ("практическая работа", "ПР", "отчёт по
  практической") in IT, programming, systems analysis and web / graphic design,
  assembled as a Word (.docx) document with a title page. Use when the work the user
  names is a practical one, or `Тип работы` in the project's CONTEXT.MD is
  «Практическая». It is the lab-report skill with two differences: the title page says
  «Практическая работа» and the report has no «Вывод». For a lab work use lab-report.
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

**P2. No «Вывод».** The report ends with `Выполнение работы` or, when the course asks for
them, with `Контрольные вопросы`. The rules of the lab report about the Вывод (S10–S12) do
not apply, and nothing takes its place: no closing paragraph that sums the work up at the
end of `Выполнение работы` (T2 of the core). An item «Сделать вывод» in the assignment is
kept in `Задания` word for word, as the methodichka has it, and is not answered by a
chapter; when the methodichka of a practical work plainly demands a written conclusion,
that is a question to the user.

The lint knows both: with `Тип работы: Практическая` it does not ask for `Вывод` and
reports one that is there.
