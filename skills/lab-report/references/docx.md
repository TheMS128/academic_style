# Document format — reference

Read only when changing the look, adapting to another university or course template,
or debugging a built file. Everything here is implemented in `assets/lib`; a report's
`build.js` never sets formatting.

## Modules

| File | Responsibility |
| --- | --- |
| `lib/profile.js` | every number: page, fonts, sizes, indents, gaps, table and figure widths, caption formats, title-page rows, institution header |
| `lib/styles.js` | named styles, list numbering |
| `lib/title.js` | title page |
| `lib/blocks.js` | content descriptors used by `build.js` |
| `lib/compose.js` | descriptors → docx: figure / table numbering, PNG size, table split |
| `lib/meta.js` | title fields (RULES.MD / CONTEXT.MD → `meta.json`), their validation, the theory flag, document properties |
| `lib/index.js` | `buildReport` / `run`: compose, pack, write, lint |
| `lint/` | checks, one module per rule owner: `format.js` (B, docx), `structure.js` (S), `text.js` (hands the document to the core lint for V, L, F, T with `profile.json`), `phrases.js` (phrase lists of S), `parse.js` (docx → paragraphs) |
| `bin/lint.js` | lint CLI: `node lint.js <docx> [--project <dir>]` |
| `bin/preview.js` | docx → PNG through docx-preview |
| `bin/render.js` | HTML → PNG, cropped |
| `bin/fields.js` | title-field confirmation table |
| `bin/versions.js` | installed toolchain versions |
| `bin/facts.js` | facts of the actual work: git history, dependencies, tools, code inventory, `notes.md` |

Another university or an explicit course spec: copy `VLSU` in `profile.js`, change the
values, pass `profile` to `run()`. A supplied `.dotx` template or reference report is a
layout reference — match it through the profile, never copy its names or data.

## Profile (ВлГУ)

- A4; margins top 2 cm, bottom 2 cm, left 3 cm, right 1.5 cm.
- Body: Times New Roman 14, justified, first line 1.25 cm, single spacing, 0 before /
  0 after, no blank paragraphs anywhere.
- Language ru-RU; listing runs en-US.
- Gaps: before Глава 20 pt, before Подглава 10 pt, before a table caption 14 pt, before
  a figure image 14 pt; after a figure caption 14 pt, after the last code line 14 pt; the
  paragraph after a table grid gets 14 pt before; caption → grid 0; a table caption that
  opens a page 0.
- Lists: decimal «1.», number at 0.25 in, text at 0.5 in, hanging 0.25 in; every list
  restarts at 1.
- Tables: 15 cm, fixed layout, 0.5 pt borders, header row repeats on a continuation page,
  rows never split.
- Figures: 580 px wide by default, 614 px `wide` — Word Online overflows the column past
  6.4 in. The image is kept on the page of its caption.
- No table of contents, running headers / footers or page numbers unless asked.

## Styles

| Word name | id | Look |
| --- | --- | --- |
| Основной текст | `OsnTekst` | TNR 14, justified, first line 1.25 cm |
| Основной текст — список | `OsnTekstSpisok` | + list indent |
| Основной текст — рисунок | `OsnTekstRisunok` | centred, 14 pt before, keep with next |
| Основной текст — подпись рисунка | `OsnTekstPodpisRisunka` | centred, 14 pt after |
| Основной текст — подпись таблицы | `OsnTekstPodpisTablicy` | centred, 14 pt before, keep with next |
| Основной текст — таблица | `OsnTekstTablica` | left, no indent |
| Основной текст — шапка таблицы | `OsnTekstShapkaTablicy` | bold, centred |
| Глава | `Glava` | bold, centred, 20 pt before, outline level 1 |
| Подглава | `Podglava` | bold, left, first line 1.25 cm, 10 pt before, outline level 2 |
| Титульник | `Titulnik` | TNR 14, centred (city and year) |
| Титульник — шапка | `TitulnikShapka` | 12 pt |
| Титульник — название | `TitulnikNazvanie` | 22 pt |
| Титульник — подписи | `TitulnikPodpisi` | left, indent 11 cm |
| Листинг — заголовок | `ListingZagolovok` | flush left, 14 pt before |
| Листинг | `Listing` | Courier New 11, flush left, en-US |

