# Blocks — from the draft to build.js

The text of the report is written by the core and arrives as a draft, `text.md`. This
file says how that draft becomes `build.js` and what the builder does with each block.
Whether a piece of content is a list, a table or prose is decided earlier and elsewhere —
by the core's L1–L7; nothing here reopens that decision.

**B1. build.js** holds content only and no path to the skill. It exports a function that
receives the block calls and returns the report:

```js
module.exports = ({ chapter, subchapter, p, list, figure, table, listing }) => ({
  description: "…",
  keywords: "…",
  body: [
    chapter("Цель работы"),
    p("Изучить …"),
    chapter("Выполнение работы"),
    p("… Результат представлен на рисунке {fig:nav}."),
    figure("nav", "fig1.png", "Постоянная навигация сайта"),
    chapter("Вывод"),
    p("В ходе выполнения лабораторной работы …"),
  ],
});
```

It is built with `node <assets>/bin/build.js reports/<lab>`. The same `build.js` works on
any machine and with any way the skill is installed. A `build.js` of the older kind — one
that `require`s the builder itself — still runs directly (`node reports/<lab>/build.js`)
and is rewritten to this form when the report is next edited.

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

**B3. Carrying the draft over.** Each construct of the draft becomes one call, and the
words are carried over as they stand — `build.js` is not the place where wording changes.
A sentence that reads badly is fixed in `text.md` and carried over again.

| In `text.md` | In `build.js` |
| --- | --- |
| `# Глава`, `## Подглава` | `chapter("…")`, `subchapter("…")` |
| a paragraph | `p("…")` |
| a numbered paragraph `1\. …` | `p("1. …")` — the number is part of the text |
| a numbered list | `list([…])`, one string per item |
| `![Название](figN.png)` | `figure(key, "figN.png", "Название")` |
| «рисунок N», «таблица N» in a sentence | `{fig:key}`, `{tab:key}` (B2) |
| a pipe table with its caption line | `table(key, "Название", { columns, rows })` |
| a fenced block — the code, or a one-line pointer `file: fragment` to it | `listing(code)` with the fragment as it stands in the file (B6) |
| backticks around code in a sentence | dropped: the code stands in the sentence as plain text |

**B4, B5** are retired: when a table is justified and the tests it must pass are the
core's L4 and L5.

**B6. Listings.** The label is «Листинг:», always and only that, so the reader learns
what the code is from the text directly before it.

- *What stands before a listing.* One sentence as a rule; a paragraph when the idea of the
  fragment is big enough to need one (L7 says what it tells). Several files → one listing
  per file, each after its own sentence or paragraph.
- *How the file is named.* By its role and where it belongs: «контроллер сервиса заказов»,
  «модель `Order`», «`OrderController` в `order-service`». A path is given only when two
  files of the report share a name.
- *The sentence carries a fact.* Best of all the file is named inside a sentence that does
  other work: «Обработчик жестов в `EventCard` перезапускается с каждой новой карточкой».
  A short one before a simple listing is fine when it says something about the code:
  «Заказ хранит идентификатор клиента и сумму».
- *When all that is left is to point at the file,* the pointer is taken from the stock
  below and never becomes a refrain: no wording twice in a row, none more than twice per
  report, no fixed order in which they come round — a cycle is seen as quickly as a
  repeat. Its place varies too: the file at the start of the sentence, at its end, inside
  it. Three listings in a row introduced by pointers alone means the text between them is
  missing (L7).

  «Разметка страницы задана в `index.html`.» · «Класс описан в файле `Order.java`.» ·
  «Реализация вынесена в `OrderService`.» · «Запрос сохранён в `report.sql`.» ·
  «Обработчик объявлен в `OrderController`.» · «Модель хранится в `Customer.kt`.» ·
  «В `styles.css` собраны правила оформления.» · «Файл `App.tsx` содержит корневой
  компонент.» · «За маршруты отвечает `routes.js`.» · «Код функции размещён в модуле
  `utils`.»
- *Files of one shape.* When several files differ only in the entity they hold (the models
  and controllers of twin services), one is shown in full and the others are described by
  their difference, with a listing of the differing part only — unless the assignment or
  `RULES.MD` asks for all the code, and then every file gets its listing and its own
  sentence.

Paste a fragment as it stands in the file: the common indent is stripped by the builder.

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
