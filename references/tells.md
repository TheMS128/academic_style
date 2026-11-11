# Tells — signs of generated text

Read for the check of a written text (V9, V10), never while drafting.

Merged from blader/humanizer, humanizer_academic (Wikipedia, «Signs of AI writing»),
humanizer_ru, timolabs /humanize and humanizalo. A model picks the choice that fits any
reader and any subject; a person writes about one piece of work, so the choices are uneven and
concrete. Every sentence kept must add something new. Rhythm goes first (V4), then the
signs: T1–T6 are fixed on one sighting; those marked *слабый* only when other tells share
the paragraph. They check a text written by V10 and yield to V11. The fix is a rewrite
around the fact, never a synonym.

**T1. «Не X, а Y».** «не просто X, а Y», «не только …, но и …», «это не X, это Y», a
clipped tail «…, без лишних настроек». State what is. A contrast stays when the negative
half is real (what the assignment prescribed, an approach actually tried) or both halves carry
a fact: «строки различаются не только материалом, но и набором свойств».
> Навигация не просто связывает страницы, а задаёт структуру всего сайта. →
> Навигация повторяет разделы карты сайта: «Услуги», «Проекты», «Контакты».

**T2. Замыкающая фраза и пустая оценка.** The last sentence retells or grades the
paragraph: «Это позволило добиться требуемого результата.», «Всё работает корректно.»,
«Таким образом, задача выполнена.», «Подводя итог», «В заключение хочется сказать». The
same goes for a free-standing verdict anywhere in the paragraph — «Это важный
результат.», «Данный факт заслуживает внимания.» — and for the empty declarative that
sounds like a finding: «Причины носят системный характер.», «Результаты оказались
показательными.», «Это имеет большое значение.», «Разница существенна.» Cut it; the
paragraph ends on its last fact or on the reference. A verdict stays only when the same
sentence says why, with a fact: «…, поэтому таблицу пришлось денормализовать».

**T3. Глубокомысленный оборот и пересказ.** «по сути», «в своей основе», «ключевой
вопрос», «именно это и определяет …» — replace with the claim itself. «Иными словами»,
«другими словами», «проще говоря», «то есть» followed by the same claim in other words —
keep the most exact version, drop the rest. «т. е.» that turns a number into its meaning
(«код 409, т. е. запись уже изменена другим пользователем») adds a fact and stays.

**T4. Раздутая значимость.** «что стало важным шагом», «заложило основу для дальнейшей
разработки», «открывает возможности для масштабирования», «в дальнейшем позволит легко
расширять», «является неотъемлемой частью», «трудно переоценить». Keep the fact, drop its
significance; a real plan the sources name may stay.

**T5. Пустой хвост.** «…, что обеспечивает удобную навигацию», «…, тем самым повышая
читаемость», «…, позволяя пользователю …», «…, что свидетельствует о …», «…, что делает
его …». A relative clause naming a checkable effect stays — «атрибут align="Center",
который выравнивает заголовок по центру»; an evaluation in that slot is cut.
> Меню закреплено сверху, что обеспечивает удобный доступ к разделам. →
> Меню закреплено сверху (`position: sticky`) и остаётся видимым при прокрутке.

**T6. Догадка вместо факта.** «вероятно, ошибка связана с …», «по-видимому», «скорее
всего» — a cause no source gives. Ask the author or leave it out. The mirror case is the
same defect: two things that happened together written as cause and effect («благодаря
индексу запрос ускорился») when only one run was made — say what was measured.

**T7. Спор с воображаемым оппонентом.** «Можно было бы …, однако …», «Очевидным решением
было бы …», «Казалось бы, …», «На первый взгляд …». A rejected option is written only
when it was tried and the sources say so.

**T8. Разгон перед сутью и анонсы.** «Перейдём к самому интересному», «Разберём, что
нужно знать», «Теперь приступим к выполнению заданий», «В данном разделе описан ход
выполнения работы». A forward announcement of the structure goes too: «как будет
показано ниже», «подробнее об этом — далее», «в этом разделе будет рассмотрено». The
connectives of V7 are fine when the same sentence already carries content. Test for any
paragraph: if its first sentence can go and nothing is lost, it goes. Chat residue is
removed outright: «Конечно!», «Вот …», «Ниже представлен …», «Надеюсь, это поможет».

**T9. Одинаковые начала подряд.** «Был использован … Была задана … Было добавлено …».
Merge the sentences, start from the object («Ширину блока ограничивает …») or the reason.
Same for three sentences in a row from «Данный …» or from the same noun.

**T10. Рекламный язык** (texts about design above all): «стильный», «современный дизайн»,
«привлекательный», «гармоничный», «лаконичный», «яркий акцент», «инновационный»,
«мощный», «удобный», «богатый функционал», «широкие возможности». Name the colour, size,
grid, function instead.

**T11. Канцелярит.** «представляет собой», «осуществляется», «выступает в роли», «служит
для», «производится», «имеет место», «осуществление проверки»: «Осуществляется переход на
страницу» → «открывается страница». Where the whole predicate is «является / представляет
собой», the zero copula with a dash is the natural replacement — «Основное хранилище —
PostgreSQL». «Является» is tolerated. *Слабый.*

**T12. Тройки** — three items where the meaning has two or four; three parallel
sentences or paragraphs (V4). *Слабый.*

