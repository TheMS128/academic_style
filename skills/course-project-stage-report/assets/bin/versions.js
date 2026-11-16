#!/usr/bin/env node
// Installed toolchain versions, for the sentence «При создании этой работы
// использовался …». Prints only what is found.
//
//   node versions.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { edgePath } = require("../lib/edge");

function sh(cmd) {
  try {
    const out = execSync(`${cmd} 2>&1`, { stdio: ["ignore", "pipe", "ignore"], timeout: 20000 }).toString().trim();
    return /not recognized|not found|was not found|No such file/i.test(out) ? null : out.split(/\r?\n/)[0];
  } catch {
    return null;
  }
}

function edge() {
  try {
    const dir = path.dirname(edgePath());
    const versions = fs.readdirSync(dir).filter((d) => /^\d+\.\d+\.\d+\.\d+$/.test(d));
    return versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop() || null;
  } catch {
    return null;
  }
}

function androidStudio() {
  const roots = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Android/Android Studio"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs/Android Studio"),
  ].filter(Boolean);
  for (const root of roots) {
    const info = path.join(root, "product-info.json");
    if (!fs.existsSync(info)) continue;
    const j = JSON.parse(fs.readFileSync(info, "utf8"));
    // "version" is the internal build id (AI-261.…); the release number is in dataDirectoryName
    const release = (j.dataDirectoryName || "").replace(/^AndroidStudio/, "") || j.version;
    return `${release} (build ${j.buildNumber})`;
  }
  return null;
}

function collectVersions() {
  const tools = {
    "Microsoft Edge": edge(),
    "Android Studio": androidStudio(),
    "Visual Studio Code": sh("code --version"),
    "Node.js": sh("node --version"),
    "Java": sh("java -version"),
    "Python": sh("python --version"),
    ".NET SDK": sh("dotnet --version"),
    "Git": sh("git --version"),
  };
  return Object.fromEntries(Object.entries(tools).filter(([, v]) => v));
}

if (require.main === module) {
  for (const [name, version] of Object.entries(collectVersions())) console.log(`${name}: ${version}`);
}

module.exports = { collectVersions };
