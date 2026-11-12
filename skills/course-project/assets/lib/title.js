// Title page: the header of the university, the kind of work with the topic, the
// signatures, the city and the year. Every style has an exact line height and long lines
// are broken here, not by Word, so the height of each block is known and the gaps are
// computed: the page cannot spill onto a second one.

const { docx, wrap } = require("./deps");
const { Paragraph, TextRun } = docx;
const { S, textWidth } = require("./styles");
const { mm } = require("./profile");

function titlePage(t, p) {
  const tp = p.title;
  const width = textWidth(p);
  const height = p.page.height - mm(p.text.top) - mm(p.text.bottom);
  const fit = (text, size, w) => wrap(text, size, w * 0.82);    // the title font is wider than the estimate's Times
  const lh = tp.lineHeight;

  const header = tp.headerLines.flatMap((l) => (l ? fit(l, p.size.title, width) : [""]));
  const topic = fit(t["Тема"], p.size.title, width);
  const signWidth = width - tp.signLeft;
  const sign = [
    "Выполнил:",
    ...fit(`студент гр. ${t["Группа"]}`, p.size.title, signWidth),
    ...fit(t["Выполнил"], p.size.title, signWidth),
    "",
    "Принял:",
    ...fit(t["Должность"], p.size.title, signWidth),
    ...fit(t["Принял"], p.size.title, signWidth),
  ];
  const city = `${t["Город"]}, ${t["Год"]}`;

  const headerH = header.length * lh.body;
  const workTop = Math.max(tp.workTop, headerH + tp.minGap);
  const topicTop = workTop + lh.big + lh.body;                  // one empty line under the kind of work
  const signTop = Math.max(tp.signTop, topicTop + topic.length * lh.body + tp.minGap);
  const cityTop = height - 2 * lh.body;                         // one line of slack under the city
  if (cityTop < signTop + sign.length * lh.body + tp.minGap)
    throw new Error("Титульный лист не помещается на страницу: сократите тему в поле «Тема»");

  const block = (style, lines, before) => new Paragraph({
    style,
    ...(before ? { spacing: { before } } : {}),
    children: lines.map((text, i) => new TextRun({ text, ...(i ? { break: 1 } : {}) })),
  });
  return [
    block(S.title, header, 0),
    block(S.titleBig, [tp.work], workTop - headerH),
    block(S.title, topic, lh.body),
    block(S.titleSign, sign, signTop - topicTop - topic.length * lh.body),
    block(S.title, [city], cityTop - signTop - sign.length * lh.body),
  ];
}

module.exports = { titlePage };
