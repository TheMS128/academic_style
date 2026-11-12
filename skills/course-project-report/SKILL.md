---
name: course-project-report
description: >-
  Write and assemble the explanatory note of a course project ("курсовой проект", "КП",
  "пояснительная записка", "ПЗ", "записка к курсовому") in IT, programming, databases
  and systems analysis as a Word (.docx) document in the ЕСКД layout: a frame on every
  sheet, the title block («основная надпись») of ГОСТ 2.104, a title page, an abstract
  in Russian and English, contents, numbered chapters, a list of sources and
  appendices. Use when the user asks to write, format or rebuild the note of a course
  project or any of its parts — аннотация, введение, глава, заключение, список
  использованных источников, приложение. For a lab or a practical work use lab-report
  or practice-report; for the stages of a course project handed in as separate reports
  use lab-report.
---

# Course project — the explanatory note

This skill knows what the explanatory note of a course project consists of and how it is
assembled as a `.docx` with a frame and a title block. It does not know how the text is
written: that is the **core** skill, which this one calls with its genre profile. Quoted
Russian strings in the skill files are literal templates — reproduce them verbatim.

Paths: `<skill>` = the directory holding this SKILL.md, wherever it is installed;
`<assets>` = `<skill>/assets`; `<core>` = `<skill>/../core`; `<lab>` =
`<skill>/../lab-report`. The builder runs on the libraries of `<lab>` and on the lint of
`<core>`: all three skills are installed side by side. The skill lives outside the
project; the project supplies `RULES.MD` and `CONTEXT.MD`, and the note lives in
`kp/<project>/` of the project. Never write the skill's name or a machine-specific path
into these files.

Setup, once per installed version: when `<lab>/assets/node_modules` is missing, run
`npm i` in `<lab>/assets`.

## Rule files

Every rule has an id and its full text lives in exactly one file. The build prints the id
of every problem — open that rule, not the whole file.

| Id | File | Owns |
| --- | --- | --- |
| K | `references/structure.md` | the parts of the note, their order and what each one holds |
| E | `references/document.md` | carrying the draft into `build.js`; headings, lists, figures, tables, listings, sources, the fields of the title block |
| — | `references/layout.md` | the frame, the title block and the styles — maintenance only |
| — | `profile.json` | the genre profile handed to the core |
| V, L, F, T | `<core>/references/` | how the text is written — the core's rules, never restated here |

## Hard stops

- No `RULES.MD` / `CONTEXT.MD` in the project root, or a field of E1 is empty → ask the
  user. Never invent a name, a group, a teacher or the document code («Шифр документа»).
- No `<core>/SKILL.md` or no `<lab>/SKILL.md` → stop and say which skill is not installed
  next to this one.
- A fact the note needs and the project does not contain — a measured result, a cost, a
  source — is asked for (F1 of the core), never made up. A source goes into the list only
  when the author has used it; its address and date are the author's.
- Diagrams are not drawn by this skill. A figure is a PNG the author supplies or another
  tool produces; a missing one is listed among the open places.
- The skill's own files are edited only when the user asks in this conversation.

## Workflow

The note is made in two passes that do not mix: first the **text**, written by the core's
rules into a draft; then the **document**, where the finished draft is carried into
`build.js` word for word.

1. **Read** `references/structure.md`. Collect what the project already has: the
   assignment and the department's guidelines, models and diagrams, code, calculations,
   test results, the author's notes (`kp/<project>/notes.md`).
2. **Intake** — before the first build (no `kp/<project>/meta.json` yet): check the fields
   of E1 in `RULES.MD` and `CONTEXT.MD` and ask for every missing one in **one** message,
   together with the outline of chapters (K5) when the assignment does not fix it and
   with the sheet that carries the large title block (E10) when the department's
   guidelines do not say.
3. **Text.** Read `<core>/SKILL.md` and follow its Mode A with:
   - the profile `<skill>/profile.json`;
   - the outline: the parts of K1, the chapters and subchapters agreed in step 2;
   - the facts of step 1 and the figures with what each one shows.

   The draft is `kp/<project>/text.md`, with the core's inventory and open-places files
   next to it. K says what each part holds while it is written. The core's own check and
   its questions about the open places are part of this step.
4. **Document.** Read `references/document.md` and write `kp/<project>/build.js` from
   `text.md` (E2) — content only, the words as they stand in the draft.
5. **Build**: `node <assets>/bin/build.js kp/<project>`. Output:
   `<repo>/<Группа>-<Дисциплина>-КП-ПЗ-<Фамилия>.docx` (`ПРИ123-ТП-КП-ПЗ-Иванов.docx`).
   The first build freezes the fields into `meta.json`; every build checks the structure
   (K), the document (E) and the text (the core's rules). Fix every «ОШИБКА». Fix a
   «замечание» or leave it with a reason. A problem with an id of the core is fixed in
   `text.md` by the core's rule and carried over again.
6. **Sheet count.** The contents and the number of sheets are Word fields. Tell the user
   to open the file in Word, update the fields when asked (or Ctrl+A, F9) and report the
   number of sheets; write it into `meta.json` as `"pages": N` and build again, so the
   abstract names the number in words that agree with it (E9).
7. **Reply** with the file path, the result of the checks in a line or two, and the open
   places still waiting for the user. Say plainly that the frame and the title block can
   be judged only in Word: the builder cannot open the file there.

**Editing an existing note** — the wording changes in `text.md` and is carried into
`build.js` (E2). A request to make the text stop reading as generated is the core's
Mode B with this skill's profile.

A single part asked for on its own — an abstract, an introduction, a conclusion — is plain
text written by the core's rules with this skill's profile and K for what the part holds.
A whole note is a `.docx` by default.
