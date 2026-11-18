#!/usr/bin/env node
// The text of a built report, in the draft format of the core (headings, paragraphs,
// numbered lists, captions, listings). For a report that has no text.md — one made
// before the draft existed — this is what the check of verify.md reads (K3).
//
//   node text.js <report.docx> [out.md]

const fs = require("fs");
const JSZip = require("jszip");
const { parseDocument } = require("../lint/parse");
const { toEntries } = require("../lint/text");

const [file, out] = process.argv.slice(2);
if (!file) {
  console.error("usage: node text.js <report.docx> [out.md]");
  process.exit(2);
}

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const read = (n) => (zip.file(n) ? zip.file(n).async("string") : "");
  const d = parseDocument({ doc: await read("word/document.xml"), styles: await read("word/styles.xml"), core: "" });
  const entries = toEntries(d);

  const lines = [];
  let n = 0;
  entries.forEach((e, k) => {
    if (e.kind !== "item") n = 0;
    if (e.kind === "heading") lines.push(`${"#".repeat(e.level)} ${e.text}`);
    else if (e.kind === "p") lines.push(e.text);
    else if (e.kind === "item") { lines.push(`${++n}. ${e.text}`); return; }
    else if (e.kind === "code") lines.push("```\n" + e.text + "\n```");
    else if (e.kind === "table") lines.push((e.rows || []).map((r) => `| ${r.join(" | ")} |`).join("\n"));
    else if (e.kind === "figure") lines.push(`![${(entries[k + 1]?.kind === "caption" ? entries[k + 1].text : "")}](figure)`);
    else if (e.kind === "caption") {
      if (entries[k - 1]?.kind === "figure") return; // already in the figure line
      lines.push(e.text);
    }
    lines.push("");
  });

  const md = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  if (out) fs.writeFileSync(out, md);
  else process.stdout.write(md);
})().catch((e) => { console.error("ОШИБКА: " + e.message); process.exit(1); });
