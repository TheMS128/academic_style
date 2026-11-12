// Turns the content descriptors (blocks.js) into docx paragraphs and tables, split into
// the three parts of the note that sit in different sections: the abstract, the contents
// and the main text. Returns also what the checks need: the plain text of every
// paragraph (the model of the core lint), the contents entries and the counts.

const fs = require("fs");
const path = require("path");
const { docx, pngSize } = require("./deps");
const { S, textWidth } = require("./styles");
const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  TableLayoutType, AlignmentType, Bookmark, SimpleField,
} = docx;

const TOC_MARK = "@@KP-TOC@@";
const COUNTS = ["pages", "figures", "tables", "sources", "appendices"];

// «1 рисунок», «2 рисунка», «5 рисунков»; two forms — singular and plural
function agree(n, forms) {
  if (forms.length === 2) return forms[n === 1 ? 0 : 1];
  const d = n % 10, h = n % 100;
  return forms[d === 1 && h !== 11 ? 0 : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 1 : 2];
}

const plain = (text) => (Array.isArray(text) ? text : [text]).map((s) => (typeof s === "string" ? s : s.text)).join("");
const itemText = (item) => (Array.isArray(item) && Array.isArray(item[1]) ? item[0] : item);
const itemNested = (item) => (Array.isArray(item) && Array.isArray(item[1]) ? item[1] : []);

// numbers of everything that is numbered, in document order
function numberBlocks(body, p) {
  const n = { fig: new Map(), tab: new Map(), src: new Map(), app: new Map(), headings: new Map() };
  const put = (map, key, value, what) => {
    if (!key) throw new Error(`У блока «${what}» нет ключа`);
    if (map.has(key)) throw new Error(`Ключ «${key}» использован дважды (${what})`);
    map.set(key, value);
  };
  let c = 0, s = 0, pt = 0;
  for (const b of body) {
    if (b.kind === "figure" || b.kind === "listing") put(n.fig, b.key, n.fig.size + 1, "рисунок");
    else if (b.kind === "table") put(n.tab, b.key, n.tab.size + 1, "таблица");
    else if (b.kind === "sources") b.items.forEach(([key]) => put(n.src, key, n.src.size + 1, "источник"));
    else if (b.kind === "appendix") {
      const letter = p.appendixLetters[n.app.size];
      if (!letter) throw new Error("Приложений больше, чем букв для их обозначения");
      put(n.app, b.key, letter, "приложение");
    } else if (b.kind === "heading") {
      if (b.level === 1) { c++; s = 0; pt = 0; n.headings.set(b, `${c}`); }
      else if (b.level === 2) { s++; pt = 0; n.headings.set(b, `${c}.${s}`); }
      else { pt++; n.headings.set(b, `${c}.${s}.${pt}`); }
    }
  }
  return n;
}

