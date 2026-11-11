// node test/run.js — the lint against its fixtures. No test framework: plain asserts.

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { lintText, formatProblem, loadProfile, validateProfile, GENERAL } = require("../lint");

const file = (name) => path.join(__dirname, name);
const read = (name) => fs.readFileSync(file(name), "utf8");
const ids = (problems) => [...new Set(problems.map((x) => x.id))].sort();
const show = (problems) => problems.map(formatProblem).join("\n");
const has = (problems, id, text = "") => problems.some((x) => x.id === id && x.msg.includes(text));

// 1. a text that breaks the rules: each of these ids must be reported
const bad = lintText(read("bad.md"));
for (const id of ["F4", "T1", "T2", "T5", "T9", "T17", "T18", "T23", "T27", "V4", "V5", "L1", "L2", "L3", "L5"])
  assert(has(bad, id), `bad.md: ожидалось [${id}]\n${show(bad)}`);

// 2. a clean text under a genre profile: verbatim and exempt sections stay silent
const profile = loadProfile(file("profile.json"));
const good = lintText(read("good.md"), profile);
assert.deepStrictEqual(good, [], `good.md с профилем: замечаний быть не должно\n${show(good)}`);

// 3. the same text with every switch removed: the definitions and the glossary are reported
const strict = lintText(read("good.md"), { genre: "строгий", reader: "тест" });
for (const id of ["V2", "L2", "L3"]) assert(has(strict, id), `good.md без исключений: ожидалось [${id}]\n${show(strict)}`);

// 4. the general genre (no profile passed) is profiles/general.json
assert.deepStrictEqual(validateProfile(loadProfile(GENERAL)), [], "profiles/general.json должен проходить проверку");
assert(!has(lintText(read("good.md")), "V2"), "общий жанр: V2 выключено");
const general = lintText(read("general.md"));
assert(has(general, "T28", "многие исследователи"), `general.md: размытая атрибуция\n${show(general)}`);
assert(has(general, "T4", "стремительным развитием"), `general.md: пустая актуальность\n${show(general)}`);
// one hedge in a paragraph is within the budget, two are over it
assert.strictEqual(general.filter((x) => x.id === "T6").length, 1, `general.md: T6 ровно один раз — за абзац с двумя оговорками\n${show(general)}`);
assert(has(general, "T6", "×2"), `general.md: две оговорки в абзаце\n${show(general)}`);
// «таким образом» twice in one section
assert(has(general, "T2", "«таким образом» ×2"), `general.md: «таким образом» дважды в разделе\n${show(general)}`);

// 5. the same phrases under a profile with no limits: every hedge is reported
const noLimits = lintText(read("general.md"), { genre: "без лимитов", reader: "тест" });
assert(noLimits.filter((x) => x.id === "T6").length >= 3, `без лимитов каждая оговорка — замечание\n${show(noLimits)}`);

// 6. extends: the child adds to the parent's lists and replaces its plain fields
const child = loadProfile(file("child.json"));
assert.strictEqual(child.genre, "отчёт по практической работе (тестовый профиль)");
assert.strictEqual(child.verbatim.length, profile.verbatim.length);
assert.deepStrictEqual(child.off.map((o) => o.rule), ["T27"]);
assert.deepStrictEqual(lintText(read("good.md"), child), []);

// 7. a profile that is not accepted
const refused = validateProfile({
  genre: "плохой", reader: "тест", colour: "red",
  exempt: [{ rule: "V99", section: "(", why: "" }],
  off: [{ rule: "S3", why: "чужое правило" }],
  limits: [{ rule: "T6", phrases: [], max: -1, per: "page", why: "x" }],
});
for (const text of ["неизвестное поле «colour»"]) assert(refused.some((m) => m.includes(text)), refused.join("\n"));
const full = validateProfile({
  genre: "плохой", reader: "тест",
  exempt: [{ rule: "V99", section: "(", why: "" }],
  off: [{ rule: "S3", why: "чужое правило" }],
  limits: [{ rule: "T6", phrases: [], max: -1, per: "page", why: "x" }],
});
for (const text of ["нет правила «V99»", "не регулярное выражение", "нет поля why", "нет правила «S3»", "phrases", "max", "per"])
  assert(full.some((m) => m.includes(text)), `ожидалось «${text}» в:\n${full.join("\n")}`);
assert.throws(() => lintText("Текст.", { genre: "x", reader: "y", off: [{ rule: "V2" }] }), /не принят/);

console.log(`ok — bad.md: ${bad.length} замечаний [${ids(bad).join(", ")}]; general.md: [${ids(general).join(", ")}]`);
