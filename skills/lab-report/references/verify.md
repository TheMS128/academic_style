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
the assignment. A lab of one short task goes without it. On a rebuild (SKILL.md, Rebuilding) it
is offered for every report, whatever its size: an old report was written under older
rules and nobody checked it against its facts. It costs about as much as writing the text
once more — say so when offering it.

**K2. Who.** A subagent on the strongest model the session can start — an Opus-class
model. Never a smaller one: in the tests a smaller model in this role found none of the
known errors and reported the text as clean.

**K3. What it gets.** Paths only, and only these:

- the draft `reports/<lab>/text.md` — or, for a report that has none (one made before
  the draft existed), its text taken from the built document:
  `node <assets>/bin/text.js "<docx>" reports/<lab>/text.extracted.md`;
- the code of the work (the project directory, or the `--project` directory of D1);
- `notes.md` and `CONTEXT.MD`;
- the figures in `reports/<lab>/figures/` and what each one shows;
- the assignment text, to know which chapters are the methodichka's words.

Not the inventory, not earlier versions of the report (`build.old.js`, `*.old.docx`), not
`build.js` and not this skill's rule files: a reviewer that sees how the text was meant reads it as meant.

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

**K5. What is done with the result.** The findings are resolved by this agent, not handed
to the user to judge: each one carries its evidence, and checking it takes opening one line
of code or one figure, while asking the user means making them read code they have no
reason to read yet. Nothing is changed on the reviewer's word alone — every finding is
checked against its own evidence first:

- **refuted, and the evidence holds** (the line of code, the figure, the documentation
  says what the reviewer says) — the claim is fixed in `text.md` by the core's rules and
  carried over (B3); a report with no draft is fixed in its `build.js` directly, and
  rebuilt;
- **a quibble** — formally true, but the wording is right for a report (in the tests:
  «сразу после проверки ответа» with two assignments in between) — left as is;
- **the evidence does not hold** — the reviewer was wrong — dropped;
- **no support** — looked up in the code, the notes and the figures first; only what no
  source can settle and only the user knows (the methodichka's own code, why a decision
  was made) becomes a question to the user, asked with the other open places (Workflow
  5); the answer goes to `notes.md` (D4).

Two kinds always go to the user, because they are not mistakes of the text:

- a finding that contradicts the user's own `notes.md` — the notes are the user's facts;
- a finding that shows the work itself falls short of the assignment — the text must not
  be "fixed" into describing what was not done; this is reported, and the report waits
  for the user's decision.

The check is not repeated after the fixes unless the user asks.

**K6. Record and reply.** What was done with every finding is written next to it in
`reports/<lab>/verify.md`: fixed (with the new wording), left as a quibble, dropped (and
why), asked. The file stays with the report so that a run can be looked at later. The reply
of Workflow 9 gives one line — «проверка: N утверждений, исправлено X, оставлено Y,
отброшено Z» — plus the questions and the shortfalls of K5, if any.

On a rebuild the report was handed in with these errors, so the reply lists every fix
instead of a count: the chapter, the claim as it was, as it is now, and in a few words
why (the line of code or the figure). Quibbles and dropped findings stay a count.
