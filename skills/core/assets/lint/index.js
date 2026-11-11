// Checks a text against the core rules. Every problem carries the id of the rule it
// enforces (V — writing.md, L — layout.md, T — tells.md), so a fix starts from that one
// rule. Errors first.
//
//   lintText(src, profile)   — a draft in the format of SKILL.md, or plain text
//   check(entries, profile)  — the model of util.js, for a genre skill that parses its
//                              own document
//   loadProfile(file)        — reads a profile and resolves its «extends»
//
// With no profile the text is a general academic one: profiles/general.json.

const path = require("path");
const { parseText } = require("./parse");
const { compile, load, validate } = require("./profile");

const CHECKS = [require("./writing"), require("./layout"), require("./limits")];
const GENERAL = path.join(__dirname, "..", "..", "profiles", "general.json");

function check(entries, profile = load(GENERAL)) {
  const { isVerbatim, silent, limited, limits } = compile(profile);
  const body = entries.map((p, i) => ({ heads: [], ...p, i: p.i ?? i }));
  // the author's own text: paragraphs and list items outside the verbatim sections
  const own = body.filter((p) => (p.kind === "p" || p.kind === "item") && p.text.trim() && !isVerbatim(p));
  const problems = [];
  const add = (level) => (id, msg, p) => { if (!silent(id, p)) problems.push({ level, id, msg }); };
  const r = { err: add("error"), warn: add("warn"), silent, limited };
  for (const run of CHECKS) run({ body, own, isVerbatim, limits }, r);
  return problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}

const lintText = (src, profile) => check(parseText(src), profile);
const formatProblem = (x) => `${x.level === "error" ? "ОШИБКА" : "замечание"} [${x.id}]: ${x.msg}`;

module.exports = { lintText, check, parseText, formatProblem, loadProfile: load, validateProfile: validate, GENERAL };
