// Turns content descriptors (blocks.js) into docx paragraphs and tables.

const fs = require("fs");
const path = require("path");
const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  TableLayoutType, AlignmentType,
} = require("docx");
const { S } = require("./styles");

function pngSize(buf, name) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${name}: ожидается PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// figure and table numbers in document order, by key
function numberBlocks(body) {
  const nums = { fig: new Map(), tab: new Map() };
  for (const b of body) {
    const map = b.kind === "figure" ? nums.fig : b.kind === "table" ? nums.tab : null;
    if (!map) continue;
    if (map.has(b.key)) throw new Error(`Ключ «${b.key}» использован дважды`);
    map.set(b.key, map.size + 1);
  }
  return nums;
}

function compose(body, { figdir, profile: pr }) {
  const nums = numberBlocks(body);

  const resolve = (s) => s.replace(/\{(fig|tab):([^}\s]+)\}/g, (token, kind, key) => {
    const n = nums[kind].get(key);
    if (!n) throw new Error(`Ссылка ${token}: ${kind === "fig" ? "рисунка" : "таблицы"} с таким ключом нет`);
    return String(n);
  });
  const runs = (text) => (Array.isArray(text) ? text : [text]).map((seg) =>
    typeof seg === "string"
      ? new TextRun(resolve(seg))
      : new TextRun({ text: resolve(seg.text), bold: seg.bold, italics: seg.italic }));

  const children = [];
  const numberingRefs = [];
  let prev = null;

  for (const b of body) {
    // escape hatch: ready-made docx objects pass through untouched
    if (b instanceof Paragraph || b instanceof Table) {
      children.push(b);
      prev = null;
      continue;
    }
    // 14 pt after a table grid goes on the paragraph that follows it
    const afterTable = prev?.kind === "table" ? { spacing: { before: pr.gap.block } } : {};
    switch (b.kind) {
      case "chapter":
        children.push(new Paragraph({ style: S.chapter, children: runs(b.text) }));
        break;
      case "subchapter":
        children.push(new Paragraph({ style: S.subchapter, children: runs(b.text) }));
        break;
      case "p":
        children.push(new Paragraph({ style: S.body, ...afterTable, children: runs(b.text) }));
        break;
      case "list": {
        const reference = `list${numberingRefs.length + 1}`;
        numberingRefs.push(reference);
        b.items.forEach((item, i) => children.push(new Paragraph({
          style: S.list, numbering: { reference, level: 0 }, ...(i ? {} : afterTable), children: runs(item),
        })));
        break;
      }
      case "figure":
        children.push(...figureBlock(b));
        break;
      case "table":
        children.push(...tableBlock(b));
        break;
      case "listing":
        children.push(...listingBlock(b));
        break;
      default:
        throw new Error(`Неизвестный блок: ${JSON.stringify(b).slice(0, 80)}`);
    }
    prev = b;
  }
  return { children, numberingRefs, counts: { figures: nums.fig.size, tables: nums.tab.size } };

  function figureBlock(b) {
    const data = fs.readFileSync(path.join(figdir, b.file));
    const { width, height } = pngSize(data, b.file);
    let w = b.wide ? pr.figure.widePx : pr.figure.defaultPx;
    let h = Math.round((w * height) / width);
    if (b.fit === "height") {
      h = pr.figure.fitHeightPx;
      w = Math.round((h * width) / height);
    } else if (h > pr.figure.maxHeightPx) {
      const cm = (px) => ((px / 96) * 2.54).toFixed(1);
      throw new Error(
        `Рисунок «${b.key}» (${b.file}) при ширине ${w} px выйдет высотой ${cm(h)} см и не поместится на страницу. ` +
        `Спросите пользователя, как поступить: обрезать снимок до области, достаточной для задачи ` +
        `(crop-screen.js --rect x,y,w,h); ограничить высоту ${cm(pr.figure.fitHeightPx)} см — figure(…, { fit: "height" }); ` +
        `или свой вариант (references/figures.md → G7).`);
    }
    return [
      new Paragraph({
        style: S.figure,
        children: [new ImageRun({ data, type: "png", transformation: { width: w, height: h } })],
      }),
      new Paragraph({ style: S.figCaption, children: [new TextRun(pr.captions.figure(nums.fig.get(b.key), resolve(b.caption)))] }),
    ];
  }

  function tableBlock(b) {
    const n = nums.tab.get(b.key);
    const total = pr.table.width;
    const weights = b.columns.map((c) => c.width || 1);
    const sum = weights.reduce((a, x) => a + x, 0);
    const widths = weights.map((x) => Math.floor((total * x) / sum));
    widths[widths.length - 1] += total - widths.reduce((a, x) => a + x, 0);

    const line = { style: BorderStyle.SINGLE, size: pr.table.border, color: "000000" };
    const cell = (content, i, head) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      margins: pr.table.cellMargin,
      children: [new Paragraph({
        style: head ? S.tabHead : S.tabCell,
        ...(!head && b.columns[i].align === "center" ? { alignment: AlignmentType.CENTER } : {}),
        children: head ? [new TextRun(content)] : runs(typeof content === "number" ? String(content) : content),
      })],
    });
    const grid = (rows) => new Table({
      alignment: AlignmentType.CENTER,
      width: { size: total, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: widths,
      borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
      rows: [
        new TableRow({ tableHeader: true, cantSplit: true, children: b.columns.map((c, i) => cell(c.title, i, true)) }),
        ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) })),
      ],
    });

    const name = resolve(b.caption);
    const parts = b.splitAt ? [b.rows.slice(0, b.splitAt), b.rows.slice(b.splitAt)] : [b.rows];
    return parts.flatMap((rows, i) => [
      new Paragraph({
        style: S.tabCaption,
        // a caption opening a new page needs no 14 pt gap above it
        ...(i > 0 || b.pageBreakBefore ? { pageBreakBefore: true, spacing: { before: 0 } } : {}),
        children: [new TextRun(i ? pr.captions.tableCont(n, name) : pr.captions.table(n, name))],
      }),
      grid(rows),
    ]);
  }

  function listingBlock(b) {
    const raw = b.code.replace(/\t/g, "    ").replace(/\s+$/, "").split(/\r?\n/);
    // фрагмент, вырезанный из середины файла, несёт отступ своего уровня вложенности;
    // общий отступ снимается, чтобы листинг начинался от левого края
    const indents = raw.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const strip = indents.length ? Math.min(...indents) : 0;
    const lines = raw.map((l) => l.slice(strip));
    return [
      new Paragraph({ style: S.codeLabel, children: [new TextRun(b.label)] }),
      ...lines.map((l, i) => new Paragraph({
        style: S.code,
        ...(i === lines.length - 1 ? { spacing: { after: pr.gap.block } } : {}),
        children: [new TextRun(l)],
      })),
    ];
  }
}

module.exports = { compose, pngSize };
