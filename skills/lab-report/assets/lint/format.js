// Blocks and packaging: captions, numbering, references, listings, tables, images,
// empty paragraphs, styles, document properties (blocks.md, docx.md).
// Records figure / table numbers on `d` for the checks that run after it.

const { S, isCode, isCaptionText, where, sentences, REF_FIG, REF_TAB } = require("./util");

const EMU_PER_PX = 9525;
const MAX_FIG_PX = 614;
const CAPITAL = /^[А-ЯЁA-Z0-9«"(]/;

module.exports = function format(d, r) {
  const { body } = d;
  const dup = [...new Set(d.styleIds.filter((id, i) => d.styleIds.indexOf(id) !== i))];
  if (dup.length) r.err("B11", `стили объявлены дважды: ${dup.join(", ")}`);
  if (!body.length) r.err("S1", "после титульника нет текста");

  d.figCaps = [];
  d.tabCaps = [];
  const badLabels = [];
  body.forEach((p, k) => {
    const next = body[k + 1];
    const before = body[k - 1];
    if (!p.text.trim() && !p.images.length && !isCode(p) && !p.inTable) r.err("B11", `пустой абзац после ${where(before)}`);
    for (const cx of p.images) if (cx > (MAX_FIG_PX + 1) * EMU_PER_PX) r.err("B8", `рисунок шире ${MAX_FIG_PX} px: ${where(before)}`);
    if (!isCode(p) && /\{(fig|tab):/.test(p.text)) r.err("B2", `неразрешённая ссылка: ${where(p)}`);

    if (p.style === S.figCaption || /^Рисунок \d+(\.| [–-]) /.test(p.text)) {
      const m = p.text.match(/^Рисунок (\d+) – (.)/);
      if (!m) r.err("B9", `подпись не по форме «Рисунок N – Название»: ${where(p)}`);
      else {
        d.figCaps.push({ n: +m[1], p });
        if (!CAPITAL.test(m[2])) r.err("B9", `название рисунка со строчной буквы: ${where(p)}`);
      }
      if (/\.\s*$/.test(p.text)) r.err("B9", `точка в конце подписи: ${where(p)}`);
      if (!before?.images.length) r.err("B9", `над подписью нет рисунка: ${where(p)}`);
    }
    const tm = p.text.match(/^(Продолжение таблицы|Таблица) (\d+)\. (.)/);
    if (tm && !p.inTable) {
      if (tm[1] === "Таблица") d.tabCaps.push({ n: +tm[2], p });
      if (!CAPITAL.test(tm[3])) r.err("B9", `название таблицы со строчной буквы: ${where(p)}`);
      if (/\.\s*$/.test(p.text)) r.err("B9", `точка в конце подписи таблицы: ${where(p)}`);
      if (!next?.inTable) r.err("B9", `под подписью таблицы нет таблицы: ${where(p)}`);
    }
    if (p.style === S.codeLabel) {
      if (p.text.trim() !== "Листинг:") badLabels.push(p);
      if (!isCode(next)) r.err("B6", `пустой листинг: ${where(p)}`);
    }
  });

  if (badLabels.length)
    r.err("B6", `подпись листинга не «Листинг:» (${badLabels.length}), первая «${badLabels[0].text.trim()}», абз. ${badLabels.map((p) => p.i + 1).join(", ")} — файл называется в абзаце перед листингом`);

  const checkSeq = (what, caps) => {
    const bad = caps.findIndex((c, i) => c.n !== i + 1);
    if (bad >= 0) r.err("B2", `нумерация ${what} нарушена: ожидался ${bad + 1}, стоит ${caps[bad].n}`);
  };
  checkSeq("рисунков", d.figCaps);
  checkSeq("таблиц", d.tabCaps);

  // references: to a missing number is an error, a figure or table nobody refers to too
  const refs = (re) => body.filter((p) => !isCode(p) && !isCaptionText(p.text)).flatMap((p) => [...p.text.matchAll(re)].map((m) => ({ n: +m[1], p })));
  d.figRefs = refs(REF_FIG);
  d.tabRefs = refs(REF_TAB);
  const checkRefs = (what, caps, found) => {
    const nums = caps.map((c) => c.n);
    for (const x of found) if (!nums.includes(x.n)) r.err("B2", `ссылка на ${what} ${x.n}, которого нет: ${where(x.p)}`);
    const referenced = new Set(found.map((x) => x.n));
    for (const n of nums) if (!referenced.has(n)) r.err("V6", `на ${what} ${n} нет ссылки в тексте`);
  };
  checkRefs("рисунок", d.figCaps, d.figRefs);
  checkRefs("таблицу", d.tabCaps, d.tabRefs);

  // listings: one block of Listing paragraphs per listing; one line per kind of problem
  let code = [];
  const withComments = [];
  const cyrillicNames = [];
  const flush = () => {
    if (!code.length) return;
    const lines = code.map((p) => p.text);
    if (lines.some((l) => /(^|\s)\/\/|\/\*|<!--|^\s*--\s|^\s*# [A-Za-zА-Яа-яЁё]/.test(l))) withComments.push(code[0]);
    // Cyrillic outside comments, string literals and JSX text — i.e. in identifiers
    const bare = (l) => l.replace(/\/\/.*$|\/\*.*?\*\/|<!--.*?-->/g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`/g, "").replace(/>[^<>{}]*</g, "><");
    if (lines.some((l) => /[А-Яа-яЁё]/.test(bare(l)))) cyrillicNames.push(code[0]);
    code = [];
  };
  for (const p of body) (isCode(p) ? code.push(p) : flush());
  flush();
  const at = (ps) => ps.map((p) => p.i + 1).join(", ");
  if (withComments.length) r.warn("B7", `комментарии в ${withComments.length} листинг(ах), абз. ${at(withComments)} — удалите`);
  if (cyrillicNames.length) r.warn("B7", `кириллица в именах кода в ${cyrillicNames.length} листинг(ах), абз. ${at(cyrillicNames)} — код скилла только на английском`);

  const prop = (tag) => (d.core.match(new RegExp(`<dcterms:${tag}[^>]*>([^<]+)<`)) || [])[1];
  if (prop("created") && prop("modified") && prop("created") >= prop("modified")) r.warn("B11", "docProps: дата создания не раньше даты изменения");
};
