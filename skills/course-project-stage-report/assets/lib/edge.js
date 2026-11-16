const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

// install roots from the environment, not a fixed drive; per-user installs live in LOCALAPPDATA
const CANDIDATES = [process.env["ProgramFiles(x86)"], process.env.ProgramFiles, process.env.LOCALAPPDATA]
  .filter(Boolean)
  .map((root) => path.join(root, "Microsoft/Edge/Application/msedge.exe"));

function edgePath() {
  const found = CANDIDATES.find((c) => fs.existsSync(c));
  if (!found) throw new Error("Microsoft Edge не найден: " + (CANDIDATES.join(", ") || "нет ProgramFiles / LOCALAPPDATA в окружении"));
  return found;
}

// Headless Edge run. Edge 153 msedge.exe relaunches itself through a "compat layer"
// and exits 0 at once, so --dump-dom output and --screenshot never reach the caller;
// --edge-skip-compat-layer-relaunch keeps the browser in this process. A fresh
// profile per run keeps it independent of a running Edge and of parallel runs.
function runEdge(args, opts = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lab-report-edge-"));
  try {
    return execFileSync(edgePath(), [
      "--edge-skip-compat-layer-relaunch", "--headless=new", "--disable-gpu",
      "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`,
      ...args,
    ], opts);
  } finally {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

module.exports = { edgePath, runEdge };
