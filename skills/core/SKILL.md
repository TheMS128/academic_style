---
name: core
description: >-
  Core writing rules for Russian academic and study texts: writes a text from a set of
  facts, or rebuilds an existing one so it stops reading as generated. Use directly when
  the user asks to write or rewrite a piece of formal Russian prose without assembling a
  document — a paragraph, a section, курсовая, ВКР, реферат, статья, пояснительная
  записка — or to remove signs of AI generation ("очеловечь текст", "убери нейросетевой
  стиль", "перепиши, чтобы не палилось", "снизь процент ИИ", "проверь текст на
  нейросетевой стиль"). Also the text engine of the genre skills (lab-report,
  practice-report, methodichka): they call it with a genre profile and format what it
  returns. Does not produce .docx, title pages or document structure — those belong to
  the genre skill.
---

# Academic style

The one place where the rules of the text live. Output is dry, formal-academic
**Russian**. Quoted Russian strings in the rule files are literal — reproduce them
verbatim.

Paths: `<skill>` = the directory holding this SKILL.md, wherever it is installed;
`<assets>` = `<skill>/assets` (plain Node, nothing to install).

## What this skill owns

Every rule has an id and its full text lives in exactly one file. A genre skill cites the
id and never restates the rule; its own rules use other letters.

| Id | File | Owns | Read when |
| --- | --- | --- | --- |
| V | `references/writing.md` | register, concreteness, rhythm, figure paragraphs, references, how a text is built | writing |
| L | `references/layout.md` | prose by default; when a list or a table is justified; what the text says about a listing | writing |
| F | `references/facts.md` | what the text may state | writing |
| T | `references/tells.md` | signs of generated text and the fix for each | checking, never while drafting |
| — | `references/rewrite.md` | rebuilding a text that already exists | rewrite mode |
| — | `references/profile.md` | the format of a genre profile | always |
| — | `profiles/general.json` | the profile used when none is given: a general academic text | no profile was passed |

## The profile

A genre skill passes a **profile** — a JSON file naming the reader, the sources, the
sections taken word for word, and the rules it switches off for a section
(`profile.md`). The profile only switches, scopes and limits rules by id; it carries no rule text
of its own. Called with no profile, the skill takes `profiles/general.json` — a general
academic text — and treats it like any other profile.

## Mode A — writing from facts

1. **Take the input**: the profile, the outline (which sections, in what order — the
   genre skill's business, not this one's) and the facts for each section. No facts for a
   section → ask for them or return the section marked empty; never fill it (F2).
2. **Inventory** each section before any prose (V10), in a file next to the draft —
   `<draft>.inventory.md`, plain bullets per section. Step 4 checks the text against it.
3. **Write** from the inventory with `writing.md`, `layout.md` and `facts.md` open.
   Prose is the default; every list and every table has to earn its place (L1, L6).
   `tells.md` stays closed: a text written against a list of banned phrases comes out as
   their synonyms.
4. **Check** — now read `tells.md` and do the pass of V9. Then run the lint on the
   draft:
   `node <assets>/bin/lint.js <draft.md> [--profile <profile.json>]`.
   Fix every «ОШИБКА». Fix a «замечание» or leave it with a reason; a phrase is rewritten
   around the concrete fact, never swapped for a synonym. «Замечаний нет» does not end
   the check: the lint sees phrases, sizes and shapes only (see below).
5. **Return** the text in the draft format below, and next to it `<draft>.open.md` with
   two lists: the places that still need a fact, a number or a source from the author,
   each quoted; and the facts of the sources that were left out on purpose, each with the
   rule that kept it out.

A genre skill that can spare a subagent runs step 4 in one that sees only the draft, the
inventory, the profile and `tells.md` — a reader who did not write the text finds more.

## What the lint checks and what it cannot

| Checked by the lint | Left to the reader of step 4 |
| --- | --- |
| V1, V2, V4 (rhythm, equal items), V5 (a figure with no paragraph), V6, V7, V12 (three paragraphs of one size) | V3, V8–V11, V13, V14, the rest of V12 |
| L1, L2, L3, L5 | L4, L6, L7 |
| F4 | F1–F3: every fact against the inventory |
| T1, T2, T5, T6, T9, T13, T15–T18, T23, T25, T27, T28 and the stock phrases of T3, T4, T7, T8, T10, T11, T14, T21, T24, T26 | T12, T19, T20, T22, and every tell in a wording the lists do not hold |

## Mode B — rebuilding an existing text

Read `rewrite.md` and follow it; it uses the same rules and the same lint.

## Draft format

The text travels between this skill and a genre skill as a plain Markdown file; the genre
skill turns it into its own document. Only these constructs:

| Construct | Written as |
| --- | --- |
| heading | `# Глава`, `## Подглава` |
| paragraph | lines up to a blank line |
| numbered list | `1. …`, one item per line |
| numbered paragraph | `1\. …` — a paragraph that carries a number but is not an item of a list: a question with its answer in the paragraph under it |
| code inside a sentence | backticks: `` `String?` ``, `` `?:` `` |
| table | a pipe table, with its caption `Таблица N. Название` on the line above |
| figure | `![Название](file.png)` on its own line |
| listing | a fenced code block |

No bold, italics, links or nested lists — apart from backticks around code, the prose
carries no markup (V1).
A text returned straight to the user in the conversation uses the same constructs.

## Hard stops

- Nothing is invented: not a fact, a number, a version, a name or a reference (F2).
- The skill's own files are edited only when the user asks in this conversation: say in
  one sentence what and why, wait for the go-ahead. A rule that got in the way is
  reported, never quietly rewritten.
- A rule that more than one genre needs is added here, not in a genre skill.
