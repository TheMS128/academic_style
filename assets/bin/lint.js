#!/usr/bin/env node
// node lint.js <text.md | text.txt | -> [--profile <profile.json>]
// «-» reads the text from stdin. Exit code 1 when there is an «ОШИБКА».

const fs = require("fs");
const { lintText, formatProblem } = require("../lint");

const args = process.argv.slice(2);
const at = args.indexOf("--profile");
const profilePath = at >= 0 ? args.splice(at, 2)[1] : null;
const file = args[0];

if (!file || (at >= 0 && !profilePath)) {
  console.error("usage: node lint.js <text.md | - > [--profile <profile.json>]");
  process.exit(2);
}

const profile = profilePath ? JSON.parse(fs.readFileSync(profilePath, "utf8")) : undefined;
const src = fs.readFileSync(file === "-" ? 0 : file, "utf8");
const problems = lintText(src, profile);

if (!problems.length) console.log("lint: замечаний нет");
for (const x of problems) console.log(formatProblem(x));
process.exit(problems.some((x) => x.level === "error") ? 1 : 0);
