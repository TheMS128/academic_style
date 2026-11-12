// Обложка методички как четыре обычных абзаца — шапка вуза, блок названия,
// составитель и город с годом — со строками блока, соединёнными мягкими переносами.
// У каждого титульного стиля точная высота строки, а длинные строки переносятся здесь,
// а не средствами Word, поэтому высота каждого блока известна заранее и зазоры между
// блоками вычисляются: страница не «плывёт» между Word и Word Online и не переползает
// на вторую. Резерв в одну большую строку под городом поглощает непредвиденный перенос.
// При profile.title.verticalAlign = "both" секция ещё и выравнивается по вертикали, и
// Word прижимает строку города к нижнему полю. На обложке всё полужирное.

const { Paragraph, TextRun } = require("docx");
const { S } = require("./styles");

// приблизительные ширины литер Times New Roman, em
function widthEm(text) {
  let w = 0;
  for (const ch of text) {
    if (/[а-яё]/.test(ch)) w += 0.5;
    else if (/[a-z]/.test(ch)) w += 0.47;
    else if (/[А-ЯЁA-Z]/.test(ch)) w += 0.7;
    else if (/\d/.test(ch)) w += 0.5;
    else if (ch === " ") w += 0.25;
    else if (/[.,:;!?'’]/.test(ch)) w += 0.27;
    else if (/[()«»"\-–]/.test(ch)) w += 0.45;
    else if (ch === "—" || ch === "№") w += 1;
    else w += 0.6;
  }
  return w;
}

// жадный перенос по словам на ширину `width` twips при кегле `size` (1 em = size × 10 twips)
function wrap(text, size, width) {
  const maxEm = (width * 0.95) / (size * 10);
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && widthEm(candidate) > maxEm) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// coverPage(title, profile): title — название дисциплины; подзаголовок, составитель,
// город и год — из profile.cover. Возвращает шапку, блок названия, составителя и город.
function coverPage(title, p) {
  const c = p.cover;
  const { page, size, title: tp } = p;
  const width = page.width - page.margin.left - page.margin.right;
  const height = page.height - page.margin.top - page.margin.bottom;
  const signWidth = width - p.indent.signLeft;

  const header = c.header;
  const titleLines = [
    ...wrap(title, size.titleBig, width),
    "",
    ...c.subtitle.split("\n").flatMap((line) => wrap(line, size.titleBig, width)),
  ];
  const signLines = c.author ? ["Составитель:", ...wrap(c.author, size.body, signWidth)] : [];
  const city = `${c.city} ${c.year}`;

  const lh = tp.lineHeight;
  const headerH = header.length * lh.header;
  const titleH = titleLines.length * lh.big;
  const signH = signLines.length * lh.body;
  const titleTop = Math.max(headerH + tp.minGap, Math.round(tp.titleCenter - titleH / 2));
  const signTop = Math.max(tp.signTop, titleTop + titleH + tp.minGap);
  const cityTop = height - tp.slack - lh.body;
  const cityFloor = (signLines.length ? signTop + signH : titleTop + titleH) + tp.minGap;
  if (cityTop < cityFloor) {
    throw new Error("Обложка не помещается на страницу: сократите название или уменьшите profile.title.signTop");
  }

  const block = (style, lines, before) => new Paragraph({
    style,
    ...(before ? { spacing: { before } } : {}),
    children: lines.map((text, i) => new TextRun({ text, bold: true, ...(i ? { break: 1 } : {}) })),
  });

  const out = [
    block(S.titleHeader, header, 0),
    block(S.titleBig, titleLines, titleTop - headerH),
  ];
  if (signLines.length) out.push(block(S.titleSign, signLines, signTop - titleTop - titleH));
  const cityBefore = signLines.length ? cityTop - signTop - signH : cityTop - titleTop - titleH;
  out.push(block(S.title, [city], cityBefore));
  return out;
}

module.exports = { coverPage, wrap };
