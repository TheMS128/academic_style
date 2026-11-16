# Analysis / modelling labs — UML, ERD, BPMN, architecture

Adds to S: `Задание` is usually one infinitive sentence — «Спроектировать структуру
информационной системы … в виде диаграммы классов …».

## Выполнение работы — block sequence (`CASE_2`, `CASE_3`)

1. The system and its tasks: «Проектируется структура ИС «<Название>», которая решает
   следующие задачи.» + `list()`, each item a full clause: «Учёт учебных групп и
   студентов.»
2. «Основные пользователи системы перечислены ниже.» + `list()`, each item says what the
   user does: «Преподаватель публикует лекции и формирует тесты.»
3. Classes: from five up — «На основании вышеописанного были выделены классы,
   представленные в таблице {tab:classes}.» + `table("classes", …)`, columns `№ | Класс |
   Назначение` (B4); three or four are named in the paragraph itself.
4. Descriptive prose: which class groups model which participants; abstract classes and
   their common attributes; «<A>, <B> наследуют эти свойства через отношение
   обобщения»; «Операции … напрямую отражают функциональные требования и прецеденты
   системы.»
5. Relationships — one paragraph per kind, the term inside a full sentence, never a list
   item: «Композиция описывает жёсткую связь: …», «Агрегацией связаны … (связь 1:N).»,
   «Ассоциация между … имеет кратность 0..* к 0..*.»
6. Diagrams — one block per diagram, the kind named in its opening sentence («Диаграмма
   состояний для лекции, предмета и теста …»), no subchapters (S5): figure paragraph
   (V5), then the figure, `wide` (B8).

## Notation

Standard shapes, so the diagram reads as UML, not as free-form boxes (rendering: G5):

- **Use case** — stick-figure actors with the name below; ellipses; actor–use case links
  are plain solid lines, no arrowhead; `«include»` / `«extend»` dashed with an open
  arrowhead and the stereotype in guillemets; a system boundary with its name on top.
- **Class / ER** — rectangles with a name compartment; solid lines for associations; a
  hollow triangle for generalization, a filled diamond for composition, a hollow diamond
  for aggregation; multiplicities at the ends.
- **Activity / flow** — rounded rectangles for actions, a diamond for a branch, a solid
  bar for fork / join, a filled circle for start, a ringed circle for end.
- **Sequence** — lifelines with activation bars; `alt` / `opt` / `loop` frames labelled
  in the corner.
