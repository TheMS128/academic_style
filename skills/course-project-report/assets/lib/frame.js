// The frame and the title block of ГОСТ 2.104, written as the XML of a page header.
//
// Lines are drawing shapes anchored to the page; every inscription is a paragraph in a
// text frame (w:framePr), also anchored to the page, so the sheet number and the sheet
// count are ordinary PAGE and NUMPAGES fields. Nothing here takes room in the text flow.
// All coordinates are millimetres from the top-left corner of the page.
//
//   headerXml("frame" | "big" | "small", data, profile, idBase)
//   data: { code, topic, group, author, checker }

const { mm } = require("./profile");
const { wrap } = require("./deps");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const emu = (x) => Math.round(x * 36000);
const pt = (x) => `${((x * 72) / 25.4).toFixed(2)}pt`;

const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" ' +
  'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ' +
  'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" mc:Ignorable="w14 wp14"';

// one straight line, horizontal or vertical; weight in EMU
function lineShape(id, [x1, y1, x2, y2], weight) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const cx = emu(Math.abs(x2 - x1)), cy = emu(Math.abs(y2 - y1));
  const drawing =
    `<w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="1" locked="1" layoutInCell="0" allowOverlap="1">` +
    `<wp:simplePos x="0" y="0"/>` +
    `<wp:positionH relativeFrom="page"><wp:posOffset>${emu(x)}</wp:posOffset></wp:positionH>` +
    `<wp:positionV relativeFrom="page"><wp:posOffset>${emu(y)}</wp:posOffset></wp:positionV>` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>` +
    `<wp:docPr id="${id}" name="Line ${id}"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp>` +
    `<wps:cNvCnPr/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${weight}"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></wps:spPr>` +
    `<wps:bodyPr/></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing>`;
  const fallback =
    `<w:pict><v:line id="Line${id}" style="position:absolute;z-index:-${id};mso-position-horizontal-relative:page;mso-position-vertical-relative:page" ` +
    `from="${pt(x1)},${pt(y1)}" to="${pt(x2)},${pt(y2)}" strokecolor="black" strokeweight="${(weight / 12700).toFixed(2)}pt"/></w:pict>`;
  return `<w:r><mc:AlternateContent><mc:Choice Requires="wps">${drawing}</mc:Choice><mc:Fallback>${fallback}</mc:Fallback></mc:AlternateContent></w:r>`;
}

const field = (instr, cached, rPr) =>
  `<w:r>${rPr}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rPr}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r>` +
  `<w:r>${rPr}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rPr}<w:t>${cached}</w:t></w:r><w:r>${rPr}<w:fldChar w:fldCharType="end"/></w:r>`;

