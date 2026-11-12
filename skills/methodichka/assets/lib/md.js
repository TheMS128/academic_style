// Конвертер Markdown → элементы docx под стили методички.
//
// Заголовки:  #  → Раздел (разрыв страницы перед ним),  ##  → Глава (работа),
//             ###… → Подглава.
// Списки:     «1. …» и «- …» — настоящие нумерованные/маркированные списки Word.
// Таблицы:    строка «Таблица: Название» перед таблицей даёт подпись «Таблица N. Название»
//             (по центру, 10 пт до; после таблицы — 10 пт). Строка-маркер «%%split»
//             делит длинную таблицу: продолжение с новой страницы и подписью
//             «Продолжение таблицы N. Название», шапка повторяется.
// Листинги:   ```Название → подпись «Название:» без отступа, затем код; после кода 10 пт.
// Выделение:  только в заголовках (через стиль). В тексте ** игнорируется; `код`
//             остаётся моноширинным (это шрифт кода, а не выделение).

const fs = require("fs");
const path = require("path");
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType,
  TableLayoutType, ImageRun,
} = require("docx");
const { S } = require("./styles");

function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function parseInline(text, p) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index) }));
    if (m[2] != null) runs.push(new TextRun({ text: m[2] }));                        // ** → без выделения
    else if (m[3] != null) runs.push(new TextRun({ text: m[3], font: p.font.code, size: p.size.code })); // `код` → моноширинный
    last = re.lastIndex;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last) }));
  return runs.length ? runs : [new TextRun({ text: "" })];
}

