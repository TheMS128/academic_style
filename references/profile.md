# Profile — what a genre tells the core

The core knows how a text is written; it does not know what a lab report, a practice
report or a set of guidelines consists of. A genre skill says that through a **profile**:
one JSON file, read by the model and by the lint alike.

## The contract

- A profile **scopes, switches and limits** core rules by id. It contains no rule text: a
  genre that needs a rule worded differently proposes the change here, in the core.
- The ids V, L, F and T belong to the core. A genre skill's own rules — structure,
  formatting, intake — use other letters and are never cited from the core.
- A genre built on another genre (a practice report on a lab report) names it in
  `extends` and adds its own entries; it does not copy the file.
- The lint refuses a profile with an unknown field, an unknown rule id, a `section` that
  is not a regular expression, or a switch without a `why`:
  `node <assets>/bin/lint.js --check-profile <profile.json>`.

## Fields

```json
{
  "genre": "отчёт по лабораторной работе",
  "reader": "преподаватель, который выдал задание и знает его термины",
  "sources": ["notes.md — заметки автора", "опись кода", "текст задания"],
  "verbatim": [
    { "section": "^Цель работы$", "why": "слова методички" }
  ],
  "exempt": [
    { "rule": "V2", "section": "^Теоретические сведения$", "why": "единственное место для определений" },
    { "rule": "L2", "section": "^Словарь предметной области$", "why": "словарь остаётся списком при любом числе терминов" },
    { "rule": "L3", "section": "^Словарь предметной области$", "why": "пары «Термин – значение»" }
  ],
  "off": [],
  "limits": [],
  "norms": ["штамп «В ходе выполнения лабораторной работы …» в выводе"]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `genre` | yes | the name of the genre, for messages |
| `reader` | yes | who reads the text and what they already know — the reader of V2, V9, V11 |
| `sources` | | where the facts come from (F1) |
| `verbatim` | | sections whose words are someone else's: not rewritten (V8), not checked by the lint |
| `exempt` | | one rule switched off inside one section: `rule`, `section`, `why` |
| `off` | | a rule switched off for the whole genre: `rule`, `why` |
| `limits` | | phrases of a rule that the genre permits up to a count: `rule`, `phrases`, `max`, `per`, `why` |
| `norms` | | forms that are the norm of this genre and not a tell (V8, V11 level 3) |
| `extends` | | path to the profile this one is built on, relative to the file |

`section` is a regular expression matched against the headings a paragraph sits under,
at any level.

`limits` turns a ban into a budget. Each entry lists whole words or phrases, the most
occurrences allowed (`max`) and the span they are counted in (`per`: `paragraph`,
`section` or `text`). Within the budget the phrase is not reported; over it, it is
reported under `rule`. A phrase no rule bans can be limited too — then the entry only
restricts.

With `extends` the lists of the child are appended to the parent's; `genre`, `reader`
and any other plain field of the child replace the parent's.

The example above only illustrates the format; the real profile of each genre lives in
its own skill.

## The default genre

Called with no profile, the core uses `<skill>/profiles/general.json` — a general
academic text: курсовая, ВКР, реферат, статья, пояснительная записка. It is an ordinary
profile and nothing about it is special except that it ships with the core:

- V2 is off — a term is defined once, where it comes in;
- one hedge per paragraph is within the budget (T6), a second is reported;
- «таким образом» once per section (T2), «кроме того» once per paragraph (V7);
- its `norms` keep both the impersonal passive and the authorial «мы».

Everything else a general academic text needs is in the rules themselves and holds for
every genre: a claim of someone else's carries a reference (T28), the introduction and
the conclusion follow V14.
