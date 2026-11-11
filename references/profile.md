# Profile — what a genre tells the core

The core knows how a text is written; it does not know what a lab report, a practice
report or a set of guidelines consists of. A genre skill says that through a **profile**:
one JSON file in the genre skill, read by the model and by the lint alike.

## The contract

- A profile **scopes and switches** core rules by id. It contains no rule text: a genre
  that needs a rule worded differently proposes the change here, in the core.
- The ids V, L, F and T belong to the core. A genre skill's own rules — structure,
  formatting, intake — use other letters and are never cited from the core.
- A genre built on another genre (a practice report on a lab report) takes that genre's
  profile and changes fields in it; it does not copy the file.

## Fields

```json
{
  "genre": "отчёт по лабораторной работе",
  "reader": "преподаватель, который выдал задание и знает его термины",
  "sources": ["notes.md — заметки автора", "опись кода", "текст задания"],
  "verbatim": [
    { "section": "^Цель работы$", "why": "слова методички" },
    { "section": "^Задани", "why": "слова методички" }
  ],
  "exempt": [
    { "rule": "V2", "section": "^Теоретические сведения$", "why": "единственное место для определений" },
    { "rule": "L2", "section": "^Словарь предметной области$", "why": "словарь остаётся списком при любом числе терминов" },
    { "rule": "L3", "section": "^Словарь предметной области$", "why": "пары «Термин – значение»" }
  ],
  "off": [],
  "norms": ["штамп «В ходе выполнения лабораторной работы …» в выводе"]
}
```

| Field | Meaning |
| --- | --- |
| `genre` | the name of the genre, for messages |
| `reader` | who reads the text and what they already know — the reader of V2, V9, V11 |
| `sources` | where the facts come from (F1) |
| `verbatim` | sections whose words are someone else's: not rewritten (V8), not checked by the lint |
| `exempt` | one rule switched off inside one section |
| `off` | a rule switched off for the whole genre: `{ "rule": "T27", "why": "…" }` |
| `norms` | forms that are the norm of this genre and not a tell (V8, V11 level 3) |

`section` is a regular expression matched against the headings a paragraph sits under,
at any level. Every `exempt` and `off` entry carries a `why` — a switch without a reason
is how rules drift apart.

The example above only illustrates the format; the real profile of each genre lives in
its own skill.

## The default genre

With no profile the text is treated as a general academic text — курсовая, ВКР, реферат,
статья, пояснительная записка. The rules hold with these differences:

- **Definitions** (V2 is off). A term is defined once, where it comes in, and a
  definition taken from a source carries its reference. «X — это …» as the opening of
  every section is still a tell.
- **Sources.** A claim that is not the author's own carries a reference: «[3]», «(Иванов,
  2019)». «Многие исследователи считают …», «как показывают исследования» without one is
  a vague attribution — attach the author's source or rephrase as the author's own claim;
  never invent a reference (F2).
- **Hedging.** One hedge per uncertain claim is correct here («по-видимому», «можно
  предположить») — T6 then targets only a cause stated with no ground, and T14 only
  stacked hedges. A measured result is stated without one.
- **Введение / актуальность.** «Актуальность темы обусловлена стремительным развитием …»
  fits any topic. Актуальность is one concrete problem of one object; without it the
  paragraph is cut to a sentence and the place is listed for the author.
- **Выводы / заключение.** What was done, the main measured result, an honest
  limitation. «Таким образом, можно с уверенностью утверждать …», «открывает широкие
  перспективы», «работа вносит значительный вклад» are T2 / T4.
- **Connectives.** «Таким образом» once per section, with a real conclusion after it, is
  fine; «Кроме того» once per paragraph.
- **Voice.** The impersonal passive and the authorial «мы» both belong to the genre; keep
  whichever the text uses and do not switch.