const isTable = (l) => /^\s*\|.*\|\s*$/.test(l);
const isRule = (l) => /^\s*---+\s*$/.test(l);
const heading = (l) => l.match(/^(#{1,6})\s+(.*)$/);
const bullet = (l) => l.match(/^\s*[-*]\s+(.*)$/);
const numbered = (l) => l.match(/^\s*(\d+)\.\s+(.*)$/);
const quote = (l) => l.match(/^>\s?(.*)$/);
const caption = (l) => l.match(/^\s*Таблица:\s*(.+)$/);
const image = (l) => l.match(/^!\[(.*?)\]\((.+?)\)\s*$/);

function isContinuation(l) {
  if (l.trim() === "") return false;
  if (isTable(l) || isRule(l) || heading(l) || bullet(l) || numbered(l) || quote(l) || caption(l) || image(l)) return false;
  if (l.startsWith("```")) return false;
  return true;
}

function cells(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

// одна таблица (шапка + строки) с фиксированной шириной колонок.
// keepNext на всех строках, кроме последней, удерживает таблицу на одной странице:
// не помещающаяся целиком переносится на следующую, а не рвётся посреди.
function grid(header, bodyRows, p) {
  const n = header.length;
  const total = p.table.width;
  const widths = Array.from({ length: n }, () => Math.floor(total / n));
  widths[n - 1] += total - widths.reduce((a, x) => a + x, 0);
  const border = { style: BorderStyle.SINGLE, size: p.table.border, color: "000000" };
  const mkCell = (text, i, head, keep) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    margins: p.table.cellMargin,
    children: [new Paragraph({ style: head ? S.tabHead : S.tabCell, keepNext: keep, children: parseInline(text, p) })],
  });
  const all = [{ cells: header, head: true }, ...bodyRows.map((r) => ({ cells: r, head: false }))];
  const rows = all.map((row, idx) => new TableRow({
    tableHeader: row.head, cantSplit: true,
    children: Array.from({ length: n }, (_, i) => mkCell(row.cells[i] || "", i, row.head, idx < all.length - 1)),
  }));
  return new Table({
    alignment: AlignmentType.CENTER,
    width: { size: total, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: widths,
    borders: {
      top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border,
    },
    rows,
  });
}

function mdToDoc(md, p, opts = {}) {
  const baseDir = opts.baseDir || ".";
  const out = [];
  const numbering = [];
  const lines = md.split(/\r?\n/);
  let i = 0;
  let para = [];
  let curList = null;      // { ref, type } — текущий открытый список
  let capText = null;      // подпись, ожидающая таблицу
  let tableNo = 0;
  let figNo = 0;
  let pendingBefore = 0;   // отступ (twips), добавляемый следующему абзацу (после таблицы)

  const takeBefore = () => { const b = pendingBefore; pendingBefore = 0; return b ? { spacing: { before: b } } : {}; };

  const flushPara = () => {
    if (!para.length) return;
    curList = null;
    out.push(new Paragraph({ style: S.body, ...takeBefore(), children: parseInline(para.join(" "), p) }));
    para = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { flushPara(); i++; continue; }
    if (isRule(line)) { flushPara(); i++; continue; }

    const cap = caption(line);
    if (cap) { flushPara(); capText = cap[1].trim(); i++; continue; }

    const img = image(line);
    if (img) {
      flushPara(); curList = null;
      const name = img[1].trim();
      const src = path.resolve(baseDir, img[2].trim());
      try {
        const data = fs.readFileSync(src);
        const { width, height } = pngSize(data);
        const w = p.figure.defaultPx;
        out.push(new Paragraph({ style: S.figure, ...takeBefore(), children: [new ImageRun({ data, type: "png", transformation: { width: w, height: Math.round((w * height) / width) } })] }));
        out.push(new Paragraph({ style: S.figCaption, children: [new TextRun(`Рисунок ${++figNo}. ${name}`)] }));
      } catch (e) {
        out.push(new Paragraph({ style: S.body, ...takeBefore(), children: [new TextRun(`[рисунок не найден: ${img[2]}]`)] }));
      }
      i++; continue;
    }

    const h = heading(line);
    if (h) {
      flushPara(); curList = null;
      const level = h[1].length;
      const style = level === 1 ? S.razdel : level === 2 ? S.chapter : S.subchapter;
      out.push(new Paragraph({ style, children: parseInline(h[2], p) }));
      i++; continue;
    }

    if (isTable(line)) {
      flushPara(); curList = null;
      const rows = [];
      while (i < lines.length && (isTable(lines[i]) || /^\s*%%split\s*$/.test(lines[i]))) { rows.push(lines[i]); i++; }
      emitTable(rows);
      continue;
    }

    if (line.startsWith("```")) {
      flushPara(); curList = null;
      const label = line.slice(3).trim();
      if (label) out.push(new Paragraph({ style: S.codeLabel, ...takeBefore(), children: [new TextRun(label + ":")] }));
      i++;
      const code = [];
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      i++; // закрывающая ```
      code.forEach((l, k) => out.push(new Paragraph({
        style: S.code,
        ...(k === 0 && !label ? takeBefore() : {}),
        ...(k === code.length - 1 ? { spacing: { after: p.gap.code } } : {}),
        children: [new TextRun(l)],
      })));
      continue;
    }

    const q = quote(line);
    if (q) {
      flushPara(); curList = null;
      const buf = [];
      while (i < lines.length && quote(lines[i]) !== null) { buf.push(quote(lines[i])[1]); i++; }
      out.push(new Paragraph({ style: S.body, ...takeBefore(), children: parseInline(buf.join(" ").trim(), p) }));
      continue;
    }

    const b = bullet(line);
    const ndd = numbered(line);
    if (b || ndd) {
      const type = b ? "bullet" : "decimal";
      if (!curList || curList.type !== type) {
        const ref = `${type}${numbering.length + 1}`;
        numbering.push({ reference: ref, format: type });
        curList = { ref, type };
      }
      let text = b ? b[1] : ndd[2];
      i++;
      while (i < lines.length && isContinuation(lines[i])) { text += " " + lines[i].trim(); i++; }
      out.push(new Paragraph({
        style: S.list,
        numbering: { reference: curList.ref, level: 0 },
        ...takeBefore(),
        children: parseInline(text, p),
      }));
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();
  return { children: out, numbering };

  // emitTable рендерит одну таблицу с подписью, деля её по маркерам %%split
  function emitTable(rows) {
    const dataLines = rows.filter((r) => isTable(r));
    if (dataLines.length < 2) { capText = null; return; }
    const header = cells(dataLines[0]);
    // тело без строки-разделителя |---|; %%split разбивает на группы
    const groups = [[]];
    for (let k = 2; k < rows.length; k++) {
      if (/^\s*%%split\s*$/.test(rows[k])) { groups.push([]); continue; }
      if (isTable(rows[k])) groups[groups.length - 1].push(cells(rows[k]));
    }
    const n = ++tableNo;
    const name = capText || "";
    capText = null;
    groups.forEach((g, gi) => {
      const title = gi === 0
        ? `Таблица ${n}. ${name}`
        : `Продолжение таблицы ${n}. ${name}`;
      out.push(new Paragraph({
        style: S.tabCaption,
        ...(gi > 0 ? { pageBreakBefore: true } : {}),
        children: [new TextRun(title)],
      }));
      out.push(grid(header, g, p));
    });
    pendingBefore = p.gap.table; // 10 пт после таблицы
  }
}

module.exports = { mdToDoc };
