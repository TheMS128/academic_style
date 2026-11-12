# K — the parts of the explanatory note

What the note consists of and what each part holds. How the sentences are written is the
core (V, L, F, T); how the parts are typed into `build.js` is `document.md` (E).

**K1. The parts and their order.** Title page → `АННОТАЦИЯ` → `СОДЕРЖАНИЕ` → `ВВЕДЕНИЕ` →
numbered chapters → `ЗАКЛЮЧЕНИЕ` → `СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ` → appendices, when
there are any. The title page and the contents are made by the builder. Every other part
is present exactly once; the build refuses a note without one of them or with the order
broken. A course whose guidelines add a part (a list of abbreviations, a technical
assignment) names it to the user first: the builder has no block for it yet.

**K2. Аннотация.** Two or three paragraphs in Russian, then the same in English under
`ABSTRACT`. It says what was developed, with what means and what the result does, and it
closes with the size of the note: «Пояснительная записка содержит … листов, … рисунков,
… таблиц, … источников и … приложений». The numbers are never typed: they are the counts
of E9, and only the kinds that exist in the note are listed. The abstract names no
chapter and retells no section. The English text is a translation of the Russian one, not
a second abstract.

**K3. Содержание.** Built from the headings: the structural parts, the chapters and the
subchapters. Points of the third level stay out of it.

**K4. Введение.** One to one and a half pages, no subheadings, no figures. It holds, in
this order: why the task matters — through the concrete situation the system is made for,
not through the age of digital technology (T-rules of the core); the object of the work —
«Объектом работы является …»; the aim — «Целью работы является …», one sentence with one
result; the tasks, when the guidelines ask for them — the steps that lead to the aim,
each answered later by a chapter. Nothing in the introduction reports a result.

**K5. Chapters.** The outline comes from the assignment and the department's guidelines;
when they fix it, it is followed heading for heading. When they do not, the chapters
follow the work itself — analysis of the domain, design, implementation, testing — and the
outline is agreed with the user before the text is written. A chapter has either no
subchapters or at least two. A chapter opens with its first subchapter or with one or two
sentences that say what it covers; it does not open with a retelling of the previous one
and does not close with «в данной главе было рассмотрено».

**K6. What a subchapter holds.** One question of the project and its answer: a decision
and the reason for it, a model and what it shows, a module and what it does, a test and
its result. A figure, a table or a listing is introduced by the sentence that needs it
(V6 of the core) and followed by what the reader should see in it — not by a walk through
every element of the diagram. A diagram described element by element in a list is a tell
(L-rules of the core): the text names the decisions the diagram records.

**K7. Use cases, requirements, test cases.** These are structured records, and they stay
structured: a use case keeps its preconditions, main flow and alternative flows as lists
(`steps` and `list` of E4), a set of test cases is a table. The prose around them says
which ones were chosen and why — not what the fields mean.

**K8. Словарь предметной области.** A subchapter named exactly so is a list of «Термин –
значение» pairs, whatever their number; this is the one place where the profile permits
it. A definition holds what the term means in this system, in one sentence, without
«это, в принципе» and «стоит подчеркнуть».

**K9. Заключение.** Half a page to a page of text, without figures, tables and lists. It
confirms that the aim of the introduction is reached and each task is done (V14 of the
core): what was built, what it does, what was measured or tested and with what result.
It introduces nothing new, names no chapter («в первой главе …») and makes no promise of
future work the project does not need.

**K10. Список использованных источников.** Only what the text refers to; every entry is
referred to at least once, by `[N]` at the sentence that uses it. Entries go in the order
of the first reference and follow ГОСТ Р 7.0.100-2018:

- a page of a site — «Название страницы. – Текст : электронный // Название сайта :
  [сайт]. – URL: https://… (дата обращения: ДД.ММ.ГГГГ).»; the author, when the page
  names one, opens the entry («Фамилия, И. О. Название …»), the year follows the site
  when it is known («: [сайт]. – 2024. – URL: …»);
- a book — «Фамилия, И. О. Название / И. О. Фамилия. – Город : Издательство, год. – N с.
  – Текст : непосредственный.».

The site is called by its name, not by its domain («Хабр», not «habr.com»). A colon and
a semicolon that separate parts of the entry have a space on both sides; every entry ends
with a full stop. The address and the date are the author's: an entry is never completed
from memory, and a name of a site the author did not give is asked for.

**K11. Приложения.** What supports the text and would break its flow: long listings, full
scripts, generated reports, large tables. Each appendix is lettered by the builder, has a
title and is referred to in the text («приведено в приложении А»). Figures and tables in
an appendix continue the numbering of the note.
