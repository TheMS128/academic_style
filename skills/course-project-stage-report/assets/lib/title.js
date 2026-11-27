// Title page as four ordinary paragraphs — header, title block, signatures, city and
// year — with the lines of a block joined by soft line breaks. Every title style has
// an exact line height and long lines are broken here rather than by Word, so each
// block's height is known in advance and the gaps between blocks are computed: the
// page cannot drift between Word and Word Online or spill onto page 2. A slack of one
// big line under the city absorbs a wrap the estimate did not foresee. With
// profile.title.verticalAlign = "both" the section is also justified vertically, and
// Word pins the city line to the bottom margin.

const { Paragraph, TextRun } = require("docx");
const { S } = require("./styles");
const { initialsFirst, workHeading, titleHeader } = require("./meta");

// approximate Times New Roman advance widths, em
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

// greedy word wrap for `width` twips at `size` half-points (1 em = size * 10 twips)
function wrap(text, size, width) {
  const maxEm = (width * 0.95) / (size * 10);
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
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

// The signature block: every line starts at one left edge, profile.indent.signLeft. A line
// that does not fit moves the whole block left in steps of 0.5 cm until the longest line
// fits; at the left margin what is still too long is wrapped. Measured as wrap() does.
const SHIFT_STEP = 284; // 0.5 cm, twips
function signIndent(lines, size, width, start) {
  const need = (l) => (widthEm(l) * size * 10) / 0.95;
  const longest = lines.filter(Boolean).reduce((a, b) => (need(b) > need(a) ? b : a), "");
  let left = start;
  while (left > 0 && need(longest) > width - left) left = Math.max(0, left - SHIFT_STEP);
  return { left, longest };
}

function titlePage(t, p) {
  const { page, size, title: tp } = p;
  const width = page.width - page.margin.left - page.margin.right;
  const height = page.height - page.margin.top - page.margin.bottom;

  const header = titleHeader(t, tp.headerLines, (l) => wrap(l, size.titleHeader, width));
  const titleLines = [
    workHeading(t),
    ...wrap(`по дисциплине «${t["Дисциплина"]}»`, size.titleBig, width),
    "",
    ...wrap(`Тема: «${t["Тема"]}»`, size.titleBig, width),
  ];
  const signRaw = [
    "Выполнил:",
    `студент гр. ${t["Группа"]}`,
    initialsFirst(t["Выполнил"]),
    "",
    "Принял:",
    t["Должность"],
    initialsFirst(t["Принял"]),
  ];
  const sign = signIndent(signRaw, size.body, width, p.indent.signLeft);
  const signWidth = width - sign.left;
  const signLines = signRaw.flatMap((l) => (l ? wrap(l, size.body, signWidth) : [""]));
  const warnings = [];
  if (sign.left !== p.indent.signLeft && sign.left <= width / 2) {
    const cm = (tw) => (tw / 567).toFixed(1).replace(".", ",");
    warnings.push(`блок «Выполнил / Принял» сдвинут влево до ${cm(sign.left)} см от левого поля (обычно ${cm(p.indent.signLeft)} см) — на середину листа и дальше: в него не влезает строка «${sign.longest}». ` +
      "Сократите её в RULES.MD / CONTEXT.MD (должность — до «доц. каф. …», «ст. преп. каф. …», учёную степень — до «к. т. н.» или уберите) и пересоберите.");
  }
  const city = `${t["Город"]} ${t["Год"]} г.`;

  const lh = tp.lineHeight;
  const headerH = header.length * lh.header;
  const titleH = titleLines.length * lh.big;
  const signH = signLines.length * lh.body;
  const titleTop = Math.max(headerH + tp.minGap, Math.round(tp.titleCenter - titleH / 2));
  const signTop = Math.max(tp.signTop, titleTop + titleH + tp.minGap);
  const cityTop = height - tp.slack - lh.body;
  if (cityTop < signTop + signH + tp.minGap) {
    throw new Error("Титульник не помещается на страницу: сократите тему или уменьшите profile.title.signTop");
  }

  const block = (style, lines, before, indent) => new Paragraph({
    style,
    ...(before ? { spacing: { before } } : {}),
    ...(indent ? { indent } : {}),
    children: lines.map((text, i) => new TextRun({ text, ...(i ? { break: 1 } : {}) })),
  });

  const out = [
    block(S.titleHeader, header, 0),
    block(S.titleBig, titleLines, titleTop - headerH),
    block(S.titleSign, signLines, signTop - titleTop - titleH, sign.left !== p.indent.signLeft ? { left: sign.left } : null),
    block(S.title, [city], cityTop - signTop - signH),
  ];
  out.warnings = warnings; // read by buildReport and printed by run()
  return out;
}

module.exports = { titlePage, wrap, signIndent };
