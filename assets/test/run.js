// node test/run.js — the lint against two fixtures. No test framework: plain asserts.

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { lintText, formatProblem } = require("../lint");

const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");
const profile = JSON.parse(read("profile.json"));
const ids = (problems) => [...new Set(problems.map((x) => x.id))].sort();
const show = (problems) => problems.map(formatProblem).join("\n");

// a text that breaks the rules: each of these ids must be reported
const bad = lintText(read("bad.md"));
for (const id of ["T1", "T2", "T5", "T9", "T17", "T18", "T23", "T27", "V4", "V5", "L2", "L3", "L5"])
  assert(ids(bad).includes(id), `bad.md: ожидалось [${id}]\n${show(bad)}`);

// a clean text under a genre profile: verbatim and exempt sections stay silent
const good = lintText(read("good.md"), profile);
assert.deepStrictEqual(good, [], `good.md с профилем: замечаний быть не должно\n${show(good)}`);

// the same text with every switch removed: the definitions and the glossary are reported
const strict = lintText(read("good.md"), { verbatim: [], exempt: [], off: [] });
assert(ids(strict).includes("V2"), `good.md без исключений: ожидалось [V2]\n${show(strict)}`);
assert(ids(strict).includes("L3"), `good.md без исключений: ожидалось [L3]\n${show(strict)}`);

// the default genre allows definitions
assert(!ids(lintText(read("good.md"))).includes("V2"), "жанр по умолчанию: V2 выключено");

console.log(`ok — bad.md: ${bad.length} замечаний [${ids(bad).join(", ")}]`);
