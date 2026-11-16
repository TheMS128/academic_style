#!/usr/bin/env node
// SVG → PNG for a document, through headless Edge. The picture is rendered on white at a
// width of 1600 px or more, so it stays sharp at the width of a page.
//
//   node render.js <diagram.svg> [out.png] [--width 1600]
//
// The PNG is written next to the SVG when no output is given.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");
const { runEdge } = require("../lib/edge");
const { measure } = require("../lib/measure");

const args = process.argv.slice(2);
const wi = args.indexOf("--width");
const want = wi >= 0 ? +args.splice(wi, 2)[1] : 1600;
const [src, outArg] = args;
if (!src) { console.error("usage: node render.js <diagram.svg> [out.png] [--width 1600]"); process.exit(2); }

try {
  const svgFile = path.resolve(src);
  const out = outArg ? path.resolve(outArg) : svgFile.replace(/\.svg$/i, "") + ".png";
  const [, , vw, vh] = measure(svgFile).viewBox;
  // Edge keeps a window at least 500 px wide: narrower pictures are drawn larger instead
  const width = Math.max(want, 500), height = Math.ceil((width * vh) / vw);
  const svg = fs.readFileSync(svgFile, "utf8").replace(/<\?xml[^>]*\?>/, "").replace(/<!DOCTYPE[^>]*>/i, "")
    .replace(/<svg\b([^>]*)>/, (m, attrs) => `<svg${attrs.replace(/\s(?:width|height)="[^"]*"/g, "")} width="${width}" height="${height}" style="display:block">`);
  const html = path.join(os.tmpdir(), `diagram-render-${process.pid}.html`);
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff;overflow:hidden">${svg}`);
  try {
    fs.rmSync(out, { force: true });
    runEdge(["--hide-scrollbars", "--force-device-scale-factor=1", `--window-size=${width},${height}`, `--screenshot=${out}`, pathToFileURL(html).href], { stdio: "ignore", timeout: 120000 });
  } finally {
    fs.rmSync(html, { force: true });
  }
  if (!fs.existsSync(out)) throw new Error(`Edge не записал ${out}`);
  const png = fs.readFileSync(out);
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  console.log(`${path.basename(out)}: ${w} × ${h} px`);
  if (w !== width || h !== height) { console.error(`ОШИБКА: ожидался размер ${width} × ${height} — снимок обрезан или дополнен, рисунок использовать нельзя`); process.exitCode = 1; }
} catch (e) {
  console.error("ОШИБКА: " + e.message);
  process.exit(1);
}