Ids are custom, not `Heading1` / `Heading2`: docx-js always writes its own Heading1–6
definitions, and redefining those ids produced duplicate styles. Outline levels on Глава
/ Подглава keep the navigation pane. Russian Word also shows its built-in «Body Text» as
«Основной текст»; ours is a separate style.

## Title page

Four ordinary paragraphs — header, title block, signatures, city and year; the lines of
a block are joined by soft line breaks. The title styles have **exact** line heights
(`profile.title.lineHeight`: 276 / 540 / 322 twips for 12 / 22 / 14 pt), and `title.js`
breaks the discipline, topic and signature lines itself with a Times New Roman width
estimate, so every block's height is known before Word sees the file. The gaps are then
computed: title block centred at `titleCenter` (5300 twips from the top of the text
area), signatures from `signTop` (8600), city line `slack` (540, one 22 pt line) above
the bottom margin, at least `minGap` (400) between blocks. The slack absorbs one wrap the
estimate did not foresee. The section is justified vertically (`verticalAlign: "both"`),
so Word itself pins the city line to the bottom margin and spreads the slack.

docx-js closes a section with an extra empty paragraph holding the section break;
`pack()` moves the break into the city paragraph, so the title section has no stray line
and the body starts on page 2 without a page break.

Rejected: `spacing.before` over *auto* line spacing and blank paragraphs (line height
follows font metrics, which differ between Word and Word Online — the city line spilled
onto page 2); a first-page footer (greyed out in the editor); a borderless table with
exact row heights (Word Online shows its dashed gridlines); frames (poor Word Online
rendering).

- A title that does not fit raises an error at build time: shorten the topic or lower
  `signTop`. `preview.js` confirms section 1 is one page.
- Header block: each line its own paragraph with deliberate breaks — after
  «университет», after «учреждение».
- The teacher's post is the separate field `Должность`, printed above the name; its
  allowed values are `profile.title.posts`.

## Document properties

`pack()` replaces `docProps/core.xml` and `docProps/app.xml`:

- title = Тема; subject = «<Тип работы> работа №<N>» (a course project: «Курсовой проект,
  этап <N>»); creator and lastModifiedBy =
  Выполнил; description / keywords from `build.js`;
- created = first build minus 1–14 days; revision 20–50 at the first build, +1–3 per
  rebuild; modified = build time — kept in `meta.json` → `docProps`; delete that key to
  regenerate;
- app.xml in the shape Word for the web writes: Normal.dotm, «Microsoft Word for the
  web», 16.0000.

## Verification

Every build runs `lint/`; each problem names the rule id it enforces. The list of checks
is the code itself — one module per rule owner (see Modules); a new rule gets its check
in the module of its owner file, tagged with its id.

Title fields are validated at build time (`meta.js → invalidFields`): template
placeholders `<…>` / `(…)` count as empty; `Год` four digits, `Номер работы` a number,
`Тип работы` Лабораторная / Практическая / Курсовой проект (its `Номер работы` is the
stage; the title block prints «Курсовой проект», Тема names the stage), names `Фамилия И. О.`, `Должность` one of
`profile.title.posts`.

`preview.js` renders with docx-preview in headless Edge. It is faithful for styles, the
title page, lists and tables, but breaks pages only at section and page breaks: it checks
that the title page is one page, not where Word breaks the flowing text. Word Online is
the final check. There is no Word or LibreOffice on this machine; WordPad is gone from
Windows 11 24H2+ and never rendered docx layout.

Both `preview.js` and `render.js` launch Edge through `lib/edge.js → runEdge`, which
passes `--edge-skip-compat-layer-relaunch` and a fresh temp `--user-data-dir` per run.
Since Edge 153, `msedge.exe` otherwise relaunches itself and exits 0 at once, so
`--dump-dom` prints nothing and `--screenshot` writes no file, whether or not Edge is
open. Any new headless call goes through `runEdge`, never a bare `msedge.exe`.

