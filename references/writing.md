# Writing — how the text sounds and how it is built

Distilled from reports written by an instructor and from student reports that were
accepted. Their phrasing is the vocabulary, not a stencil to repeat. «The reader» below
is whoever the profile names; «the sources» are whatever the profile lists (F1).

**V1. Register.** Impersonal; the authorial plural is fine («рассмотрим», «перейдём
к»). No «я», «давайте», «вот ваш отчёт», filler or hedging — «В ходе работы я научился…»
is a grade-losing first person, the form is «были получены навыки…». No markdown inside a
sentence, no emoji; the one exception is backticks around code — an identifier, an
operator, a literal (`String?`, `?:`, `"неизвестен"`) — so that its characters do not
merge with the punctuation of the sentence. No Latin c / o / e / a / p inside Russian words. Maximally concise.
Where the profile's `norms` admit the authorial «мы» next to the impersonal passive, a
text keeps the one it already uses and does not switch between them.

**V2. No definitions.** «X — это …», «X (расшифровка) — …» are not written, and «Для
начала следует понять, что такое X» never opens a paragraph — the reader set the term
and knows it. A new entity comes in through the action that brought it and the reason it
is there: «для переходов между экранами подключена библиотека
@react-navigation/native, её навигатор native-stack держит открытые экраны стопкой».
Exempt: the sections a profile exempts; a profile may switch the rule off for a genre
where definitions are the norm.

**V3. Concrete over general.** Say what exactly happens and with what, instead of
«обеспечивает удобный доступ», «интуитивно понятно», «играет важную роль». Real details
(F3) carry the text; without them it stays generic whatever the wording.

**V4. Not templated.**

- Parallel objects are not described in parallel form: of three sites, exercises or
  screens one is taken in detail, the next runs as prose with the criteria merged, the
  third is two sentences about what stands out.
- Paragraph length follows the content — uneven is normal. So does sentence length: a
  short sentence next to a long one reads as written, a run of equal ones as generated.
- List items of equal length read as generated. Enumerations need not come in threes.
- *Ритм — первым делом*, before any wording is touched. Generated prose keeps its
  sentences in a narrow band (about 12–20 words); a person's are uneven. In a paragraph
  of three or more sentences at least one is clearly shorter and one clearly longer than
  the rest: split a long sentence, merge two short ones through a conjunction, a
  participle clause or a semicolon, move the circumstance to the front («При ширине окна
  меньше 768 px меню сворачивается»). Never three short sentences in a row for effect.
  Cutting a word (T5, T22) shortens its sentence and evens the rhythm — rebuild the
  sentence instead of just deleting.
  > Был создан файл index.html. Была подключена таблица стилей. Был добавлен блок
  > навигации. Была задана ширина контейнера. → В index.html подключена таблица стилей и
  > добавлен блок навигации; ширину контейнера ограничивает `max-width: 960px`, поэтому
  > на широком экране по краям остаются поля.

**V5. Figure paragraph.** One paragraph directly before each figure, as a rule two or
three sentences: what it shows and which elements matter — `alt` / `opt` / `loop` fragments, branch
nodes, actors, placeholder blocks — ending with or carrying the reference (V6). No
second paragraph restating the first; no heading directly above a figure. A figure that
gives content for one sentence gets one sentence — the paragraph is not padded to a size
(V12). Openings vary
between figures:

- verb first, 3rd person singular, when the previous sentence names the subject:
  «Отражает…», «Демонстрирует…», «Детализирует…», «Фокусируется на…», «Описывает…»;
- subject first: «Диаграмма компонентов иллюстрирует…», «На схеме показаны…»;
- from the purpose.

**V6. References** to a figure or table stand at the end, the start or inside a working
sentence — vary the position, not only the wording. No sentence more than twice per
text.

- End: «Результат представлен / показан на рисунке N.», «Полученные данные
  проиллюстрированы на графике (рис. N).», «Графическое отображение результатов
  приведено на рисунке N.», «Внешний вид \<чего\> после \<действия\> показан на рисунке
  N.», «Работа \<компонента\> продемонстрирована на рисунке N.», «Прототип представлен на
  рисунке N.» (prototypes only).
- Start: «Рисунок N отражает …», «На рисунке N приведена \<схема / разметка / форма\>».
- Inside, carrying an observation: «На рисунке N видно, что \<что получилось\>»,
  «Итоговая разметка приведена на рисунке N, где \<деталь\>».
- Tables: «Перечень сущностей приведён в таблице N.», «Результаты сведены в таблицу N.»,
  «Сравнение представлено в таблице N.»; «Таблица N содержит …», «В таблице N
  перечислены …»; «Характеристики классов описаны в таблице N, отдельной строкой —
  \<исключение\>».

**V7. Connectives** between steps: «Теперь …», «Далее …», «Как
уже было сказано выше, …», «Если обратиться к документации…», «На основании
вышеописанного, …» — each at most twice per text, and only in a sentence that already
carries content (T8).

**V8. Не трогать.** The sections a profile marks `verbatim` are someone else's words and
are not rewritten against this file. The same for quotations, names of pages, sections
and UI elements, code, and a term the text discusses rather than uses. What the profile
lists under `norms` is the norm of the genre, not a tell; so are the impersonal passive,
the authorial plural, a moderate «является», a grammatical dash and the stock references
of V6.

**V9. Before the text is handed over.** In this order.

1. *Факты.* Reread as the reader would. Did the text gain a fact, name, number or
   version no source gives, or lose one the sources have? Both are errors (F2).
