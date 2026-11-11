# Rewrite — rebuilding a text that already exists

The mode for a text that is already written and reads as generated: «очеловечь», «убери
нейросетевой стиль», «перепиши, чтобы не палилось», «снизь процент ИИ». The rules are
the ones of `writing.md`, `layout.md` and `tells.md`; this file says in what order they
are applied to a finished text.

## What is being edited

- **A document a genre skill built** — the genre skill says where its text lives and how
  the document is rebuilt; the text is edited there, never in the output file. The
  genre's profile stays in force: its `verbatim` sections are not touched.
- **Any other text** — a `.docx`, a file or pasted prose: курсовая, ВКР, реферат, эссе,
  статья, пояснительная записка, a report made elsewhere. The general profile applies
  (`profiles/general.json`) unless the user names another genre.

A file is edited in place only when the user asks for that; otherwise the text comes back
in the reply.

## Order

The text is rebuilt, not patched (V10). Editing it sentence by sentence keeps the
generated shape — the same movement in every section, paragraphs of one size — and the
reader still feels it.

1. Read the whole text; mark what is not touched (V8, V11 level 2: the profile's
   `verbatim` sections, quotations, definitions taken from a source, normative wording,
   code).
2. **Опись** of each section: its main point, every fact, name, number, version, source
   reference and commitment, the author's real uncertainty, and the claims that have no
   support in the text. Nothing outside the inventory enters the rewrite.
3. **Пересборка.** Write each section anew from its inventory, in the order its logic
   asks for; the draft's sentence order, openings, links and endings are kept only where
   they already work. Rhythm (V4) and V12 shape it from the start. Every list and table
   of the draft is put to L2–L5: generated texts carry far more of them than the content
   needs, and most go back to prose.
4. **Проверка** of the new text against T1–T28, V13 and V9, then the lint
   (`node <assets>/bin/lint.js <file> [--profile <profile.json>]`). Then compare with the
   inventory: every item is there and means the same — a softened «может» turned into
   «делает», or a dropped limitation, is an error.
5. Nothing is invented. A good fix often needs a number, a name or a source (a figure
   instead of «значительно», a concrete problem instead of empty актуальность). If the
   text and the sources do not have it, do not make it up: leave the sentence plain and
   list the place for the author.

A text whose structure the user wants kept as is (the same paragraphs, the same order)
is edited within that structure — say so in the reply, since the effect is weaker.

## Reply

1. The rewritten text (or, for a document of a genre skill, the rebuilt file and the lint
   result).
2. A short list of what was changed — which sections were rebuilt, which patterns were
   most frequent, which lists and tables became prose, and any claim kept without support
   (quoted, for the author to check).
3. The places that need a fact, number or source from the author, each quoted.
