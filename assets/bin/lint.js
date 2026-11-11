#!/usr/bin/env node
// node lint.js <text.md | text.txt | -> [--profile <profile.json>]
// node lint.js --check-profile <profile.json>
// «-» reads the text from stdin. With no --profile the general academic genre applies
// (profiles/general.json). Exit code: 1 — there is an «ОШИБКА», 2 — bad call or profile.

const fs = require("fs");
const { lintText, formatProblem, loadProfile, validateProfile } = require("../lint");

const fail = (msg) => { console.error(msg); process.exit(2); };
const args = process.argv.slice(2);
const take = (flag) => {
  const at = args.indexOf(flag);
  if (at < 0) return null;
  const [, value] = args.splice(at, 2);
  if (!value) fail(`${flag}: нужен путь к профилю`);
  return value;
};

const readProfile = (file) => {
  let profile;
  try { profile = loadProfile(file); } catch (e) { fail(`профиль ${file}: ${e.message}`); }
  const bad = validateProfile(profile);
  if (bad.length) fail(`профиль ${file} не принят:\n  ${bad.join("\n  ")}`);
  return profile;
};

const only = take("--check-profile");
if (only) {
  const profile = readProfile(only);
  console.log(`профиль «${profile.genre}» принят`);
  process.exit(0);
}

const profilePath = take("--profile");
const file = args[0];
if (!file) fail("usage: node lint.js <text.md | -> [--profile <profile.json>]\n       node lint.js --check-profile <profile.json>");

const profile = profilePath ? readProfile(profilePath) : undefined;
const problems = lintText(fs.readFileSync(file === "-" ? 0 : file, "utf8"), profile);

if (!problems.length) console.log("lint: замечаний нет");
for (const x of problems) console.log(formatProblem(x));
process.exit(problems.some((x) => x.level === "error") ? 1 : 0);
