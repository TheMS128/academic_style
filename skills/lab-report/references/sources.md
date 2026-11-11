# Sources — where the facts of a lab come from and what the report says about them

What the text may state at all is the core's rule (F1–F4): nothing invented, nothing
lost, facts used concretely, and not a word on how a figure was captured. This file adds
what only a lab report has: where its facts are collected, deviations from the
methodichka, the tools of the work, and the notes file.

**D1. Sources**, in this order — they are the `sources` of the profile (F1):

1. `node <assets>/bin/facts.js reports/<lab> [--project <dir>]` — git history (dates and
   order of the work), dependencies, installed tools with versions, a code inventory
   (files, component / class / function names, colours, sizes, UI strings) and
   `notes.md`.
2. `CONTEXT.MD` — progress notes, errors, workarounds, deviations.
3. The code itself, for what the inventory only hints at.
4. The user's answers (I8), saved to `notes.md`.
5. The methodichka: the assignment word for word, and its example code where it gives
   one — so that the text can tell the student's code from the instructor's (L7).

Versions come from `facts.js`; a tool it does not detect is asked about (F2).
`Теоретические сведения` and the answers to `Контрольные вопросы` are written from the
subject of the course, as F1 allows; whatever they say about this work is checked against
the sources above.

**D2. Deviations from the methodichka.** A deviation is a **requirement** left unmet:
the lab's topic, the wording of the assignment, the mandatory items, a tool or
technology prescribed outright («выполнить в StarUML», «на языке C#»). **An example in
the methodichka is not a requirement** — a font, a palette, its screenshots, demo sites,
the sample report. The student's own choice is justified from the domain and the
example is not mentioned at all: not «Шрифт a_Campus из примера не использован, взят
Bahnschrift», but «Для логотипа подобран Bahnschrift Condensed — узкий гротеск …».

A deviation gets its own sentence or paragraph in the block where it arose — what was
prescribed, why it did not fit, what was used — in three cases:

1. The tool is unavailable in the student's environment: discontinued, no licence, no
   build for their OS. A licence the university supplies and an installed tool mean no
   deviation.
2. The requirement is technically impossible on the available hardware or platform.
3. The methodichka is built around an obsolete technology while the assignment is stated
   in terms of the result — swapped for a current equivalent with the same result
   (react-navigation v4 → v7 on RN 0.87).

A technology named **in the lab's topic or in the assignment itself** is never swapped —
that makes it another lab. Only what the methodichka imposes in passing is replaced: a
library version, a component style, a particular IDE. Requirement or example unclear →
I9.

**D3. Tools of the work** appear by role, never for their own sake. The tool that only
carried an observation into the document — a screenshot utility, a headless browser,
conversion to PNG — is never mentioned at all: that is F4 of the core.

A **production tool** — the graded result was obtained with it: compiler, DBMS,
emulator, `adb install`, an npm package, StarUML, Figma, IDE — is named once, where
first used, **through its consequence** and with the real version: «команда `npx
react-native init` выдала предупреждение об устаревании, поэтому проект создан через
`@react-native-community/cli`». No consequence, no sentence — there is no stock sentence
listing the IDE and versions. `npm i` counts only when a library changed or was swapped.

The same tool falls on either side by role: «приложение установлено на устройство
командой `adb install`» is written; the screenshot taken with `adb exec-out` is not.
Hardware and environment follow the same rule: the machine is irrelevant, «IDE не
запускалась, разметка писалась в текстовом редакторе» is not.

**D4. notes.md** — plain bullets in the user's words, grouped by kind. Append new facts;
never rewrite the user's own lines.

```
- Проблема: npx react-native init выдавала предупреждение об устаревшей команде; проект создан через npx @react-native-community/cli@latest init.
- Отклонение: react-navigation v4 из методички не работает на RN 0.87 — использована @react-navigation/native v7 и native-stack.
- Выбор: кастомная кнопка — скруглённый прямоугольник 240×90, бирюзовый, при нажатии оранжевый.
```
