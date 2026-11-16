#!/usr/bin/env node
// Raw facts about the student's actual work, to ground the report text: git history,
// dependencies, installed tools, a code inventory (files, declared names, colours,
// sizes, UI strings) and the lab's notes.md. Prints compact markdown.
//
//   node facts.js reports/<lab> [--project <dir>]     (project defaults to the repo root)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { findRepoRoot } = require("../lib/meta");
const { collectVersions } = require("./versions");

const SKIP_DIRS = new Set([
  "node_modules", "reports", "android", "ios", "build", "dist", "bin", "obj", "out",
  "vendor", "Pods", "__tests__", "__pycache__", "coverage",
]);
const CODE_EXT = /\.(tsx?|jsx?|html?|css|scss|sql|py|java|kt|cs|cpp|c|h|php|go|rs|swift|dart|vue)$/i;
const BOILERPLATE = /^(babel|metro|jest|webpack|vite|tsconfig|eslint|prettier|postcss|tailwind)[.\w-]*$/i;
const MAX_FILES = 60;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full, out);
    } else if (CODE_EXT.test(e.name) && !BOILERPLATE.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

const uniq = (arr, n) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))].slice(0, n);
const all = (src, re, pick = (m) => m[1]) => [...src.matchAll(re)].map(pick);

function inventory(file) {
  const src = fs.readFileSync(file, "utf8");
  return {
    lines: src.split(/\r?\n/).length,
    names: uniq([
      ...all(src, /\b(?:function|class|interface|def)\s+([A-Za-z_]\w*)/g),
      ...all(src, /\bconst\s+([A-Z]\w*)\s*=\s*(?:\(|React\.memo|styled|create)/g),
      ...all(src, /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[]?(\w+)/gi, (m) => `table ${m[1]}`),
      ...all(src, /<title>([^<]{1,60})<\/title>/gi, (m) => `title «${m[1].trim()}»`),
    ], 8),
    colors: uniq(src.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]{5,30}\)/g) || [], 8),
    sizes: uniq(all(src, /\b(width|height|fontSize|font-size|borderRadius|border-radius|padding|margin)\s*:\s*['"]?(\d+(?:\.\d+)?)(px|%|em|rem)?/g,
      (m) => `${m[1]} ${m[2]}${m[3] || ""}`), 8),
    strings: uniq([
      ...all(src, /\b(?:title|label|placeholder)\s*[:=]\s*["'`]([^"'`\n]{2,40})["'`]/g),
      ...all(src, />([^<>{}\n]{3,40})<\//g),
    ], 6).map((s) => `«${s}»`),
  };
}

function gitLog(project) {
  try {
    const out = execFileSync("git", ["-C", project, "log", "--date=short", "--pretty=format:%ad %s", "-n", "40"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return out ? out.split(/\r?\n/) : [];
  } catch {
    return [];
  }
}

function dependencies(project) {
  const file = path.join(project, "package.json");
  if (!fs.existsSync(file)) return [];
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const dev = Object.entries(j.devDependencies || {}).filter(([n]) => /^(typescript|@react-native-community\/cli|vite|webpack|jest)$/.test(n));
  return [...Object.entries(j.dependencies || {}), ...dev].map(([n, v]) => `${n} ${v}`);
}

function manifests(project) {
  return fs.readdirSync(project).filter((f) => /^(requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle(\.kts)?|.*\.csproj|.*\.sln|composer\.json|go\.mod|Cargo\.toml)$/.test(f));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const pi = args.indexOf("--project");
  const projectArg = pi >= 0 ? args.splice(pi, 2)[1] : null;
  const reportDir = args[0] ? path.resolve(args[0]) : null;
  const project = path.resolve(projectArg || findRepoRoot(reportDir || "."));
  const out = [];

  const log = gitLog(project);
  if (log.length) out.push(`## Git — ${log.length} коммит(ов), ${log[log.length - 1].slice(0, 10)} … ${log[0].slice(0, 10)}`, ...log.map((l) => `- ${l}`), "");

  const deps = dependencies(project);
  const other = manifests(project);
  if (deps.length || other.length) {
    out.push("## Зависимости");
    if (deps.length) out.push(deps.join(", "));
    if (other.length) out.push(`манифесты: ${other.join(", ")}`);
    out.push("");
  }

  const tools = collectVersions();
  if (Object.keys(tools).length) out.push("## Инструменты", ...Object.entries(tools).map(([k, v]) => `- ${k}: ${v}`), "");

  const files = walk(project);
  if (files.length) {
    const inv = files.slice(0, MAX_FILES).map((f) => [path.relative(project, f).replace(/\\/g, "/"), inventory(f)]);
    const total = inv.reduce((a, [, i]) => a + i.lines, 0);
    out.push(`## Код — ${files.length} файл(ов)${files.length > MAX_FILES ? `, показаны первые ${MAX_FILES}` : ""}, ${total} строк`);
    for (const [rel, i] of inv) {
      const parts = [
        i.names.join(", "),
        i.colors.length && `цвета ${i.colors.join(" ")}`,
        i.sizes.length && i.sizes.join(", "),
        i.strings.length && `тексты ${i.strings.join(" ")}`,
      ].filter(Boolean);
      out.push(`- ${rel} (${i.lines} стр.)${parts.length ? ": " + parts.join("; ") : ""}`);
    }
    out.push("");
  }

  const notes = reportDir && path.join(reportDir, "notes.md");
  out.push("## Заметки", notes && fs.existsSync(notes)
    ? fs.readFileSync(notes, "utf8").trim()
    : "notes.md нет — задайте вопросы из references/intake.md → I8 и сохраните ответы");

  console.log(out.join("\n"));
}

module.exports = { inventory, gitLog, dependencies };
