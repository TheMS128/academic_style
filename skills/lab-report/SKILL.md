---
name: lab-report
description: >-
  Generate academic reports for lab and practical work in IT, programming,
  systems analysis and web / graphic design, assembled as a Word (.docx)
  document with a title page. Use when the user asks to write or format a
  report ("отчёт по лабораторной", "отчёт по практике", "оформить отчёт",
  "оформить в Word", "титульный лист", "вывод к работе") or any of its parts —
  Цель работы / Задание / Выполнение работы / Вывод, figure captions, code
  listings. Covers coding exercises (HTML/CSS/JS, SQL, programs, mobile apps),
  modelling (UML, ERD, architecture), design and prototyping (functional spec,
  IA, navigation, wireframes) and statistical labs. Terse formal-academic
  Russian, fixed section structure.
---

# Lab report

Output is dry, technical, formal-academic **Russian**. Quoted Russian strings in the
skill files are literal templates — reproduce them verbatim.

Paths: `<skill>` = the directory holding this SKILL.md, wherever it is installed;
`<assets>` = `<skill>/assets` (one-time setup: `npm i` there); `references/…` are
relative to `<skill>`. The skill lives outside the project; the project supplies
`RULES.MD` and `CONTEXT.MD`, and each report lives in `reports/<lab>/` of the project.
Never write the skill's name or a machine-specific path into these files.

## Rule files

This file only orchestrates. Every rule has an id and its full text lives in exactly one
file; other files cite the id. Lint prints the id of every problem — open that rule, not
the whole file.

| Id | File | Owns |
| --- | --- | --- |
| I | `references/intake.md` | what to ask the user, where the answers go |
| S | `references/structure.md` | chapters, their order and content, Вывод |
| B | `references/blocks.md` | the `build.js` API; lists, tables, listings, figures and captions in the document |
| V, T | `references/voice.md` | wording, figure paragraphs, references, signs of generated text |
| F | `references/facts.md` | what the text may state, deviations, which tools are named |
| G | `references/figures.md` | producing the pictures |
| — | `references/families/*.md` | what one kind of lab adds on top of S |
| — | `references/docx.md` | formatting and the builder's internals — maintenance only |

The lab's family:

| The lab produces | File |
| --- | --- |
| code exercises — HTML/CSS/JS, SQL, programs, mobile apps | `families/coding.md` |
| models — UML, ERD, BPMN, architecture | `families/analysis.md` |
| a specification — functional spec, IA, navigation, wireframes | `families/design.md` |
| statistical / computational analysis of data | `families/stats.md` |

A mixed lab takes its skeleton from the main family and borrows blocks from the other.

## Hard stops

- No `RULES.MD` / `CONTEXT.MD` in the project root → I1. Never invent a name, a group or
  a teacher.
- The skill's own files (`<skill>`, outside any project) are edited only when
  the user asks in this conversation: say in one sentence what and why, wait for the
  go-ahead. A rule that got in the way is reported, never quietly
  rewritten; fixes to a report go into `reports/<lab>/`.

## Workflow

1. **Classify** the lab and read its family file, `structure.md`, `voice.md`,
   `blocks.md`, `facts.md`.
2. **Facts.** `node <assets>/bin/facts.js reports/<lab>` (`--project <dir>` when the code
   is not at the repo root); read `CONTEXT.MD` and the assignment.
3. **Intake** — before the first build of a lab (no `reports/<lab>/meta.json` yet), or
   when the user changes a title field: read `intake.md`, run
   `node <assets>/bin/fields.js reports/<lab>`, ask everything open in **one** message,
   save the answers, build after the confirmation.
4. **Figures** — read `figures.md`; sources and PNGs go to `reports/<lab>/figures/`.
5. **Write `reports/<lab>/build.js`** — content only (B1).
6. **Build**: run V9 first, then `node reports/<lab>/build.js`. Output:
   `<repo>/<Аббревиатура дисциплины>_<N>_<Фамилия>.docx` («Основы алгоритмизации и
   программирования», №1, Парфеньев → `ОАиП_1_Парфеньев.docx`; function words give a
   lower-case letter). The first build freezes the title fields into `meta.json`; every
   build updates the document properties and runs lint. Fix every «ОШИБКА». Fix a
   «замечание» or leave it with a reason; a phrase is rewritten around the concrete fact
   of this work, never swapped for a synonym.
7. **Preview**: `node <assets>/bin/preview.js "<docx>" reports/<lab>/preview.png` — expect
   «раздел 1: 1 стр.» and look at the PNG. docx-preview does not break flowing text into
   pages: the page flow is final only in Word Online — tell the user.
8. **Reply** with the file path and the lint / preview result in a line or two. The
   document itself contains no preamble.

A single section, listing or fragment asked for on its own is plain text that starts
directly with the content. A whole report is a `.docx` by default.