**T13. Тире-связка** — a dash instead of «, поэтому», «, потому что», a colon or
brackets, or a dash staged for a dramatic pause; at most one per paragraph. A grammatical
dash stays and does not count: between subject and predicate nouns, for an omitted verb
(«первая форма отправляет данные, вторая — только проверяет»), before a generalising
word, in ranges («с. 15–20», en dash, no spaces). *Слабый.*

**T14. Нагромождение оговорок.** «может потенциально», «в определённой степени», «как
правило, в большинстве случаев». One hedge where the data is uncertain (a measurement, a sample), none
elsewhere. *Слабый.*

**T15. Словарь модели.** «важнейший», «всесторонний», «многогранный», «бесшовный»,
«тщательно», «синергия», «раскрыть потенциал», «ландшафт» in the figurative sense,
«гибкий» and «надёжный» in the figurative sense, «ключевой» outside a term («ключевое
слово» and «первичный ключ» are terms), «в рамках данной работы», «на сегодняшний день»,
«стоит отметить» in every paragraph, «данный» more than once per paragraph (→ «этот», the
thing's own name, or a rebuilt sentence). Not model vocabulary here: the figure-paragraph
openers of V5 — they belong to the genre. *Слабый.*

**T16. Кавычки.** In prose only «ёлочки», „лапки“ inside them; straight quotes stay
inside code, attribute values and listings.

**T17. Числа.** Decimal comma in values: «0,65 с», «1,2 с», «35 %», not «0.65 с» — a
decimal point there reads as generated or translated; versions, IP addresses and code keep
their dots (`v7.2`, `RN 0.87`). Thousands with a space: «10 000».

**T18. Заголовки** with a capital only on the first word and proper names: «Анализ
предметной области», never «Анализ Предметной Области».

**T19. Цепочка родительных.** «повышение эффективности процесса обработки данных системы
учёта» — more than three genitives in a row. Break it with a verb: «чтобы система учёта
быстрее обрабатывала данные». *Слабый.*

**T20. Синонимическая карусель.** One thing is called by one name throughout the text.
«приложение / программа / решение / продукт», «пользователь / клиент / посетитель» for
the same object make the reader look for a second one. Repeating the term is correct; pick
the name the assignment or the code uses.
> Пользователь выбирает услугу, после чего решение формирует заказ, а программа
> отправляет его клиенту. → Пользователь выбирает услугу; приложение формирует заказ и
> отправляет его пользователю на почту.

**T21. Кальки и жаргон.** «адресовать проблему» → «решить», «на ежедневной основе» →
«ежедневно», «базируется на» → «основан на», «имеет смысл» (in the sense «логично») →
«оправдано», «демонстрирует производительность» → «показывает», «, где …» as a loose
connector with no place in it → «, при этом …» or a new sentence, «Более того,» opening
paragraph after paragraph. The same register slip the other way — IT slang in formal
prose: «имплементировать» → «реализовать», «кастомизировать» → «настроить», «фича» →
«функция», «юзер» → «пользователь», «кейс» → «случай» or «сценарий». Code identifiers and
product names stay. *Слабый.*

**T22. Декоративные усилители.** «крайне», «чрезвычайно», «кардинально», «безусловно»,
«несомненно», «поистине», «действительно», «значительно / существенно» with no number
behind them. Delete the adverb in your head: if no information went with it, it goes —
and the sentence is rebuilt (V4). Functional adverbs stay: «примерно», «почти», «только»,
«в среднем», «в 2 раза». *Слабый.*

**T23. Пустые ослабители.** The mirror of T22: «достаточно удобный», «довольно быстро»,
«относительно простой», «несколько сложнее», «вполне корректно». The softener carries no
measured doubt; drop it, or give the number that makes the degree real («загрузка
занимает 1,2 с»). «Достаточно указать …» (= it is enough to) and a hedge on measured
data are not this. *Слабый.*

**T24. Пустые обороты.** A long form of a short word: «для того чтобы» → «чтобы», «в
связи с тем, что» → «так как», «имеет возможность» → «может», «на данный момент» →
«сейчас», «в том случае, если» → «если», «что касается X, то …» → «X …», «с точки зрения»
where no point of view is meant → «по» or cut, «следует отметить, что» → cut and state
it. *Слабый.*

**T25. Ложный диапазон.** «от простых лендингов до сложных веб-приложений», «от
проектирования до внедрения» — a span with no scale between its ends, written for width.
Name the case the work actually covers. Real ranges stay: «от 320 до 1920 px», «с. 15–20».

**T26. Ложная субъектность.** A page, a colour or an app given will, feeling or speech:
«приложение стремится …», «страница приглашает пользователя …», «дизайн говорит о
надёжности», «цвет передаёт настроение», «интерфейс вызывает доверие», «шапка создаёт
ощущение …». Texts about design above all. Say what the element is and what it does to the
view: «синий #1E3A8A выбран под логотип компании». Technical agency is the norm and
stays: «функция возвращает», «сервер отвечает», «запрос выбирает», «результаты
показывают», «значение стремится к нулю».

**T27. Вопрос и ответ.** «Чем это обусловлено? Тем, что …», «Почему так? Потому что …»,
«Что это даёт? …» — a question staged for the next sentence to answer. State the answer.
The text asks no questions of its own reader.
