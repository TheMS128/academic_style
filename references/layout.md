# Layout — prose, lists, tables and listings

A generated text reaches for structure: every enumeration becomes a list, every pair of
attributes a table. It looks organised and reads as a slide. A person writing a report by
hand draws a table only when the content cannot be read without one. These rules decide
what a piece of content becomes; how a list or a table is formatted is the genre skill's
business.

**L1. Prose is the default.** What was done, in what order, why, what went wrong, what
came out — sentences in paragraphs. A list or a table is an exception that needs a ground
(L2, L4), and the ground is in the content, never in the wish to break up the page.
Relations between things — cause, contrast, sequence, condition — live in connectives; a
list drops them, so content that has such relations stays prose.

**L2. When a list.** All four hold:

- the items are discrete and parallel — the same kind of thing, none depends on another;
- there are at least four of them, or three that each need a full sentence;
- the reader will go through them one by one or come back to a single one: the tasks of
  an assignment, requirements, steps the reader has to reproduce, entries of a glossary;
- nothing is lost when the items are read in isolation.

Not a list:

- what the author did, step by step — it is a narrative: «Сначала …, затем …, после чего
  …»;
- the properties of one object — one sentence: «Кнопка имеет размер 240×90, скруглённые
  углы и бирюзовую заливку»;
- two or three short items — an enumeration inside a sentence;
- reasons, advantages, conclusions — they argue with each other and need «поэтому»,
  «однако», «при этом».

A list the source prescribes (the tasks of an assignment, questions to answer) is kept
as the source has it.

**L3. Shape of a list.**

- Each item is a complete sentence or a full clause, never a pair «Термин: пояснение» /
  «Термин — пояснение» — rework it into a sentence. A section a profile exempts (a
  glossary) is the one place for that shape. An item ending in an enumeration
  («Разработать элементы интерфейса: состояния ссылок, …») is fine.
- No bold lead-in at the start of an item, no nested list.
- Items differ in length as their content does (V4).
- A list is introduced by the paragraph before it and followed by prose: two lists never
  stand back to back, and a section never consists of lists alone.

**L4. When a table.** Only for data with **two axes** — several objects described by the
same attributes, read by lookup rather than in order:

- a comparison of alternatives against shared criteria;
- a register of five or more like entities the text refers back to (разделы, классы,
  сущности, поля, параметры);
- measured or computed numbers.

A table the source demands outright is written regardless.

**L5. Table tests** — any one sends the content back to prose or to a list:

- two to four rows that one sentence would carry;
- a column that repeats one value or stands half empty;
- rows shaped «заголовок | одно предложение» — that is a list with a frame, and usually
  prose;
- the content is already shown in a figure;
- the cells hold sentences that refer to each other — a table cannot carry an argument.

**L6. Each one accounted for.** Before the text is handed over, go through every list and
every table and name its ground in a word: «задачи», «шаги для читателя», «сравнение»,
«реестр», «числа», «требует источник». No word comes — it is rewritten as prose. The
content is given once: a paragraph does not retell the table under it, it says what to
look at there («Характеристики классов описаны в таблице N, отдельной строкой — …», V6).

> Wrong — three items, each a fragment, relations lost:
>
> 1. Навигация: реализована через Stack Navigator.
> 2. Экраны: добавлены BooksScreen и DetailsScreen.
> 3. Переход: по нажатию на карточку.
>
> Right: «Переходы между экранами построены на Stack Navigator: по нажатию на карточку в
> BooksScreen открывается DetailsScreen с данными выбранной книги.»

**L7. A listing and the text around it.** The reader sees the code; the text gives what
the code does not say about itself.

- *The idea, not a retelling.* The paragraph says what the fragment is for and how it is
  arranged — a sentence or two: «Карточка сдвигается за пальцем, а после отпускания
  сообщает направление свайпа через `onSwipe`». It does not walk through the lines («сначала
  объявляется переменная …, затем вызывается …») and does not list what the listing
  already shows — its parameters, its branches, its calls in order.
- *A non-standard solution gets its reason.* Where the code leaves the usual way —
  reflection, JNI, a suppressed warning, a manual cast, a workaround for a defect, an
  idiom the course does not teach — the text says why, in the same sentence as the
  solution or right after it: «Проверка идёт через свойство `hasDiscoverer`, после
  которого компилятор тип не сужает, поэтому значение приводится к `String` оператором
  `!!`». The reason is the one the sources give (F2); with no reason in the sources the
  place goes to the author, it is not guessed.
- *Standard code is not defended.* An ordinary loop, a data class, a call the assignment
  prescribes need no justification, and code given by the assignment is not explained
  back to the reader who wrote it — only what was changed in it, and why.
