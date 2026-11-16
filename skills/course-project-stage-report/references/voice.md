# Voice — how the text sounds

Distilled from the instructor's reports (`ОИД_4` — the reference, `CASE_2`, `МАД_4`) and
the student's accepted `CASE_3` / `CASE_4`. The instructor's phrasing is the vocabulary,
not a stencil to repeat.

**V1. Register.** Impersonal; the authorial plural is fine («рассмотрим», «перейдём
к»). No «я», «давайте», «вот ваш отчёт», filler or hedging — «В ходе работы я научился…»
is a grade-losing first person, the form is «были получены навыки…». No markdown or
emoji. No Latin c / o / e / a / p inside Russian words. Maximally concise.

**V2. No definitions.** «X — это …», «X (расшифровка) — …» are not written, and «Для
начала следует понять, что такое X» never opens a paragraph — the reader is the
instructor, who set the term. A new entity comes in through the action that brought it
and the reason it is there: «для переходов между экранами подключена
@react-navigation/native v7 — версия v4 из методички несовместима с RN 0.87». Exempt:
S6 and S7, as subchapters or chapters (S7a), and the answers in `Контрольные вопросы`
(S13), where the methodichka itself asks «что такое X».

**V3. Concrete over general.** Say what exactly happens and with what, instead of
«обеспечивает удобный доступ», «интуитивно понятно», «играет важную роль». Real details
(F3) carry the text; without them it stays generic whatever the wording.

**V4. Not templated.**

- Parallel objects are not described in parallel form: of three sites, exercises or
  screens one takes a numbered list, the next runs as prose with the criteria merged,
  the third is two sentences about what stands out.
- Paragraph length follows the content — uneven is normal. So does sentence length: a
  short sentence next to a long one reads as written, a run of equal ones as generated.
- List items of equal length read as generated. Enumerations need not come in threes.

**V5. Figure paragraph.** One paragraph directly before each figure, at least 2–3 lines:
what it shows and which elements matter — `alt` / `opt` / `loop` fragments, branch
nodes, actors, placeholder blocks — ending with or carrying the reference (V6). No
second paragraph restating the first; no heading directly above a figure. Openings vary
between figures:

- verb first, 3rd person singular, when the previous sentence names the subject:
  «Отражает…», «Демонстрирует…», «Детализирует…», «Фокусируется на…», «Описывает…»;
- subject first: «Диаграмма компонентов иллюстрирует…», «На схеме показаны…»;
- from the purpose.

**V6. References** to a figure or table stand at the end, the start or inside a working
sentence — vary the position, not only the wording. No sentence more than twice per
report.

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

**V7. Connectives** between steps: «Теперь …», «Далее …», «Стоит отметить, что…», «Как
уже было сказано выше, …», «Если обратиться к документации…», «На основании
вышеописанного, …» — each at most twice per report, and only in a sentence that already
carries content (T8).

**V8. Не трогать.** Цель and Задание are the methodichka's words and the Вывод copies the
Цель — none of them is rewritten against this file. The same for quotations, names of
pages, sections and UI elements, and a term the text discusses rather than uses. The
impersonal passive is the norm of the genre, not a tell.

**V9. Before the build.** Reread as the instructor would. Did the text gain a fact, name,
number or version no source gives, or lose one from `notes.md`? Both are errors (F2).
Then search once more for the tells that survive a rewrite: T1, T2, T5, T12, T13. A
paragraph that stays awkward is rewritten around its main fact, not patched phrase by
phrase.

## Signs of generated text

Adapted from blader/humanizer (Wikipedia, «Signs of AI writing»). A model picks the
choice that fits any reader and any subject; a student writes about one lab, so the
choices are uneven and concrete. Every sentence kept must add something new. T1–T6 are
fixed on one sighting; those marked *слабый* only when other tells share the paragraph.
The fix is a rewrite around the fact, never a synonym.

**T1. «Не X, а Y».** «не просто X, а Y», «не только …, но и …», «это не X, это Y», a
clipped tail «…, без лишних настроек». State what is. A contrast stays when the negative
half is real (the methodichka's version, an approach actually tried) or both halves carry
a fact: «строки различаются не только материалом, но и набором свойств».
> Навигация не просто связывает страницы, а задаёт структуру всего сайта. →
> Навигация повторяет разделы карты сайта: «Услуги», «Проекты», «Контакты».

**T2. Замыкающая фраза** that retells or grades the paragraph: «Это позволило добиться
требуемого результата.», «Всё работает корректно.», «Таким образом, задача выполнена.»,
«Подводя итог», «В заключение хочется сказать». Cut it; the paragraph ends on its last
fact or on the reference.

**T3. Глубокомысленный оборот.** «по сути», «в своей основе», «ключевой вопрос»,
«именно это и определяет …» — replace with the claim itself.

**T4. Раздутая значимость.** «что стало важным шагом», «заложило основу для дальнейшей
разработки», «открывает возможности для масштабирования». Keep the fact, drop its
significance; a real plan from `notes.md` may stay.

**T5. Пустой хвост.** «…, что обеспечивает удобную навигацию», «…, тем самым повышая
читаемость», «…, позволяя пользователю …». A relative clause naming a checkable effect
stays — «атрибут align="Center", который выравнивает заголовок по центру»; an
evaluation in that slot is cut.
> Меню закреплено сверху, что обеспечивает удобный доступ к разделам. →
> Меню закреплено сверху (`position: sticky`) и остаётся видимым при прокрутке.

**T6. Догадка вместо факта.** «вероятно, ошибка связана с …», «по-видимому», «скорее
всего» — a cause no source gives. Ask the student or leave it out.

**T7. Спор с воображаемым оппонентом.** «Можно было бы …, однако …», «Очевидным решением
было бы …». A rejected option is written only when it was tried and `notes.md` says so.

**T8. Разгон перед сутью.** «Перейдём к самому интересному», «Разберём, что нужно
знать», «Теперь приступим к выполнению заданий», «В данном разделе описан ход
выполнения работы».

**T9. Одинаковые начала подряд.** «Был использован … Была задана … Было добавлено …».
Merge the sentences, start from the object («Ширину блока ограничивает …») or the reason.

**T10. Рекламный язык** (design labs above all): «стильный», «современный дизайн»,
«привлекательный», «гармоничный», «лаконичный», «яркий акцент». Name the colour, size,
grid instead.

**T11. Канцелярит.** «представляет собой», «осуществляется», «выступает в роли», «служит
для», «производится»: «Осуществляется переход на страницу» → «открывается страница».
«Является» is tolerated. *Слабый.*

**T12. Тройки** — three items where the meaning has two or four; three parallel
sentences or paragraphs (V4). *Слабый.*

**T13. Тире-связка** — a dash instead of «, поэтому», «, потому что» or a colon; at most
one per paragraph. A grammatical dash (between subject and predicate, in an ellipsis)
stays and does not count. *Слабый.*

**T14. Нагромождение оговорок.** «может потенциально», «в определённой степени», «как
правило, в большинстве случаев». One hedge where the data is uncertain (stats), none
elsewhere. *Слабый.*

**T15. Словарь модели.** «ключевой», «важнейший», «бесшовный», «тщательно», «гибкий» and
«надёжный» in the figurative sense, «в рамках данной работы», «данный» in every
paragraph. *Слабый.*

**T16. Кавычки.** In prose only «ёлочки»; straight quotes stay inside code, attribute
values and listings.

**T17. Десятичная запятая** in values: «0,65 с», not «0.65 с» (code and listings excepted).
