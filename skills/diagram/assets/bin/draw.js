#!/usr/bin/env node
// Draws a scheme from its description (references/drawing.md → C10) and writes the SVG.
//
//   node draw.js <scheme.js | scheme.json> [out.svg]
//
// The description is a module that exports the spec object, or a JSON file with it. The
// SVG is written next to the description when no output is given. Check it afterwards:
// node check.js <out.svg>.

const fs = require("fs");
const path = require("path");
const { draw } = require("../lib/draw");

const [src, outArg] = process.argv.slice(2);
if (!src) { console.error("usage: node draw.js <scheme.js | scheme.json> [out.svg]"); process.exit(2); }
const file = path.resolve(src);
try {
  const spec = /\.json$/i.test(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : require(file);
  const { svg, width, height } = draw(spec);
  const out = outArg ? path.resolve(outArg) : file.replace(/\.(js|json)$/i, "") + ".svg";
  fs.writeFileSync(out, svg);
  console.log(`${path.basename(out)}: ${Math.round(width)} × ${Math.round(height)}, узлов ${(spec.nodes || []).length}, связей ${(spec.edges || []).length}`);
} catch (e) {
  console.error("ОШИБКА: " + e.message);
  process.exit(1);
}
