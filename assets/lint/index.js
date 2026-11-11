// Checks a text against the core rules. Every problem carries the id of the rule it
// enforces (V — writing.md, L — layout.md, T — tells.md), so a fix starts from that one
// rule. Errors first.
//
//   lintText(src, profile)   — a draft in the format of SKILL.md, or plain text
//   check(entries, profile)  — the model of util.js, for a genre skill that parses its
//                              own document

const { parseText } = require("./parse");
const { compile } = require("./util");

const CHECKS = [require("./writing"), require("./layout")];

// With no profile the text is a general academic one (profile.md → The default genre).
const DEFAULT_PROFILE = { genre: "академический текст", off: [{ rule: "V2", why: "определения допустимы" }] };

function check(entries, profile = DEFAULT_PROFILE) {
  const { isVerbatim, silent } = compile(profile);
  const body = entries.map((p, i) => ({ heads: [], ...p, i: p.i ?? i }));
  // the author's own text: paragraphs and list items outside the verbatim sections
  const own = body.filter((p) => (p.kind === "p" || p.kind === "item") && p.text.trim() && !isVerbatim(p));
  const problems = [];
  const add = (level) => (id, msg, p) => { if (!silent(id, p)) problems.push({ level, id, msg }); };
  const r = { err: add("error"), warn: add("warn"), silent };
  for (const run of CHECKS) run({ body, own, isVerbatim }, r);
  return problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}

const lintText = (src, profile) => check(parseText(src), profile);
const formatProblem = (x) => `${x.level === "error" ? "ОШИБКА" : "замечание"} [${x.id}]: ${x.msg}`;

module.exports = { lintText, check, parseText, formatProblem, DEFAULT_PROFILE };
