# M — what goes on a diagram

A diagram is an answer to one question, and everything on it is part of that answer.
These rules decide the content; how it is drawn is `drawing.md` (C).

**M1. One question.** Before anything is drawn, the question the picture answers is
written as the first line of the scope file: `Вопрос: …?`. One question, one picture:
«Из каких сущностей состоит основная структура данных системы?», «В каком порядке идут
фазы итерации?», «Кто и что делает в системе?». «Как устроена система» is not a
question — it has no answer one picture can give. A question with «и как», «и какие» in
the middle is two questions and two pictures. The caption of the figure is this question
turned into a name.

**M2. The test of an element.** An element is on the picture only if, without it, the
answer to the question becomes wrong or incomplete. The test is applied to every
candidate and the result is written down:

```
Вопрос: Из каких сущностей состоит основная структура данных системы?

| Элемент | На схеме | Почему |
| --- | --- | --- |
| Subject | да | центральная сущность, владеет лекциями и тестами |
| DbSetMock | нет | вспомогательный класс тестов, в структуру данных не входит |
```

«Почему» names the role of the element in the answer — or what it belongs to instead.
«Важный класс», «для полноты», «есть в коде» are not reasons: being in the code is the
condition for being a candidate, not for being on the picture. The check compares the
table with the picture: every labelled element of the picture has a «да» row, every
«да» row is on the picture, no «нет» row is.

**M3. Candidates that stay out.** The table lists what was considered and left out, not
only what went in: the decision is visible only against the alternatives. Typical «нет»:

| The question is about | Stays out |
| --- | --- |
| the main data structure | utility and helper classes, nested classes that serve one method, test doubles, mappers and DTOs, the data-access context, base classes of the framework |
| the architecture of the application | individual entities and their fields, private methods, configuration classes |
| the classes of one subsystem | classes of the other subsystems, except the one or two it touches — shown without their members |
| a process or a life cycle | who performs the steps, the artefacts of each step, the tools — unless the question is about them |
| the roles of the users | the screens, the internal steps of the system |
| the flow of one use case | error handling of every call, logging, other use cases |

The same goes for members: a class on a structure diagram shows the fields that carry
the structure — not identifiers, timestamps, getters and setters. A table with no «нет»
row needs the line `Кандидатов вне схемы нет: <почему>`, and that is rare: a system
with seven classes has seven on the picture only when it has nothing else.

**M4. Relations pass the same test.** A line is on the picture when the answer needs it.
An arrow that follows from two others (A → B, B → C, and A → C drawn «for clarity») goes.
Every line has one meaning, shown by its kind (C10, C12) or by a short label; two lines between
the same pair mean two different things or one of them goes. Lines go in the direction
of the thing the question is about: control in a flowchart, time in a process, ownership
in a structure.

**M5. One level, one sheet.** Everything on the picture stands at one level of detail: a
subsystem next to one of its own methods is two pictures. More than about fifteen
elements do not read on a page — the question is too wide: split it («структура данных
учебного процесса» and «структура данных тестирования») and draw two. Shrinking the font
to fit is not a way out (C8).

**M6. What the picture is true to.** Every element exists in the thing described: a class
in the code, a step in the process the text sets out, a state the object really takes.
Names on the picture are the names in the code and in the text, letter for letter. A
well-known model is drawn as the text of the work describes it; when the text and the
textbook differ, the text is corrected first. Nothing is added to make the picture look
complete, and a part of the answer the author is not sure of is asked about, not drawn.

**M7. The picture and its text.** The text refers to the picture before it appears and
then says what the reader should see in it — the decision the picture records, not a walk
through its boxes. Whatever the text names as being on the picture is on it; whatever is
on the picture and never matters to the text is a candidate for «нет».
