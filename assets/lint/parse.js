// Draft text (SKILL.md → Draft format) → the model of util.js. Plain text with no markup
// at all parses too: paragraphs separated by blank lines.

const { isCaptionText } = require("./util");

const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
const isRule = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

function parseText(src) {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  const heads = [];
  const push = (kind, text, extra = {}) => out.push({ i: out.length, kind, text, heads: heads.map((h) => h.text), ...extra });

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (!line.trim()) continue;

    if (/^\s*(```|~~~)/.test(line)) {
      const code = [];
      for (n++; n < lines.length && !/^\s*(```|~~~)/.test(lines[n]); n++) code.push(lines[n]);
      push("code", code.join("\n"));
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*\S)\s*$/);
    if (h) {
      while (heads.length && heads[heads.length - 1].level >= h[1].length) heads.pop();
      const text = h[2].replace(/\s+#+$/, "");
      push("heading", text, { level: h[1].length });
      heads.push({ level: h[1].length, text });
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows = [];
      for (; n < lines.length && /^\s*\|.*\|\s*$/.test(lines[n]); n++) if (!isRule(lines[n])) rows.push(cells(lines[n]));
      n--;
      push("table", rows.map((r) => r.join(" | ")).join("\n"), { rows });
      continue;
    }
    if (/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(line)) {
      push("figure", line.match(/!\[([^\]]*)\]/)[1]);
      continue;
    }
    const item = line.match(/^\s*(?:\d+[.)]|[-*•–])\s+(.*)$/);
    const block = [item ? item[1] : line.trim()];
    // an item or a paragraph runs to the next blank line or the next construct
    while (n + 1 < lines.length && lines[n + 1].trim() && !/^\s*(?:\d+[.)]|[-*•–])\s+|^#{1,6}\s|^\s*\||^\s*(```|~~~)|^\s*!\[/.test(lines[n + 1])) block.push(lines[++n].trim());
    const text = block.join(" ");
    if (item) push("item", text);
    else if (isCaptionText(text)) push("caption", text);
    else push("p", text);
  }
  return out;
}

module.exports = { parseText };
