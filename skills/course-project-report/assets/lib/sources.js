// The list of sources against ГОСТ Р 7.0.100-2018 (K10). One entry is checked at a time;
// every problem says what the standard asks for. The shapes the check knows:
//
//   page of a site   Название. – Текст : электронный // Сайт : [сайт]. – 2024. – URL: https://… (дата обращения: 01.02.2025).
//   site as a whole  Название : [сайт]. – Город, 2010– . – URL: https://… (дата обращения: 01.02.2025). – Текст : электронный.
//   book             Фамилия, И. О. Название / И. О. Фамилия. – Город : Издательство, 2020. – 320 с. – Текст : непосредственный.
//   article          Фамилия, И. О. Название / И. О. Фамилия. – Текст : непосредственный // Журнал. – 2020. – № 4. – С. 10–15.
//
// The check reads the form only. Whether the source exists and belongs to the topic is
// bin/sources.js and K12.

const DASH = "[–—]";
const URL_RE = /https?:\/\/[^\s)]+/;
const ACCESS = /\(дата обращения: (\d{2})\.(\d{2})\.(\d{4})\)/;
// a name that is nothing but a domain: «habr.com», «learn.microsoft.com» — not «ASP.NET» inside a title
const DOMAIN = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ru|рф|com|org|net|io|dev|tech|info|su|by|kz|ua|edu|gov|me|app|pro|site|online)$/i;

function checkEntry(entry, { today = new Date() } = {}) {
  const errors = [], warns = [];
  const e = entry.trim();
  const url = (e.match(URL_RE) || [])[0];
  // the address is taken out, so its own punctuation is not read as the entry's
  const text = url ? e.replace(url, "URL") : e;

  if (!/\.$/.test(e)) errors.push("в конце записи нет точки");
  if (/\s{2,}/.test(e)) warns.push("в записи два пробела подряд");
  if (/\. - |\s-\s/.test(text)) errors.push("области записи разделяет тире «. – », а не дефис");
  if (new RegExp(`[^.\\]] ${DASH} (?:Текст|URL|\\d{4}|[А-ЯЁA-Z])`).test(text) && !new RegExp(`\\d ${DASH} \\d`).test(text))
    warns.push("перед тире, которое разделяет области записи, ставится точка: «. – »");

  // prescribed punctuation has a space on both sides
  if (/\S:\s*\[?(?:офиц(?:иальный|\.)\s)?сайт/i.test(text)) errors.push("перед двоеточием в «Название сайта : [сайт]» нужен пробел");
  if (/\S\/\/|\/\/\S/.test(text)) errors.push("знак «//» отделяется пробелами с обеих сторон");
  if (/Текст:|Текст :(?! (?:электронный|непосредственный))/.test(text)) errors.push("вид содержания пишется как «Текст : электронный» или «Текст : непосредственный»");

  if (url) {
    const container = / \/\/ /.test(text);
    if (!/Текст : электронный/.test(text)) errors.push("у электронного ресурса нет сведений «Текст : электронный»");
    else if (container && !new RegExp(`\\. ${DASH} Текст : электронный \\/\\/ `).test(text))
      errors.push("у страницы сайта «. – Текст : электронный» стоит после названия, перед «//»");
    else if (!container && !new RegExp(`\\. ${DASH} Текст : электронный\\.$`).test(text))
      errors.push("у сайта в целом «. – Текст : электронный.» замыкает запись; у страницы сайта после названия идёт «. – Текст : электронный // Название сайта»");
    if (!new RegExp(`\\. ${DASH} URL: URL`).test(text)) errors.push("адрес пишется как «. – URL: https://…»");
    if (/[.,;]$/.test(url)) errors.push("адрес кончается знаком препинания — он не часть адреса");
    const m = e.match(ACCESS);
    if (!m) errors.push("нет «(дата обращения: ДД.ММ.ГГГГ)» сразу после адреса");
    else {
      const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
      if (d.getUTCDate() !== +m[1] || d.getUTCMonth() !== +m[2] - 1) errors.push(`дата обращения ${m[1]}.${m[2]}.${m[3]} не существует`);
      else if (d > today) errors.push(`дата обращения ${m[1]}.${m[2]}.${m[3]} ещё не наступила`);
      if (!/URL \(дата обращения/.test(text)) errors.push("«(дата обращения: …)» стоит сразу после адреса, через пробел");
    }
    if (container) {
      const site = (text.split(" // ")[1] || "").split(new RegExp(`\\. ${DASH} `))[0];
      const name = site.replace(/\s*:.*$/, "").trim();
      if (DOMAIN.test(name)) errors.push(`сайт назван доменом («${name}») — нужно его название`);
      if (/ : сайт\b/.test(site)) warns.push("слово «сайт», добавленное от себя, берётся в квадратные скобки: «: [сайт]»");
      if (!/ : /.test(site) && !/журнал|газета|вестник|известия/i.test(site)) warns.push("после названия сайта нет сведений о нём: «Название : [сайт]»");
      const title = text.split(new RegExp(`\\. ${DASH} Текст`))[0];
      if (DOMAIN.test(title.trim())) warns.push("в названии страницы стоит домен — нужен её заголовок");
    }
    return { kind: container ? "страница сайта" : "сайт", url, errors, warns };
  }

  // printed sources
  if (!/Текст : непосредственный/.test(text)) errors.push("у печатного источника нет сведений «Текст : непосредственный»; у электронного нет адреса «– URL: …»");
  const article = / \/\/ /.test(text);
  if (!article) {
    if (!new RegExp(`\\. ${DASH} [А-ЯЁA-Z][^:]+ : [^,]+, \\d{4}`).test(text)) errors.push("выходные данные книги пишутся как «. – Город : Издательство, год»");
    if (!new RegExp(`\\. ${DASH} \\d+(?:, \\[\\d+\\])? с\\.`).test(text)) errors.push("нет объёма книги: «. – 320 с.»");
  } else {
    if (!new RegExp(`\\. ${DASH} \\d{4}\\.`).test(text)) errors.push("у статьи нет года издания журнала: «. – 2020.»");
    if (!new RegExp(`\\. ${DASH} С\\. \\d+(?:[–—-]\\d+)?\\.`).test(text)) errors.push("у статьи нет страниц: «. – С. 10–15.»");
  }
  if (/^[А-ЯЁA-Z][а-яёa-z-]+ [А-ЯЁA-Z]\./.test(text)) errors.push("в заголовке записи после фамилии ставится запятая: «Иванов, И. И.»");
  if (/[А-ЯЁ]\.[А-ЯЁ]\./.test(text)) warns.push("инициалы пишутся через пробел: «И. И.»");
  return { kind: article ? "статья" : "книга", url: null, errors, warns };
}

// the title of an entry: what stands before the statement of responsibility or the kind of content
function entryTitle(entry) {
  const head = entry.split(/ \/\/ | \/ |\. [–—] /)[0].replace(/ : \[?(?:сайт|официальный сайт|офиц\. сайт)\]?$/, "");
  return head.replace(/^[А-ЯЁA-Z][а-яёa-z-]+, (?:[А-ЯЁA-Z]\. ?){1,2}/, "").trim();
}

module.exports = { checkEntry, entryTitle, URL_RE };