function compose(body, { figdir, profile: p, pages }) {
  const nums = numberBlocks(body, p);
  const counts = { pages, figures: nums.fig.size, tables: nums.tab.size, sources: nums.src.size, appendices: nums.app.size };
  const WHAT = { fig: "рисунка", tab: "таблицы", src: "источника", app: "приложения" };

  // {fig:key} and the like → numbers; counts stay for runs()
  const resolve = (s) => s.replace(/\{(fig|tab|src|app):([^}\s]+)\}/g, (token, kind, key) => {
    const v = nums[kind].get(key);
    if (v === undefined) throw new Error(`Ссылка ${token}: ${WHAT[kind]} с таким ключом нет`);
    return String(v);
  });
  const COUNT = new RegExp(`\\{(${COUNTS.join("|")})(?::([^}]+))?\\}`, "g");
  // counts as text: the page count, while unknown, reads «N» for the lint and the checks
  const countText = (s) => s.replace(COUNT, (_, name, forms) => {
    const v = counts[name];
    const f = forms ? forms.split("|") : null;
    if (v === undefined) return f ? `N ${f[f.length - 1]}` : "N";
    return f ? `${v} ${agree(v, f)}` : String(v);
  });
  const text = (t) => countText(resolve(plain(t)));

  const segment = (str, fmt) => {
    const out = [];
    let last = 0;
    const s = resolve(str);
    for (const m of s.matchAll(COUNT)) {
      if (m[1] !== "pages" || counts.pages !== undefined) continue;
      if (m.index > last) out.push(new TextRun({ text: countText(s.slice(last, m.index)), ...fmt }));
      const forms = m[2] ? m[2].split("|") : null;
      out.push(new SimpleField("NUMPAGES", "1"));
      if (forms) out.push(new TextRun({ text: ` ${forms[forms.length - 1]}`, ...fmt }));
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push(new TextRun({ text: countText(s.slice(last)), ...fmt }));
    return out;
  };
  const runs = (t) => (Array.isArray(t) ? t : [t]).flatMap((seg) =>
    typeof seg === "string" ? segment(seg, {}) : segment(seg.text, { bold: seg.bold, italics: seg.italic }));

  const parts = { abstract: [], contents: [], main: [] };
  const entries = [];                     // the model of the core lint
  const toc = [];                         // { level, text, bookmark }
  const lists = [];                       // { reference, kind }
  let out = parts.main;
  let heads = [];
  let inAppendix = false;
  let sectionStart = true;                // a heading that opens a section needs no page break of its own

  const heading = (style, label, level, { tocText = label, outline = true } = {}) => {
    const bookmark = `_Toc${String(toc.length + 1).padStart(6, "0")}`;
    const lines = label.split("\n");
    const children = lines.map((l, i) => new TextRun({ text: l, ...(i ? { break: 1 } : {}) }));
    out.push(new Paragraph({ style, ...(sectionStart && level === 1 ? { pageBreakBefore: false } : {}), children: outline ? [new Bookmark({ id: bookmark, children })] : children }));
    sectionStart = false;
    if (outline && level <= p.toc.levels) toc.push({ level, text: tocText, bookmark });
    heads = level === 1 ? [tocText] : [...heads.slice(0, level - 1), tocText];
    entries.push({ kind: "heading", text: tocText, level, heads: heads.slice(0, level - 1) });
  };
  const para = (style, t, kind = "p", extra = {}) => {
    out.push(new Paragraph({ style, ...extra, children: runs(t) }));
    if (kind) entries.push({ kind, text: text(t), heads: [...heads] });
  };
  const newList = (kind) => {
    const reference = `kp-list-${lists.length + 1}`;
    lists.push({ reference, kind });
    return reference;
  };

  for (const b of body) {
    if (b instanceof Paragraph || b instanceof Table) { out.push(b); continue; }   // escape hatch
    switch (b.kind) {
      case "abstract":
        out = parts.abstract;
        heading(S.chapter, p.headings.abstract, 1);
        b.ru.forEach((t) => para(S.body, t));
        if (b.en && b.en.length) {
          out.push(new Paragraph({ style: S.centered, children: [new TextRun(p.headings.abstractEn)] }));
          b.en.forEach((t) => para(S.body, t, null));           // English: outside the Russian lint
        }
        out = parts.contents;
        sectionStart = true;
        heading(S.chapter, p.headings.contents, 1, { outline: p.toc.listsItself });
        out.push(new Paragraph({ style: S.toc1, children: [new TextRun(TOC_MARK)] }));
        out = parts.main;
        sectionStart = true;
        break;
      case "part":
        inAppendix = false;
        heading(S.chapter, p.headings[b.part], 1);
        break;
      case "heading": {
        if (inAppendix) throw new Error(`Заголовок «${b.text}» стоит внутри приложения — главы идут до заключения`);
        const n = nums.headings.get(b);
        const label = b.level === 1 ? `${n} ${b.text.toUpperCase()}` : `${n} ${b.text}`;
        heading([S.chapter, S.section, S.point][b.level - 1], label, b.level);
        break;
      }
      case "p":
        para(S.body, b.text);
        break;
      case "list": {
        const reference = newList(b.marker);
        for (const item of b.items) {
          para(S.dash, itemText(item), "item", { numbering: { reference, level: 0 } });
          for (const sub of itemNested(item)) para(S.dash, sub, "item", { numbering: { reference, level: 1 } });
        }
        break;
      }
      case "figure":
        figureBlock(b);
        break;
      case "table":
        tableBlock(b);
        break;
      case "listing":
        listingBlock(b);
        break;
      case "sources": {
        inAppendix = false;
        heading(S.chapter, p.headings.sources, 1);
        const reference = newList("source");
        b.items.forEach(([, entry]) => para(S.source, entry, "source", { numbering: { reference, level: 0 } }));
        break;
      }
      case "appendix": {
        inAppendix = true;
        const label = `${p.headings.appendix} ${nums.app.get(b.key)}`;
        heading(S.chapter, `${label}\n${b.title.toUpperCase()}`, 1, { tocText: `${label} ${b.title.toUpperCase()}` });
        break;
      }
      default:
        throw new Error(`Неизвестный блок: ${JSON.stringify(b).slice(0, 80)}`);
    }
  }
  return { parts, entries, toc, lists, counts, nums };

  function figureBlock(b) {
    const data = fs.readFileSync(path.join(figdir, b.file));
    const { width, height } = pngSize(data, b.file);
    const px = (cm) => (cm / 2.54) * 96;
    let w = b.width ? px(b.width) : Math.min(width, px(p.figure.maxWidthCm));
    let h = (w * height) / width;
    if (h > px(p.figure.maxHeightCm)) { h = px(p.figure.maxHeightCm); w = (h * width) / height; }
    out.push(new Paragraph({ style: S.figure, children: [new ImageRun({ data, type: "png", transformation: { width: Math.round(w), height: Math.round(h) } })] }));
    entries.push({ kind: "figure", text: "", heads: [...heads] });
    para(S.caption, p.captions.figure(nums.fig.get(b.key), text(b.caption)), "caption");
  }

  function tableBlock(b) {
    const total = textWidth(p);
    const weights = b.columns.map((c) => c.width || 1);
    const sum = weights.reduce((a, x) => a + x, 0);
    const widths = weights.map((x) => Math.floor((total * x) / sum));
    widths[widths.length - 1] += total - widths.reduce((a, x) => a + x, 0);
    const line = { style: BorderStyle.SINGLE, size: p.table.border, color: "000000" };
    const cell = (content, i, head) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      margins: p.table.cellMargin,
      children: [new Paragraph({
        style: head ? S.tabHead : S.tabCell,
        ...(!head && b.columns[i].align === "center" ? { alignment: AlignmentType.CENTER } : {}),
        children: runs(typeof content === "number" ? String(content) : content),
      })],
    });
    para(S.tabCaption, p.captions.table(nums.tab.get(b.key), text(b.caption)), "caption");
    out.push(new Table({
      width: { size: total, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: widths,
      borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
      rows: [
        new TableRow({ tableHeader: true, cantSplit: true, children: b.columns.map((c, i) => cell(c.title, i, true)) }),
        ...b.rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) })),
      ],
    }));
    out.push(new Paragraph({ style: S.body, spacing: { line: 240 }, children: [] }));   // a table is never the last thing before a heading
    entries.push({ kind: "table", text: b.rows.map((r) => r.map((c) => text(String(c))).join(" | ")).join("\n"), rows: [b.columns.map((c) => c.title), ...b.rows.map((r) => r.map((c) => text(String(c))))], heads: [...heads] });
  }

  function listingBlock(b) {
    const raw = b.code.replace(/\t/g, "    ").replace(/\s+$/, "").split(/\r?\n/);
    const indents = raw.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const strip = indents.length ? Math.min(...indents) : 0;
    const lines = raw.map((l) => l.slice(strip));
    lines.forEach((l, i) => out.push(new Paragraph({
      style: S.code,
      ...(i === 0 ? { spacing: { before: p.gap.figure } } : {}),
      ...(i === lines.length - 1 ? { keepNext: true } : {}),
      children: [new TextRun(l)],
    })));
    entries.push({ kind: "code", text: lines.join("\n"), heads: [...heads] });
    para(S.caption, p.captions.figure(nums.fig.get(b.key), text(b.caption)), "caption");
  }
}

module.exports = { compose, agree, plain, itemText, itemNested, TOC_MARK, COUNTS };
