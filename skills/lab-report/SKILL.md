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

This skill knows what a lab report consists of and how it is assembled as a `.docx`. It
does not know how the text is written: that is the **core** skill, which this one calls
with its genre profile. Quoted Russian strings in the skill files are literal templates —
reproduce them verbatim.

Paths: `<skill>` = the directory holding this SKILL.md, wherever it is installed;
`<assets>` = `<skill>/assets`; `<core>` = `<skill>/../core` — the core skill, installed
next to this one; `references/…` are relative to `<skill>`. The skill lives outside the
project; the project supplies `RULES.MD` and `CONTEXT.MD`, and each report lives in
`reports/<lab>/` of the project. Never write the skill's name or a machine-specific path
into these files.

Setup, once per installed version: when `<assets>/node_modules` is missing, run `npm i`
in `<assets>`. The core needs no setup.

## Rule files

This file only orchestrates. Every rule has an id and its full text lives in exactly one
file; other files cite the id. Lint prints the id of every problem — open that rule, not
the whole file.

| Id | File | Owns |
| --- | --- | --- |
| I | `references/intake.md` | what to ask the user, where the answers go |
| S | `references/structure.md` | chapters, their order and content, Вывод, the answer to every requirement |
| D | `references/sources.md` | where the facts of a lab come from, deviations, the tools of the work, `notes.md` |
| B | `references/blocks.md` | carrying the draft into `build.js`; listings, figures and captions in the document |
| G | `references/figures.md` | producing the pictures |
| — | `references/families/*.md` | what one kind of lab adds on top of S |
| — | `references/docx.md` | formatting and the builder's internals — maintenance only |
| — | `profile.json` | the genre profile handed to the core: reader, sources, verbatim chapters, exemptions |
| V, L, F, T | `<core>/references/` | how the text is written, lists and tables, facts, signs of generated text — the core's rules, never restated here |

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
- No `<core>/SKILL.md` → stop and say that the core skill is not installed next to this
  one. The text is not written without it.
- The skill's own files (`<skill>`, `<core>`, outside any project) are edited only when
  the user asks in this conversation: say in one sentence what and why, wait for the
  go-ahead. A rule that got in the way is reported, never quietly
  rewritten; fixes to a report go into `reports/<lab>/`.

## Workflow

The report is made in two passes that do not mix: first the **text**, written by the
core's rules into a draft; then the **document**, where the finished draft is carried
into `build.js` word for word. The builder's calls are not open while the text is being
written — a text written next to `table()` and `list()` grows tables and lists.

1. **Classify** the lab and read its family file, `structure.md` and `sources.md`.
2. **Facts.** `node <assets>/bin/facts.js reports/<lab>` (`--project <dir>` when the code
   is not at the repo root); read `CONTEXT.MD` and the assignment (D1).
3. **Intake** — before the first build of a lab (no `reports/<lab>/meta.json` yet), or
   when the user changes a title field: read `intake.md`, run
   `node <assets>/bin/fields.js reports/<lab>`, ask everything open in **one** message,
   save the answers, go on after the confirmation.
4. **Figures** — read `figures.md`; sources and PNGs go to `reports/<lab>/figures/`.
5. **Text.** Read `<core>/SKILL.md` and follow its Mode A with:
   - the profile `<skill>/profile.json`;
   - the outline: the chapters of S1 for this course, and inside `Выполнение работы` the
     blocks of the family file;
   - the facts of steps 2–4, the figures with what each one shows, and the code.

   The draft is `reports/<lab>/text.md`, with the core's inventory and open-places files
   next to it. The genre rules shape it while it is written: S for what each chapter
   holds, D2–D3 for deviations and tools, B6 for where a listing's file is named. Before
   the draft is accepted, go through the assignment clause by clause (S14). The core's
   own check (its step 4, its lint on `text.md` with the profile) is part of this step,
   and so is asking the user about the open places it returns — answers go to `notes.md`
   (D4).
6. **Document.** Now read `blocks.md` and write `reports/<lab>/build.js` from `text.md`
   (B1, B3) — content only, the words as they stand in the draft.
7. **Build**: `node <assets>/bin/build.js reports/<lab>`. Output:
   `<repo>/<Аббревиатура дисциплины>_<N>_<Фамилия>.docx` («Основы алгоритмизации и
   программирования», №1, Парфеньев → `ОАиП_1_Парфеньев.docx`; function words give a
   lower-case letter). The first build freezes the title fields into `meta.json`; every
   build updates the document properties and runs lint — the document's own rules (S, B)
   and the core's rules on the built text. Fix every «ОШИБКА». Fix a «замечание» or
   leave it with a reason. A problem with an id of the core (V, L, F, T) is fixed in
   `text.md` by the core's rule and carried over again; a phrase is rewritten around the
   concrete fact of this work, never swapped for a synonym.
8. **Preview**: `node <assets>/bin/preview.js "<docx>" reports/<lab>/preview.png` — expect
   «раздел 1: 1 стр.» and look at the PNG. docx-preview does not break flowing text into
   pages: the page flow is final only in Word Online — tell the user.
9. **Reply** with the file path and the lint / preview result in a line or two, and the
   open places still waiting for the user. The document itself contains no preamble.

**Editing an existing report** — the wording changes in `text.md` and is carried into
`build.js` (B3); a report made before the draft existed has its text only in `build.js`,
and is edited there. A request to make the text stop reading as generated is the core's
Mode B with this skill's profile. Цель, Задание and the first sentence of the Вывод are
not rewritten (S2, S3, S10).

A single section, listing or fragment asked for on its own is plain text that starts
directly with the content — written by the core's rules with this skill's profile. A
whole report is a `.docx` by default.
