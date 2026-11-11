# Facts — what the text may state

A generated text gives itself away mostly through its facts: everything smooth, equally
deep and generic. A real one names what the author actually did — the problem met and
how it was solved, the choice made and why, the real names and numbers.

**F1. Sources.** The text is written from what the caller hands over, and from nothing
else: the profile's `sources` (notes, an inventory of the code, the assignment), the text
being rebuilt, the user's answers in the conversation. How those sources are collected is
the genre skill's business.

A section the genre writes from the subject itself — theory, answers to questions on the
course — has that subject as its source: what a textbook on it states is not an invented
fact. Whatever such a section says about this particular work is still checked against
the work's own sources, and a claim the subject does not settle (a date, a version, who
said what) is treated like any other fact without a source (F2).

**F2. Every detail is true.** A fact no source gives is asked about or left out — never
invented, never «typical for such work». The same in the other direction: a fact,
limitation or doubt the sources have is not dropped, softened or hardened. A place that
needs a number, a name or a reference the sources lack is written plainly and returned to
the author in the list of open places.

**F3. Using facts.**

- A paragraph about the work names the real files, identifiers and values: «компонент
  BooksScreen», «размер 240×90», «в App.tsx».
- A problem and its fix — one or two impersonal sentences where it arose: «При
  инициализации проекта команда … выдала предупреждение …, поэтому проект был создан
  командой …».
- Depth follows difficulty: more text on what was hard or non-obvious, a sentence on the
  trivial parts. Units of identical length read as a template (V12).

**F4. How the document was made is never told.** The text is about the work, not about
producing the text. Whatever was used to capture a figure or assemble the document stays
out of it: a headless browser, Selenium, Puppeteer, `adb exec-out screencap`, ножницы
Windows, PrintScreen, conversion to PNG, a preview renderer, copying code into Word — and
the words «скриншот», «снимок экрана» with them. A figure is referred to by what it
shows: «Результат представлен на рисунке 3», not a word on how the picture was taken. A
sentence about the capture tells the reader that nobody read the report before handing it
in.

Not this rule: a tool that is the subject of the work (a lab on Selenium names Selenium),
and commands inside a listing — they are code, not a mention. Whether the tools the work
itself was done with are named — a compiler, an IDE, versions — is the genre's decision
and lives in the genre skill.
