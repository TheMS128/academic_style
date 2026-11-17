# Verify — an independent check of the text against the facts

An optional step between the text and the document (SKILL.md, Workflow 5a). A separate
agent that did not write the text reads the draft and checks every claim in it against
the code, the figures, the notes and the subject. It finds what the author's own check
misses: in tests on a real lab it caught a claim about where an element sits in the code
that both the author and a broader reviewer had passed.

It checks **truth only** — not style (the core's lint does that), not whether the
assignment is met, not whether the text is complete (S14 does that). A reviewer given a
table of requirements reads the text as confirmation and stops looking for errors; that
is why the task is kept this narrow.

**K1. When.** The step is offered, not imposed. Run it when the user asks, or offer it in
one line when the lab has a variant or an individual task, or more than three items in
the assignment. A lab of one short task goes without it. It costs about as much as
writing the text once more — say so when offering it.

**K2. Who.** A subagent on the strongest model the session can start — an Opus-class
model. Never a smaller one: in the tests a smaller model in this role found none of the
known errors and reported the text as clean.

**K3. What it gets.** Paths only, and only these:

- the draft `reports/<lab>/text.md`;
- the code of the work (the project directory, or the `--project` directory of D1);
- `notes.md` and `CONTEXT.MD`;
- the figures in `reports/<lab>/figures/` and what each one shows;
- the assignment text, to know which chapters are the methodichka's words.

Not the inventory, not earlier versions of the report, not `build.js` and not this skill's
rule files: a reviewer that sees how the text was meant reads it as meant.

**K4. The task**, handed over as it stands, with the paths filled in:

```
Ты проверяешь, верно ли текст студенческого отчёта описывает сделанную работу и предмет.
Ничего другого: ни выполнение задания, ни стиль, ни полнота текста тебя не касаются.

Дано: текст отчёта <text.md>; код <каталог проекта>; заметки <notes.md>, <CONTEXT.MD>;
рисунки <figures/>; текст задания <где он>. Листинги в тексте могут быть однострочными
указателями — это нормально. Другие файлы не открывай.

Порядок работы — строго по шагам.
1. Выпиши утверждения. Пройди текст от начала до конца, кроме глав «Цель работы» и
   «Задание» / «Задания» (это слова методички). Разбей каждое предложение на отдельные
   проверяемые утверждения: «экран выводит счёт и под ним список» — это три утверждения:
   выводит счёт; выводит список; счёт стоит над списком. Особенно дроби утверждения о
   расположении («над», «под», «внутри», «после»), порядке, количестве и условиях
   («только при», «если»).
2. Найди опору для каждого. Для утверждения о коде — строку кода, которая его
   подтверждает дословно, а не «по смыслу». Для утверждения о рисунке — сам рисунок,
   открой его. Для утверждения о предмете — как оно звучит в документации языка или
   библиотеки; проверь, не потеряно ли условие.
3. Отметь итог: подтверждено / опровергнуто / опоры не нашлось.

Ложная находка хуже пропущенной мелочи; но утверждение без опоры не считается
подтверждённым. Ничего не исправляй и не переписывай.

Запиши <reports/<lab>/verify.md>:
1. Опровергнутые: строка | утверждение | что на самом деле | опора.
2. Опоры не нашлось: строка | утверждение | что искал.
3. Сколько утверждений выписано и сколько подтверждено.
4. Какие файлы открыты.
Итоговое сообщение: числа и каждая находка одной строкой.
```

**K5. What is done with the result.** Nothing is changed on the reviewer's word alone.
Each finding is shown to the user with its line and its evidence, sorted into three kinds:

- **an error** — the claim contradicts the code, a figure or the subject: proposed fix in
  `text.md`;
- **a quibble** — formally true, but the wording is right for a report (in the tests: «сразу
  после проверки ответа» with two assignments in between): proposed to leave as is;
- **no support** — the sources do not settle it (often a claim about the methodichka's own
  code, which the reviewer does not have): a question to the user; the answer goes to
  `notes.md` (D4).

The user decides; agreed fixes go into `text.md` by the core's rules and are carried over
(B3). The check is not repeated after the fixes unless the user asks.

**K6. Reply.** The reply of Workflow 9 says whether the check ran, how many claims it
read, and what came of each finding.
