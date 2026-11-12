// Title page: the header of the university, the kind of work with the topic, the
// signatures in two columns, the city and the year. Every style has an exact line height
// and long lines are broken here, not by Word, so the height of each block is known and
// the gaps are computed: the page cannot spill onto a second one.

const { docx, wrap } = require("./deps");
const { Paragraph, TextRun, Tab } = docx;
const { S, titleWidth } = require("./styles");
const { mm } = require("./profile");

function titlePage(t, p) {
  const tp = p.title;
  const width = titleWidth(p);
  const height = p.page.height - mm(p.text.top) - mm(p.frame.bottom + tp.below);
  // the estimate is made for Times; the title font runs about 6 % wider
  const fit = (text, w) => wrap(text, p.size.title, w * 0.93);
  const lh = tp.lineHeight;

  const header = tp.headerLines.flatMap((l) => (l ? fit(l, width) : [""]));
  // a topic that takes more than one line breaks before the quoted name, when both halves fit
  let topic = fit(t["Тема"], width);
  const quote = t["Тема"].indexOf(" «");
  if (topic.length > 1 && quote > 0) {
    const halves = [t["Тема"].slice(0, quote), t["Тема"].slice(quote + 1)];
    if (halves.every((h) => fit(h, width).length === 1)) topic = halves;
  }

  // «Выполнил:» and «Принял:» stand in the first column, the rest against them in the second
  const valueWidth = width - tp.signValue;
  const post = tp.posts[t["Должность"]] || t["Должность"];
  const teacher = fit(`${post} ${t["Принял"]}`, valueWidth).length === 1
    ? [`${post} ${t["Принял"]}`]
    : [...fit(post, valueWidth), ...fit(t["Принял"], valueWidth)];
  const column = (label, values) => values.map((v, i) => [i ? "" : label, v]);
  const sign = [
    ...column("Выполнил:", [...fit(`студент гр. ${t["Группа"]}`, valueWidth), ...fit(t["Выполнил"], valueWidth)]),
    ["", ""],
    ...column("Принял:", teacher),
  ];
  const city = `${t["Город"]}, ${t["Год"]}`;

  const headerH = header.length * lh.body;
  const workTop = Math.max(tp.workTop, headerH + tp.minGap);
  const topicTop = workTop + lh.big + lh.body;                  // one empty line under the kind of work
  const signTop = Math.max(tp.signTop, topicTop + topic.length * lh.body + tp.minGap);
  const cityTop = height - lh.body - 120;                       // a little slack under the city
  if (cityTop < signTop + sign.length * lh.body + tp.minGap)
    throw new Error("Титульный лист не помещается на страницу: сократите тему в поле «Тема»");

  const block = (style, lines, before) => new Paragraph({
    style,
    ...(before ? { spacing: { before } } : {}),
    children: lines.map((text, i) => new TextRun({ text, ...(i ? { break: 1 } : {}) })),
  });
  const signBlock = new Paragraph({
    style: S.titleSign,
    spacing: { before: signTop - topicTop - topic.length * lh.body },
    children: sign.map(([label, value], i) => new TextRun({
      ...(i ? { break: 1 } : {}),
      children: value ? [label, new Tab(), value] : [label],
    })),
  });
  return [
    block(S.title, header, 0),
    block(S.titleBig, [tp.work], workTop - headerH),
    block(S.title, topic, lh.body),
    signBlock,
    block(S.title, [city], cityTop - signTop - sign.length * lh.body),
  ];
}

module.exports = { titlePage };
