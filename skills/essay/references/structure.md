# R — the parts of an essay

What an essay (реферат) consists of. The text is the core's (V, L, F, T). The blocks of
`build.js`, headings, lists, figures, tables, references and sources are the course
project's rules E2–E8 (`<kp>/references/document.md`) and its rules on sources K10–K12
(`<kp>/references/structure.md`): the essay is composed by the same builder, so the same
rules hold, and they are not repeated here.

**R1. The parts and their order.** Title page → `СОДЕРЖАНИЕ` → `ВВЕДЕНИЕ` → numbered
chapters → `ЗАКЛЮЧЕНИЕ` → `СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ` → appendices, when there are
any. There is no abstract. The title page and the contents are made by the builder;
`build.js` opens with `contents()`. Every other part is present exactly once.

**R2. The title page** is the lab report's (lab-report `title.js`) with «Реферат» in place
of «Лабораторная работа №N», then «по дисциплине «…»» and «Тема: «…»». The fields come
from `RULES.MD` and `CONTEXT.MD` (`Дисциплина`, `Тема`, `Принял` in `CONTEXT.MD`); the
optional `Кафедра` and `Университет` work as in lab-report. A variant number is not
printed on it.

**R3. Chapters** are written in capitals by the builder and numbered «1», «2»; sections
«1.1», points «1.1.1». A heading is passed without its number and without a full stop
(E3). Two to five chapters; a chapter with sections has at least two (K5).

**R4. Введение** says what the topic is, why it is taken and what the essay covers — the
aim in one sentence («Цель работы — …»). Half a page to a page.

**R5. Заключение** answers the introduction: what the sources show on the topic, in the
author's words. No new facts and no sources that were not used in the chapters.

**R6. The text stands on its sources.** An essay retells and compares what the sources
say; a claim taken from a source carries its reference «[{src:key}]» in the same
sentence (T28 of the core). Long quotations are rare and marked as quotations.

**R7. The file** is `<Аббревиатура дисциплины>_Реферат_<Фамилия>.docx` in the project root
(«Введение в профессию», Онисимчук → `ВвП_Реферат_Онисимчук.docx`), whatever the name of
the file the essay was imported from.
