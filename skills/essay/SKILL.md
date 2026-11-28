---
name: essay
description: >-
  Write, assemble or rebuild an essay ("реферат") on a topic of a discipline as a Word
  (.docx) document: the plugin's title page with «Реферат», contents, introduction,
  numbered chapters in capitals, conclusion, a list of sources by ГОСТ Р 7.0.100 and
  appendices. Use when the user asks to write or format a реферат, or to rebuild an
  essay that already exists as a .docx — "реферат", "оформи реферат", "пересобери
  реферат". For a lab, practical work or course project use lab-report,
  practice-report or course-project-report.
---

# Essay (реферат)

This skill knows what an essay consists of and how it is assembled. It does not know how
the text is written: that is the **core** skill, called with this skill's profile. Quoted
Russian strings in the skill files are literal templates — reproduce them verbatim.

Paths: `<skill>` = the directory holding this SKILL.md; `<assets>` = `<skill>/assets`;
`<core>` = `<skill>/../core`; `<lab>` = `<skill>/../lab-report`; `<kp>` =
`<skill>/../course-project-report`. The builder runs on the libraries of `<lab>` (the title
page) and `<kp>` (the text: contents, chapters, sources, appendices, 1.5 lines): all are
installed side by side. The project supplies `RULES.MD` and `CONTEXT.MD`; an essay lives in
`essay/<name>/` of the project. Never write the skill's name or a machine-specific path
into these files.

Setup, once per installed version: when `<lab>/assets/node_modules` is missing, run `npm i`
in `<lab>/assets`.

## Rule files

| Id | File | Owns |
| --- | --- | --- |
| R | `references/structure.md` | the parts of an essay, the title page, the file name |
| E, K10–K12 | `<kp>/references/` | blocks of `build.js`, headings, lists, figures, tables, references, sources — the course project's rules, the same builder |
| — | `profile.json` | the genre profile handed to the core |
| V, L, F, T | `<core>/references/` | how the text is written — the core's rules |

## Hard stops

- No `<lab>`, `<kp>` or `<core>` next to this skill → stop and say which one is missing.
- A new essay needs `RULES.MD` and `CONTEXT.MD` with `Дисциплина`, `Тема`, `Принял`; never
  invent a name, a group or a teacher.
- Nothing is invented: a source, a date, a figure the sources do not give (F2).

## A new essay

1. **Topic and sources.** From the user: the discipline, the topic, the variant if any,
   the sources the essay will stand on (R6) — or permission to find them, in which case
   every source is shown to the user before it is used (K12).
2. **Text.** Read `<core>/SKILL.md` and follow its Mode A with the profile
   `<skill>/profile.json` and the outline of R1; the draft is `essay/<name>/text.md`.
3. **Document.** Read `<kp>/references/document.md` (E2–E8) and write
   `essay/<name>/build.js`: a function of the blocks, opening with `contents()`:

   ```js
   module.exports = ({ contents, intro, chapter, section, point, p, list, steps, figure,
                       table, listing, conclusion, sources, appendix }) => ({
     description: "…", keywords: "…",
     body: [contents(), intro(), p("…"), chapter("…"), section("…"), p("…"),
            conclusion(), p("…"), sources([["key", "…"]])],
   });
   ```
4. **Build:** `node <assets>/bin/build.js essay/<name>`. The file goes to the project root
   under the name of R7. Fix every «ОШИБКА» of the build; a «замечание» is fixed or left
   with a reason. The contents and page numbers are fields: Word fills them on opening.
5. **Reply** with the file, the lint result in a line or two, a «ВНИМАНИЕ (титульник)» if
   the build printed one, and the places that need the user.

## Rebuilding an essay

**An essay of this skill** — `essay/<name>/build.js` exists: change the text there (or in
`text.md` and carry it over) and build again.

**An essay made elsewhere** (a .docx) — import it, then build:

1. `node <assets>/bin/import.js "<file.docx>" essay/<name>` — writes `build.js` with the
   original's words in the block calls, `meta.json` with the title fields found on its
   title page, and the pictures to `figures/`. It does not overwrite an existing
   `build.js`.
2. **Check the import** against the original: headings at the right level, lists, the
   figure with its caption, the sources and the references `[{src:…}]` to them. The import
   prints what it could not find; a title field it did not find (often `Должность`) is
   asked of the user and written into `meta.json`.
3. **Build** as in step 4 above. The text is not changed by the rebuild: errors of the
   lint on an imported essay (sources not by ГОСТ Р 7.0.100, a figure with no reference,
   wording) are listed for the user with the build, and fixed only when the user asks —
   then by the core's rules, in `build.js`.

Only the layout and the title page change in a rebuild; the old file stays where it was.
