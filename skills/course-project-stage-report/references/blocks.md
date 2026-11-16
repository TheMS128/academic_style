# Blocks — the build.js API and how each block is used

**B1. build.js** holds content only. The skill lives outside the project, so the
require resolves it from the user's home: `<skill-from-home>` is `<skill>` written
relative to the home directory with forward slashes (a standard install gives
`.claude/skills/<skill name>`). No drive letter, user name or absolute path goes into
the project — the same `build.js` works on any machine with the same install:

```js
const { run, chapter, subchapter, p, list, figure, table, listing } =
  require(require("path").join(require("os").homedir(), "<skill-from-home>/assets/lib"));

const body = [
  chapter("Цель работы"),
  p("Изучить …"),
  chapter("Выполнение работы"),
  p("… Результат представлен на рисунке {fig:nav}."),
  figure("nav", "fig1.png", "Постоянная навигация сайта"),
  chapter("Вывод"),
  p("В ходе выполнения лабораторной работы …"),
];

module.exports = { body };
if (require.main === module) run({ reportDir: __dirname, body, description: "…", keywords: "…" });
```

| Call | Produces |
| --- | --- |
| `chapter(text)` | heading, style «Глава» |
| `subchapter(text)` | subheading, style «Подглава» — S5 limits where |
| `p(text)` | paragraph, style «Основной текст»; text is a string or `["…", { text, bold, italic }]` |
| `list([items])` | numbered list, restarts at 1 |
| `figure(key, "figN.png", "Название", { wide, fit })` | image + «Рисунок N – Название» (B8) |
| `table(key, "Название", { columns: [{ title, width, align }], rows, splitAt, pageBreakBefore })` | «Таблица N. Название» + 15 cm grid; `splitAt` continues under «Продолжение таблицы N. Название» |
| `listing(code)` | «Листинг:» + code lines (B6) |
| `{fig:key}` / `{tab:key}` in any text | the figure / table number |

Worked examples: the `reports/lab*/build.js` of the project at hand, when it has them.

**B2. Numbers are never typed** — figures and tables are referred to by key.

**B3. Lists** — always `list()`. Each item is a complete sentence or a full clause,
never a definition pair «Термин: пояснение» / «Термин — пояснение» (except S7); rework
it into a sentence. A task item ending in an enumeration («Разработать элементы
интерфейса: состояния ссылок, …») is fine.

**B4. When a table.** Only for data with **two axes** — several objects described by
the same attributes, read by lookup rather than in order: a comparison of alternatives
against shared criteria; a register of five or more like entities the report refers
back to (разделы, классы, сущности, поля, параметры); measured or computed numbers. A
table the methodichka demands outright is written regardless.

**B5. Table tests** — any one sends the content back to prose or `list()`: two to four
items one sentence would carry; a column that repeats one value or stands half empty;
the content already shown in a figure; rows shaped «заголовок | одно предложение».

**B6. Listings.** The label is «Листинг:», always and only that — the file or component
is named in the sentence before it («Разметка страницы задана в index.html.»). Several
files → one listing per file, each after its own sentence. Paste a fragment as it
stands in the file: the common indent is stripped by the builder.

**B7. Listing code.** Code the skill writes is English-only — identifiers, string
literals, printed text (`Сотрудник` → `Employee`) — and has no comments. The student's
existing code is reproduced as in the repo with the comments removed, so the listing
matches the screenshots.

**B8. Figure size.** 580 px by default; `{ wide: true }` — 614 px, the Word Online
ceiling — for diagrams, wireframes and anything with small text. `{ fit: "height" }`
(15 cm height, width derived) only after the user chose it (G7). The image stays on the
page of its caption.

**B9. Captions.** The caption argument is the name only — capital initial, no final
period, no number (the builder adds «Рисунок N – » / «Таблица N. »).

**B10. Escape hatch.** A `body` entry may be a ready docx-js `Paragraph` or `Table`
(`require` docx from `<assets>/node_modules`) for what the calls cannot express — with a
style id from `lib/styles.js`, never direct formatting.

**B11. Formatting** is owned by `<assets>/lib`: styles, the title page, document
properties. `build.js` never sets formatting and never adds blank spacer paragraphs.
Changing the look or adapting to another template → `docx.md`.
