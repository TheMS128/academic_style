# E — the document

How the finished draft becomes `kp/<project>/build.js` and what the builder does with it.
Read this file only after the text is written (step 4 of SKILL.md).

**E1. Fields.** The title page and the title block are filled from the project's files by
exact key; the first build freezes them into `kp/<project>/meta.json`, later builds read
only that file.

| Key | File | Example |
| --- | --- | --- |
| `Город`, `Год` | `RULES.MD` | `Владимир`, `2026` |
| `Выполнил` | `RULES.MD` | `Иванов И. И.` |
| `Группа` | `RULES.MD` | `ПРИ-123` |
| `Должность` | `RULES.MD` | `доцент каф. ИСПИ` — the post of the teacher |
| `Дисциплина` | `CONTEXT.MD` | `Технологии программирования` |
| `Тема` | `CONTEXT.MD` | the topic, without the words «курсовой проект» |
| `Принял` | `CONTEXT.MD` | `Петров П. П.` |
| `Шифр документа` | `CONTEXT.MD` | `ВлГУ.09.03.04.16 ПЗ` |

`Шифр документа` is given by the department (organisation, code of the programme, the
student's number, `ПЗ`); it is asked for, never composed.

**E2. `build.js`.** The file exports a function of the blocks and returns the note. It
holds content only — no path to the skill, no formatting. The draft is carried over word
for word: a sentence is not reworded, split or merged on the way.

```js
module.exports = ({ abstract, intro, chapter, section, point, p, list, steps,
                    figure, table, listing, conclusion, sources, appendix }) => ({
  description: "одно предложение о работе — в свойства документа",
  keywords: "ключевые слова через запятую",
  body: [
    abstract(["Абзац.", "Пояснительная записка содержит {pages:лист|листа|листов}, …"],
             ["Paragraph.", "The explanatory note contains {pages:page|pages}, …"]),
    intro(),
    p("…"),
    chapter("Анализ предметной области"),
    section("Описание предметной области"),
    p("… показаны на рисунке {fig:uc} [{src:uml}]."),
    figure("uc", "uc.png", "Диаграмма прецедентов"),
    conclusion(),
    p("…"),
    sources([["uml", "Диаграммы прецедентов // …: сайт. – URL: … (дата обращения: 21.12.2025)"]]),
    appendix("sql", "Создание базы данных"),
    listing("ddl", "CREATE TABLE …", "Листинг создания таблиц"),
  ],
});
```

`body` starts with `abstract(…)`. Text is a string, or an array of strings and
`{ text, bold, italic }` segments.

| Draft | Block |
| --- | --- |
| `# Введение`, `# Заключение` | `intro()`, `conclusion()` |
| `# Глава` / `## Подглава` / `### Пункт` | `chapter` / `section` / `point` |
| paragraph | `p` |
| list with dashes / numbered list | `list` / `steps`; an item with nested items is `[text, [items]]` |
| `![Название](file.png)` | `figure(key, file, caption)` |
| table with its caption line | `table(key, caption, { columns, rows })` |
| fenced code | `listing(key, code, caption)` |

**E3. Headings.** Written without a number and without a full stop: the builder numbers
them («1 НАЗВАНИЕ», «1.1 Название», «1.1.1 Название»), sets a chapter in capitals and
starts it on a new sheet. The structural parts have fixed names and are not typed.

**E4. Lists.** `list` puts a dash before each item, `steps` — «1)», «2)», the nested level
— «а)», «б)». Items start with a lower-case letter and end with a semicolon, the last one
with a full stop, when the list continues its lead-in sentence; items that are whole
sentences start with a capital and end with a full stop. Whether the text needs a list at
all is decided by the core (L-rules), not here.

**E5. Figures.** `file` is a PNG in `kp/<project>/figures/`. The caption is «Рисунок N –
Название»: the builder writes the word and the number, the block gives the name — from a
capital letter, without a full stop. A picture wider than 16 cm or taller than 20 cm is
scaled down; `{ width: 12 }` sets the width in centimetres. Every figure is referred to
in the text before it appears: «(рисунок {fig:key})», «представлена на рисунке
{fig:key}».

**E6. Tables.** The name stands above the table: «Таблица N – Название». `columns` give
the heads and the relative widths, `rows` — the cells. Every table is referred to by
`{tab:key}` before it appears.

**E7. Listings.** Code is set in a monospaced font and captioned below as a figure —
«Рисунок N – Листинг создания функции …» — and it shares the numbering of the figures, so
it is referred to by `{fig:key}`. The caption names what the code is. A listing in the
text is the fragment the paragraph speaks about; a whole file goes to an appendix (K11).
What the paragraph before a listing says is L7 of the core.

**E8. References.** A number is never typed. `{fig:key}`, `{tab:key}` and `{app:key}` give
the number or the letter; `[{src:key}]` prints «[3]». A missing key stops the build; a
figure, a table or a listing that nothing refers to is an error, a source that nothing
refers to — a «замечание».

**E9. Counts.** `{pages}`, `{figures}`, `{tables}`, `{sources}` and `{appendices}` give
the numbers of the note. With word forms the noun agrees with the number:
`{figures:рисунок|рисунка|рисунков}`, in English `{figures:figure|figures}`. `figures`
counts the listings too, since they are numbered with the figures. The number of sheets
is known only to Word: until `meta.json` holds `"pages": N`, `{pages:…}` is a NUMPAGES
field followed by the last word form; after that it is the number with the form that
agrees with it. A change that moves the text to another number of sheets is followed by a
new look in Word and a new `pages`.

**E10. The title block.** Sheet 2 (the abstract) and the first sheet of the contents
carry form 2 of ГОСТ 2.104: the document code, the topic with «Пояснительная записка»,
the letter «У», the sheet and the number of sheets, the group, the student in «Разраб.»
and the teacher in «Пров.». Every later sheet carries form 2а with the code and the sheet
number. The title page has the frame only. Nothing of this is typed in `build.js`: it is
made from the fields of E1.

**E11. What the build reports.** «ОШИБКА СБОРКИ» — the document was not made: a missing
field, a missing key, a picture that is not a PNG. «ОШИБКА [id]» and «замечание [id]» —
the document is made and a rule is broken; K and E are this skill's, V, L, F and T — the
core's.

**E12. After the build.** The builder cannot open the file in Word. The first time a note
is built, and after any change of `layout.md` or of the profile, the author is asked to
look in Word at: the frame and the title block on sheets 1–4, the contents after the
fields are updated, the last sheet. docx-preview shows neither the frame nor the title
block and is not a check of them.