2. *Что ещё выдаёт генерацию?* List the survivors in a line to yourself and fix each.
   Usually: an even rhythm (V4), the same opening three times (T9), T1, T2, T5, T12, T13,
   words from T4, T15, T22–T24, a link broken by an edit (V13).
3. *Абзацы и блоки.* Remove each first sentence in your head — if nothing is lost, it
   goes (T8). Name each paragraph's job in two words and its concrete detail; a paragraph
   with no job or no detail is cut or merged. Compare the blocks: the same movement in
   every one, or three paragraphs of one size in a row, is rebuilt (V12).
4. *Списки, таблицы, листинги.* Name the ground of each list and table in a word (L6);
   one without a ground goes back to prose. A paragraph that retells its listing line by
   line is cut down to the idea (L7).
5. *Финально:* every «—» is grammatical or replaced (T13); quotes, numbers and headings
   follow T16–T18; one name per thing (T20).

A paragraph that stays awkward is rewritten around its main fact, not patched phrase by
phrase.

## How the text is built

**V10. Из описи, а не из черновика.** Patching a draft sentence by sentence keeps its
shape: the same «подводка → действие → вывод» in every block, paragraphs of one size,
smooth links that carry nothing. Swapping the words then changes nothing the reader
feels. So a unit of the text — a step of a report, a section of a paper — is not written
and then cleaned; it is built from an inventory:

1. **Опись** — from the sources, before any prose: what the unit is about; what exactly
   was done (files, elements, properties, values); what went wrong and how it was solved;
   where the result departs from what was prescribed; what each figure shows. Also what
   must stay word for word — names, numbers, code, UI labels.
2. **Абзацы из описи.** Each paragraph is written fresh around one item of the inventory,
   in the order the logic of this unit asks for, not the order of the previous one. An
   item the inventory lacks is not filled with wording: the paragraph gets shorter or
   merges with its neighbour (V12).
3. **Потом признаки** (T1–T28) — as a check of the written text, not as the way to write
   it.

The same holds for a text that already exists (`rewrite.md`): the draft is evidence of
what the author meant, not a template.

**V11. Приоритет правил.** When two rules pull apart, the higher one wins:

1. **Факты** — the text means exactly what the sources say: nothing added, dropped,
   softened or hardened, the uncertainty included (F2).
2. **Неприкосновенное** — code, names, numbers, versions, UI labels, quotations, and the
   profile's `verbatim` sections (V8).
3. **Жанр** — the form the reader expects: the profile's `norms`, the structure the genre
   skill sets, the stock references (V6), the impersonal passive, the authorial plural.
4. **Понятность** — the reader gets the point on the first read.
5. **Признаки генерации** — T1–T28.

A sign that would distort a fact, break the genre or make a sentence harder to read
yields. «Результат представлен на рисунке 3» stays, however stock it sounds.

**V12. Абзац и блок.**

- *Одна задача на абзац.* Every paragraph of the author's own text does one job: an
  action, a decision and its reason, a problem and its fix, a result, the description of
  a figure. A paragraph that only frames, links or sums up the neighbours goes; its one
  working sentence, if any, joins the paragraph it belongs to.
- *Хотя бы одна конкретика.* Each such paragraph holds at least one detail a reader could
  check: a file, an element, a property with its value, an error text, a number, a named
  decision, a source. When the inventory has none for it, the paragraph is not padded
  with adjectives — it is cut or merged. Never invent the detail to satisfy this rule
  (V11, 1).
- *Разные блоки — разное строение.* Units of one text do not repeat one movement
  («сделано X → это позволило Y → результат на рисунке N») and paragraphs do not come in
  one size: three paragraphs in a row within about 20 % of each other in length read as
  generated (lint). Start one unit from the problem, another from the decision, a third
  from the result; one takes three paragraphs, the next one.

**V13. Правка без дыр.** Removing a tell must not leave a gap. When an opener («Кроме
того,» over the limit), a tail (T5) or a closing sentence (T2) goes, the link it carried
between sentences is still there — restore it: a connective from V7 or «также», «при
этом», «однако», «поэтому»; the key word of the previous sentence repeated at the start
of the next («… подключён Router. Router хранит …»); or two sentences merged into one.
Choppy, connective-stripped prose is itself a sign of machine clean-up.
> Кроме того, добавлена авторизация, что обеспечивает безопасность. Кроме того,
> реализован журнал действий. → wrong: «Добавлена авторизация. Реализован журнал
> действий.» → right: «Помимо авторизации через OAuth реализован журнал действий: каждое
> изменение записи сохраняется с логином и временем.»

After editing, reread each paragraph: the first sentence says what the paragraph is
about; every next sentence is tied to the previous one by a connective or a repeated key
word. A connective is chosen by the relation it marks — consequence, addition, contrast,
reason, sequence — never to sound varied; bookish ones («вследствие чего», «ввиду
вышеизложенного») are not added for colour.

**V14. Введение и заключение.** The two places where a generated text is most general.

- *Введение, актуальность.* One concrete problem of one object: who runs into it, where,
  what it costs. «Актуальность темы обусловлена стремительным развитием информационных
  технологий» fits any topic and says nothing about this one. When the sources name no
  such problem, the paragraph is cut to a sentence and the place goes to the author (F2).
- *Заключение, вывод.* The conclusion confirms that every task set in the introduction
  is solved and the aim is reached by the chosen methods. It answers the introduction and
  nothing else: no task appears that was not set, none that was set is left unanswered.
  How it is written — its length, its stock opening, what it may and may not name — is
  defined by the genre skill, not here.