// an inscription in the cell [x, y, w, h]: lines of text, or a field ({ field: "PAGE" });
// centred vertically by moving the frame down inside the cell
function inscription(font, [x, y, w, h], content, { size, align = "center", pad = 0.8 } = {}) {
  const lines = Array.isArray(content) ? content : [content];
  const lineH = Math.round(size * 11.5);                       // exact line height, twips
  const H = mm(h), used = Math.min(H, lines.length * lineH);
  const top = mm(y) + Math.floor((H - used) / 2);
  const rPr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/><w:i/><w:iCs/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`;
  const runs = lines.map((l, i) =>
    (i ? `<w:r>${rPr}<w:br/></w:r>` : "") +
    (typeof l === "object" ? field(l.field, l.cached ?? "1", rPr) : `<w:r>${rPr}<w:t xml:space="preserve">${esc(l)}</w:t></w:r>`)).join("");
  return `<w:p><w:pPr><w:framePr w:w="${mm(w - 2 * pad)}" w:h="${used}" w:hRule="exact" w:hSpace="0" w:vSpace="0" w:wrap="around" ` +
    `w:vAnchor="page" w:hAnchor="page" w:x="${mm(x + pad)}" w:y="${top}"/>` +
    `<w:spacing w:before="0" w:after="0" w:line="${lineH}" w:lineRule="exact"/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="${align}"/></w:pPr>${runs}</w:p>`;
}

// the cell of the document name: the topic and the kind of document under it; the size
// steps down until the lines fit the cell
function nameLines(topic, kind, [, , w, h], sizes) {
  for (const size of sizes) {
    const lines = [...wrap(topic, size, mm(w - 2) * 0.82), kind];   // Arial is wider than the Times the estimate is made for
    if (lines.length * size * 11.5 <= mm(h)) return { lines, size };
  }
  throw new Error(`Тема «${topic}» не помещается в графу наименования основной надписи — сократите её в поле «Тема»`);
}

function geometry(kind, p) {
  const f = p.frame;
  const L = f.left, T = f.top, R = 210 - f.right, B = 297 - f.bottom;
  const thick = [[L, T, R, T], [L, B, R, B], [L, T, L, B], [R, T, R, B]];
  const thin = [];
  const cells = {};
  if (kind === "frame") return { thick, thin, cells };

  const x = (d) => L + d;                                       // columns of the left block: 7, 10, 23, 15, 10
  const cols = [0, 7, 17, 40, 55, 65];
  const labels = ["Изм.", "Лист", "№ докум.", "Подп.", "Дата"];
  if (kind === "small") {
    const top = B - p.stamp.small;                              // form 2а: 185 × 15
    thick.push([L, top, R, top], [x(65), top, x(65), B], [R - 10, top, R - 10, B], [R - 10, top + 7, R, top + 7]);
    for (const c of cols.slice(1, 5)) thick.push([x(c), top, x(c), B]);
    thin.push([L, top + 5, x(65), top + 5], [L, top + 10, x(65), top + 10]);
    cells.labels = labels.map((t, i) => [t, [x(cols[i]), top + 10, cols[i + 1] - cols[i], 5]]);
    cells.code = [x(65), top, R - 10 - x(65), 15];
    cells.sheetLabel = [R - 10, top, 10, 7];
    cells.sheet = [R - 10, top + 7, 10, 8];
    return { thick, thin, cells };
  }

  const top = B - p.stamp.big;                                  // form 2: 185 × 40, rows of 5
  const row = (i) => top + 5 * i;
  thick.push([L, top, R, top], [x(65), top, x(65), B], [x(65), row(3), R, row(3)], [L, row(3), x(65), row(3)]);
  thick.push([x(7), top, x(7), row(3)]);
  for (const c of cols.slice(2, 5)) thick.push([x(c), top, x(c), B]);
  for (const i of [1, 2, 4, 5, 6, 7]) thin.push([L, row(i), x(65), row(i)]);
  const N = R - 50;                                             // right part: Лит. 15, Лист 15, Листов 20
  thick.push([N, row(3), N, B], [N, row(4), R, row(4)], [N, row(5), R, row(5)], [N + 15, row(3), N + 15, row(5)], [N + 30, row(3), N + 30, row(5)]);
  thin.push([N + 5, row(4), N + 5, row(5)], [N + 10, row(4), N + 10, row(5)]);
  cells.labels = labels.map((t, i) => [t, [x(cols[i]), row(2), cols[i + 1] - cols[i], 5]]);
  cells.roles = ["Разраб.", "Пров.", "", "Н. контр.", "Утв."].map((t, i) => [t, [L, row(3 + i), 17, 5]]);
  cells.author = [x(17), row(3), 23, 5];
  cells.checker = [x(17), row(4), 23, 5];
  cells.code = [x(65), top, R - x(65), 15];
  cells.name = [x(65), row(3), N - x(65), 25];
  cells.right = [["Лит.", [N, row(3), 15, 5]], ["Лист", [N + 15, row(3), 15, 5]], ["Листов", [N + 30, row(3), 20, 5]]];
  cells.letter = [N + 5, row(4), 5, 5];
  cells.sheet = [N + 15, row(4), 15, 5];
  cells.sheets = [N + 30, row(4), 20, 5];
  cells.group = [N, row(5), 50, 15];
  return { thick, thin, cells };
}

function headerXml(kind, data, p, idBase) {
  const { thick, thin, cells } = geometry(kind, p);
  const s = p.stamp.size, font = p.font.stamp;
  const put = (cell, content, opts) => inscription(font, cell, content, opts);
  const frames = [];
  if (kind !== "frame") {
    for (const [t, cell] of cells.labels) frames.push(put(cell, t, { size: s.label, pad: 0 }));
    frames.push(put(cells.code, data.code, { size: s.code }));
  }
  if (kind === "small") {
    frames.push(put(cells.sheetLabel, "Лист", { size: s.label, pad: 0 }));
    frames.push(put(cells.sheet, { field: "PAGE", cached: "4" }, { size: s.sheet, pad: 0 }));
  }
  if (kind === "big") {
    for (const [t, cell] of cells.roles) if (t) frames.push(put(cell, t, { size: s.label, align: "left" }));
    frames.push(put(cells.author, data.author, { size: s.name, align: "left", pad: 0.5 }));
    frames.push(put(cells.checker, data.checker, { size: s.name, align: "left", pad: 0.5 }));
    const name = nameLines(data.topic, p.stamp.kind, cells.name, [s.title, s.title - 2, s.title - 4]);
    frames.push(put(cells.name, name.lines, { size: name.size, pad: 1 }));
    for (const [t, cell] of cells.right) frames.push(put(cell, t, { size: s.label, pad: 0 }));
    frames.push(put(cells.letter, p.stamp.letter, { size: s.label, pad: 0 }));
    frames.push(put(cells.sheet, { field: "PAGE", cached: "2" }, { size: s.label, pad: 0 }));
    frames.push(put(cells.sheets, { field: "NUMPAGES", cached: "1" }, { size: s.label, pad: 0 }));
    frames.push(put(cells.group, data.group, { size: s.group }));
  }
  let id = idBase;
  const shapes = [
    ...thick.map((l) => lineShape(++id, l, p.stamp.line)),
    ...thin.map((l) => lineShape(++id, l, p.stamp.thin)),
  ];
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    `<w:hdr ${NS}>${frames.join("")}` +
    `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr>${shapes.join("")}</w:p></w:hdr>`;
}

module.exports = { headerXml, geometry };
