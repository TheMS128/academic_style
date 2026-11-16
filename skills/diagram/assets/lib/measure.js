// Reads the geometry of an SVG as the browser lays it out: every visible shape, line and
// text in the coordinates of the viewBox. The SVG is opened in headless Edge, so
// transforms, curves and the real width of a text are the browser's, not an estimate.
//
//   measure(svgFile) → { viewBox: [x, y, w, h], items: [...] }
//   item: { tag, kind: "shape" | "line" | "text", pts: [[x, y], …], closed, filled,
//           dashed, sw, text, font }

const fs = require("fs");
const os = require("os");
const path = require("path");
const { runEdge } = require("./edge");

// runs inside the page
function collect() {
  const svg = document.querySelector("svg");
  const out = { viewBox: null, items: [] };
  const vb = svg.viewBox.baseVal;
  const box = svg.getBoundingClientRect();
  out.viewBox = vb && vb.width ? [vb.x, vb.y, vb.width, vb.height] : [0, 0, box.width, box.height];
  const inv = svg.getScreenCTM().inverse();
  const skip = "defs,marker,clipPath,mask,pattern,symbol,title,desc,metadata,style,script";
  for (const el of svg.querySelectorAll("rect,circle,ellipse,polygon,polyline,line,path,text,image")) {
    if (el.closest(skip)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const m = inv.multiply(el.getScreenCTM());
    const at = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(m); return [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100]; };
    const scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    const tag = el.tagName.toLowerCase();
    if (tag === "text" || tag === "image") {
      let b;
      try { b = el.getBBox(); } catch (e) { continue; }
      const text = tag === "text" ? el.textContent.replace(/\s+/g, " ").trim() : "";
      if (tag === "text" && !text) continue;
      out.items.push({
        tag, kind: tag === "text" ? "text" : "shape", closed: true, filled: tag === "image", text,
        font: tag === "text" ? parseFloat(cs.fontSize) * scale : 0, sw: 0, dashed: false,
        pts: [at(b.x, b.y), at(b.x + b.width, b.y), at(b.x + b.width, b.y + b.height), at(b.x, b.y + b.height)],
      });
      continue;
    }
    const stroked = cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0 && +cs.strokeOpacity !== 0;
    const filled = cs.fill !== "none" && +cs.fillOpacity !== 0;
    if (!stroked && !filled) continue;
    let len = 0;
    try { len = el.getTotalLength(); } catch (e) { continue; }
    if (!len) continue;
    const n = Math.max(2, Math.min(600, Math.ceil((len * scale) / 2)));
    const pts = [];
    for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((len * i) / n); pts.push(at(p.x, p.y)); }
    const first = pts[0], last = pts[pts.length - 1];
    const d = tag === "path" ? el.getAttribute("d") || "" : "";
    const closed = ["rect", "circle", "ellipse", "polygon"].includes(tag) || /z\s*$/i.test(d) ||
      (pts.length > 3 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.5);
    out.items.push({
      tag, kind: closed ? "shape" : "line", closed, filled, text: "", font: 0,
      sw: stroked ? parseFloat(cs.strokeWidth) * scale : 0, dashed: cs.strokeDasharray !== "none",
      white: filled && /^rgba?\(255, 255, 255/.test(cs.fill), stroked, pts,
    });
  }
  return out;
}

function measure(svgFile) {
  const svg = fs.readFileSync(svgFile, "utf8").replace(/<\?xml[^>]*\?>/, "").replace(/<!DOCTYPE[^>]*>/i, "");
  if (!/<svg[\s>]/.test(svg)) throw new Error(`${svgFile}: это не SVG`);
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<pre id="report" style="display:none">pending</pre>${svg}
<script>
try { document.getElementById("report").textContent = JSON.stringify((${collect.toString()})()); }
catch (e) { document.getElementById("report").textContent = "ERR " + e.message; }
</script>`;
  const file = path.join(os.tmpdir(), `diagram-measure-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(file, html);
  try {
    const dom = runEdge(["--allow-file-access-from-files", "--virtual-time-budget=8000", "--dump-dom", file], { timeout: 120000, maxBuffer: 1 << 30 }).toString();
    const raw = ((dom.match(/<pre id="report"[^>]*>([\s\S]*?)<\/pre>/) || [])[1] || "нет отчёта")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    if (!raw.startsWith("{")) throw new Error("браузер не разобрал SVG: " + raw.slice(0, 200));
    return JSON.parse(raw);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

module.exports = { measure };
