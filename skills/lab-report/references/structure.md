# Structure — chapters and what each holds

**S1. Chapters**, in this order, style «Глава»:

1. `Цель работы`
2. `Задание` / `Задания` (S3, S4)
3. `Теоретические сведения` (S6, S7a) — optional
4. `Словарь предметной области` (S7, S7a) — optional
5. `Выполнение работы` (S5)
6. `Вывод`
7. `Контрольные вопросы` (S13) — optional

No other chapter. The three optional ones are written only when the course asks for them
(S7a, S13); the four others are always there — with one exception: a practical work
(`Тип работы: Практическая`) has no `Вывод`, it ends with `Выполнение работы` or, when the
course asks for them, with `Контрольные вопросы`. Items 2–4 may stand in any order between
themselves — the template of some courses puts the theory before the assignment. Headings:
no final period or colon, not in capitals, a capital on the first word only.

**S2. Цель работы** — one paragraph, 1–2 sentences, opening with an infinitive; one theme
per clause, chained with commas and a final «и»: «Изучить структуру и основы …,
научиться использовать …, и применять …». Verbs: Изучить, Научиться, Освоить,
Спроектировать, Разработать, Реализовать.

**S3. Задание / Задания** — the methodichka's wording, not a paraphrase. The heading
follows the number of tasks, judged **in essence** (what is asked) and **in fact**
(whether the parts can be done and checked apart):

- `Задание` — one task in essence and in fact («добавить делегаты в приложение»): a
  paragraph of 1–3 sentences starting with an infinitive or a preposition, no list —
  «Уточнить архитектуру…», «В соответствии с предметной областью представить…».
- «разработать и протестировать» — parts that cannot be done apart are one task in fact
  even when two in essence; the heading stays `Задание`. Genuinely unclear → I9.
- `Задания` — tasks distinct both ways: a numbered `list()` directly under the heading,
  one task per item.

The chapter holds the tasks and nothing else — no lead-in such as «В ходе работы
необходимо выполнить следующее.»

**S4. Variant.** With an individual variant the heading is `Задание (Вариант N)` /
`Задания (Вариант N)`, and the variant's statement is the last paragraph: «По варианту N
предметной областью является …» or «Условие варианта N. …».

**S5. Выполнение работы** is a run of **blocks** with no headings between them, one per
step of the work, in the order of the tasks. A block: an opening paragraph that names
the step through the action or decision it records, further paragraphs, then a figure
paragraph and its figure — several figures, several such pairs. The opening does the
work of a subheading: «Для компании разработан текстовый логотип …», «Цветовая схема
сайта подбиралась под характер деятельности компании …», «Был проведён векторный анализ
для поиска объектов …».

The only subchapters («Подглава») are `Теоретические сведения` (S6) and `Словарь
предметной области` (S7), both optional, at the start of the chapter before the first
block, theory first. Any other subchapter only when the methodichka explicitly demands
numbered subsections.

**S6. Теоретические сведения** — written when `RULES.MD` says the course requires it, or
when an «Ознакомиться с …» item was answered «писать» (I6), then on that item's subject.
One paragraph of 3–6 sentences, or a short list (optionally after one lead-in
paragraph), directly under the heading; what follows starts with no bridge sentence.
That paragraph or list is the one place where a definition is allowed (V2) — the
block has no end marker, so the exemption ends with it. An «Ознакомиться» item answered «не писать» stays in the
assignment chapter word for word and is described nowhere else.

**S7. Словарь предметной области** — only when the domain needs one: a `list()` of
«Термин – значение» pairs directly under the heading, the single place where that
item shape is allowed (the profile exempts it from L3).

**S7a. Subchapter or chapter.** S6 and S7 are subchapters of `Выполнение работы` by
default. When the course template prints them as separate chapters — `RULES.MD` says so,
the theory has its own heading level in the sample report, or the teacher asks for it —
they become chapters of their own (S1) and keep everything else of S6 / S7. As a chapter
the theory may run to 10 sentences; as a subchapter it stays within 6. One form per
report, not both.

**S13. Контрольные вопросы** — a chapter after `Вывод`, only when the assignment has a
list of questions and the course asks for the answers in the report. Each question is a
paragraph of its own, numbered and copied word for word from the methodichka; its answer
is the paragraph directly under it. An answer is 1–5 sentences, in the voice of the rest
of the report (V), and gives the reasoning the question asks for — why, not only what. It
stays within the course material: no facts from outside it. Where the work has the
construct in question, the answer points at it; where it has none, the general form of the
construct is enough («value?.let { … }») and no example is made up for it. A listing or a figure only if the question asks for one.

**S14. Every requirement gets its answer.** Each thing the assignment demands — an item
of `Задания`, a condition inside an item («все поля объекта должны быть корректно
заполнены», «события должны быть реальными»), the statement of the variant — is answered
somewhere in `Выполнение работы` by a sentence a reader can find: what was done about it
and where it shows. Before the text is handed over, go through the assignment clause by
clause and point at that sentence for each; a clause with none is a hole in the report,
whatever the lint says. The answer is a fact of the work, not the requirement repeated
(S9).

**S8. Optional exercises** (I7) get no heading, subchapter or block of their own. They
continue the run of blocks after the mandatory ones, keep the methodichka's numbering,
and read like any other block.

**S9. No task labels.** A block never opens with «Задание N.» / «Упражнение N» and never
restates the assignment in the imperative — the assignment chapter already carries it.

**S10. Вывод** — not written in a practical work (S1). Elsewhere it is one paragraph built
from the Цель, in three parts:

1. The stamp «В ходе выполнения <тип> работы», `<тип>` from the `Тип работы` field in
   the genitive: Лабораторная → «лабораторной». A stage
   of a course project (`Тип работы: Курсовой проект`) takes «В ходе выполнения этапа
   курсового проекта».
2. A connective naming what the work did with the Цель: «был изучен процесс …», «были
   изучены / освоены …», «были получены практические навыки в работе с …» (coding),
   «были получены навыки в проведении …» (stats), «были составлены …», «были
   разработаны …», «был спроектирован …» (analysis, design).
3. The Цель itself, word for word — only its infinitive becomes the perfective passive
   of the connective («освоить» → «освоены»); every other word, subordinate clauses
   included, is carried over; several infinitives are all kept, in their order.

A reflexive infinitive has no passive, and one is not forced out of it («было проведено
знакомство», «было произведено научение» are wrong). It takes the connective that says the
same thing, and its object follows in the case that connective asks for: «Познакомиться
с приёмами …» / «Ознакомиться с …» → «были изучены приёмы …»; «Научиться использовать
…» → «были получены навыки использования …». Every other word of the Цель stays.

«Составить схемы страниц сайта строительной компании, определяющие взаимное расположение
элементов …» → «В ходе выполнения лабораторной работы были составлены схемы страниц сайта
строительной компании, определяющие взаимное расположение элементов …».

**S11. Вывод length.** That sentence is normally the whole Вывод. A second one only
when it carries what the Цель does not — one concrete outcome or difficulty that marks
the work. Three sentences at most. Never a retelling of the work: no steps, figures,
tables, colour codes, sizes, versions or file names, no clause per object («построены
прототипы четырёх страниц сайта», not one clause per page).

**S12. Цель that does not fit.** S10 presumes the Цель and the work match at least
nominally. When the methodichka's Цель names another technology or task than the one
done, it is not copied: the Вывод is written from what was done, in the same shape and
length, and the mismatch is not commented on.
