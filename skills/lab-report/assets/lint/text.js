// The wording of the report is checked by the core, not here: the rules V, L, F and T
// live in skills/core and this skill only hands its document over, together with the
// genre profile (profile.json). The built .docx is turned into the entries the core lint
// reads — see skills/core/assets/lint/util.js.

const path = require("path");
const { S, isCode, isCaptionText } = require("./util");

const CORE = path.join(__dirname, "..", "..", "..", "core", "assets", "lint");
const fs = require("fs");
const PROFILE = path.join(__dirname, "..", "..", "profile.json");
// a practical work is the practice-report genre: its profile is built on this one
const PRACTICE = path.join(__dirname, "..", "..", "..", "practice-report", "profile.json");

function loadCore() {
  try {
    return require(CORE);
  } catch (e) {
    throw new Error(`не найдено ядро правил текста (${CORE}) — скилл core ставится рядом с lab-report: ${e.message}`);
  }
}

function toEntries(d) {
  const entries = [];
  let code = null;
  let table = 0;
  let inTable = false;
  for (const p of d.body) {
    // a subchapter's exemption covers only its zone (parse.js); elsewhere the chapter decides
    const heads = [p.chapter, p.zone].filter(Boolean);
    if (p.inTable) {
      if (!inTable) {
        const rows = d.tables[table++] || [];
        entries.push({ i: p.i, kind: "table", text: rows.map((r) => r.join(" | ")).join("\n"), rows, heads });
      }
      inTable = true;
      code = null;
      continue;
    }
    inTable = false;
    if (isCode(p)) {
      if (code) code.text += "\n" + p.text;
      else entries.push((code = { i: p.i, kind: "code", text: p.text, heads }));
      continue;
    }
    code = null;
    const text = p.text.trim();
    if (p.style === S.chapter) entries.push({ i: p.i, kind: "heading", level: 1, text, heads: [] });
    else if (p.style === S.subchapter) entries.push({ i: p.i, kind: "heading", level: 2, text, heads: [p.chapter].filter(Boolean) });
    else if (p.images.length) entries.push({ i: p.i, kind: "figure", text, heads });
    else if (!text || p.style === S.codeLabel) continue;
    else if (p.style === S.figCaption || isCaptionText(text)) entries.push({ i: p.i, kind: "caption", text, heads });
    else entries.push({ i: p.i, kind: p.list ? "item" : "p", text, heads });
  }
  return entries;
}

module.exports = function text(d, r) {
  const core = loadCore();
  const profile = core.loadProfile(d.workType === "Практическая" && fs.existsSync(PRACTICE) ? PRACTICE : PROFILE);
  for (const x of core.check(toEntries(d), profile)) (x.level === "error" ? r.err : r.warn)(x.id, x.msg);
};

module.exports.toEntries = toEntries;
