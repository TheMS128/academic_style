// Finds what lies on top of what in a measured diagram (measure.js): arrows on arrows,
// arrows through boxes, boxes on boxes, text on text and on lines. Every problem carries
// the id of its rule in references/drawing.md (C1–C8) and the place on the picture.
//
//   analyse(measured, { lifelines }) → { problems, nodes, edges, texts, font }

const bboxOf = (pts) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
};
const inBox = (b, [x, y], pad = 0) => x >= b.x0 - pad && x <= b.x1 + pad && y >= b.y0 - pad && y <= b.y1 + pad;
const boxInBox = (a, b, pad = 0.5) => a.x0 >= b.x0 - pad && a.y0 >= b.y0 - pad && a.x1 <= b.x1 + pad && a.y1 <= b.y1 + pad;
const boxesMeet = (a, b, pad = 0) => a.x0 <= b.x1 + pad && b.x0 <= a.x1 + pad && a.y0 <= b.y1 + pad && b.y0 <= a.y1 + pad;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function distToSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function distToLine(p, pts, closed) {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) d = Math.min(d, distToSeg(p, pts[i - 1], pts[i]));
  if (closed && pts.length > 2) d = Math.min(d, distToSeg(p, pts[pts.length - 1], pts[0]));
  return d;
}
function inPolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Douglas–Peucker: the sampled curve as few segments
function simplify(pts, tol = 0.4) {
  if (pts.length < 3) return pts;
  let max = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = distToSeg(pts[i], pts[0], pts[pts.length - 1]); if (d > max) { max = d; at = i; } }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
}
function segCross(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    const t = d1 / (d1 - d2);
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  return null;
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const place = (p) => `(${Math.round(p[0])}, ${Math.round(p[1])})`;
const centre = (b) => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];

function analyse(measured, { lifelines = false } = {}) {
  const [vx, vy, vw, vh] = measured.viewBox;
  const vb = { x0: vx, y0: vy, x1: vx + vw, y1: vy + vh };
  const items = measured.items.map((it, i) => ({ ...it, i, box: bboxOf(it.pts) }));
  const texts = items.filter((it) => it.kind === "text");
  const F = median(texts.map((t) => t.font)) || vw / 45;
  const lines = items.filter((it) => it.kind === "line").map((l) => ({ ...l, simple: simplify(l.pts) }));

  // closed shapes: the background sheet goes, arrowheads go to their lines, the rest are nodes
  let shapes = items.filter((it) => it.kind === "shape" && it.box.w * it.box.h < 0.96 * vw * vh);
  const ends = lines.flatMap((l) => [l.pts[0], l.pts[l.pts.length - 1]]);
  const isHead = (s) => Math.max(s.box.w, s.box.h) <= 1.6 * F && ends.some((p) => inBox(s.box, p, 0.5 * F));
  const heads = shapes.filter(isHead);
  shapes = shapes.filter((s) => !heads.includes(s) && s.box.w > 1 && s.box.h > 1);
  const nodes = shapes.map((s) => ({ ...s, area: s.box.w * s.box.h, texts: [], children: [], parent: null }));
  for (const n of nodes) {
    const around = nodes.filter((m) => m !== n && m.area > n.area && boxInBox(n.box, m.box)).sort((a, b) => a.area - b.area)[0];
    if (around) { n.parent = around; around.children.push(n); }
  }
  const ancestors = (n) => { const a = []; for (let p = n && n.parent; p; p = p.parent) a.push(p); return a; };
  const innermost = (p) => nodes.filter((n) => inBox(n.box, p) && inPolygon(p, n.pts)).sort((a, b) => a.area - b.area)[0] || null;
  for (const t of texts) { t.owner = innermost(centre(t.box)); if (t.owner) t.owner.texts.push(t); }
  const nameOf = (n) => (n.texts.length ? `«${n.texts.slice().sort((a, b) => a.box.y0 - b.box.y0)[0].text.slice(0, 40)}»` : `фигура у ${place(centre(n.box))}`);

  // where a line ends: the node whose border is nearest, within the length of an arrowhead
  const reach = 1.2 * F;
  const attach = (p) => {
    let best = null, bd = reach;
    for (const n of nodes) { if (!inBox(n.box, p, reach)) continue; const d = distToLine(p, n.pts, true); if (d < bd || (d === bd && best && n.area < best.area)) { bd = d; best = n; } }
    return best;
  };
  for (const l of lines) {
    l.a = attach(l.pts[0]);
    l.b = attach(l.pts[l.pts.length - 1]);
    const home = l.a && l.a === l.b ? l.a : (!l.a && !l.b ? innermost(l.pts[0]) : null);
    // a separator inside a box, an underline — part of the node, not a connector
    l.decor = !!home && (home === innermost(l.pts[l.pts.length - 1]) || l.a === l.b) && l.pts.every((p) => inBox(home.box, p, 1)) && (l.a === l.b ? true : home.children.length === 0);
    l.free = !l.a && !l.b && !l.decor;
    l.vertical = l.simple.length === 2 && Math.abs(l.simple[0][0] - l.simple[1][0]) < 1;
    l.name = l.a && l.b ? `линия ${nameOf(l.a)} → ${nameOf(l.b)}` : l.a || l.b ? `линия у ${nameOf(l.a || l.b)}` : `линия у ${place(l.pts[Math.floor(l.pts.length / 2)])}`;
  }
  const edges = lines.filter((l) => !l.decor);

  const problems = [];
  const err = (id, msg, at) => problems.push({ level: "error", id, msg: `${msg} — у ${place(at)}`, at });
  const warn = (id, msg) => problems.push({ level: "warn", id, msg });

  // C1, C2 — a line on a line, a line across a line
  const r = 0.9 * F;
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const A = edges[i], B = edges[j];
    if (!boxesMeet(A.box, B.box, 2)) continue;
    const endsA = [A.pts[0], A.pts[A.pts.length - 1]], endsB = [B.pts[0], B.pts[B.pts.length - 1]];
    const sharedPort = (p) => endsA.some((e) => dist(e, p) < r) && endsB.some((e) => dist(e, p) < r);
    const near = Math.max(1.5, (A.sw + B.sw) / 2);
    const lenA = A.pts.reduce((s, p, k) => (k ? s + dist(p, A.pts[k - 1]) : 0), 0);
    const lying = A.pts.filter((p) => inBox(B.box, p, near) && !sharedPort(p) && distToLine(p, B.simple, false) < near);
    const lyingLen = (lying.length * lenA) / A.pts.length;
    if (lyingLen > Math.max(10, 1.2 * F)) {
      err("C1", `линии наложены друг на друга на длине около ${Math.round(lyingLen)}: ${A.name} и ${B.name}`, lying[Math.floor(lying.length / 2)]);
      continue;
    }
    if (lifelines && ((A.vertical && !B.vertical) || (B.vertical && !A.vertical))) continue;
    const hits = [];
    for (let a = 1; a < A.simple.length; a++) for (let b = 1; b < B.simple.length; b++) {
      const p = segCross(A.simple[a - 1], A.simple[a], B.simple[b - 1], B.simple[b]);
      if (!p || sharedPort(p)) continue;
      // a line that ends on another one joins it: a tree of connectors, not a crossing
      if (endsA.some((e) => dist(e, p) < near + 1) || endsB.some((e) => dist(e, p) < near + 1)) continue;
      if (!hits.some((h) => dist(h, p) < F)) hits.push(p);
    }
    for (const p of hits) err("C2", `линии пересекаются: ${A.name} и ${B.name}`, p);
  }

  // C3 — a line through a box it does not belong to
  for (const E of edges) for (const N of nodes) {
    if (N === E.a || N === E.b || !boxesMeet(E.box, N.box)) continue;
    const p0 = E.pts[0], p1 = E.pts[E.pts.length - 1];
    if (inPolygon(p0, N.pts) || inPolygon(p1, N.pts)) continue;                      // starts or ends inside: a group it lives in
    if ([E.a, E.b].some((n) => n && ancestors(n).includes(N))) continue;               // leaves or enters its own group
    const deep = Math.max(2, E.sw + 1);
    const inside = E.pts.filter((p) => inBox(N.box, p) && inPolygon(p, N.pts) && distToLine(p, N.pts, true) > deep);
    if (inside.length >= 2) err("C3", `${E.name} проходит через ${nameOf(N)}`, inside[Math.floor(inside.length / 2)]);
  }

  // C4 — a box on a box (one inside another is a group, not an overlap)
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const A = nodes[i], B = nodes[j];
    if (!boxesMeet(A.box, B.box) || ancestors(A).includes(B) || ancestors(B).includes(A)) continue;
    const deepIn = (X, Y) => X.pts.filter((p) => inBox(Y.box, p) && inPolygon(p, Y.pts) && distToLine(p, Y.pts, true) > 2);
    const ab = deepIn(A, B), ba = deepIn(B, A);
    if (ab.length === A.pts.length || ba.length === B.pts.length) continue;           // fully inside a non-rectangular group
    const hit = ab.length >= 2 ? ab : ba.length >= 2 ? ba : null;
    if (hit) err("C4", `фигуры наложены друг на друга: ${nameOf(A)} и ${nameOf(B)}`, hit[Math.floor(hit.length / 2)]);
  }

  // C5 — text on text
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i].box, b = texts[j].box;
    const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if (w > 1 && h > 1 && w * h > 0.1 * Math.min(a.w * a.h, b.w * b.h))
      err("C5", `надписи наложены друг на друга: «${texts[i].text.slice(0, 30)}» и «${texts[j].text.slice(0, 30)}»`, [Math.max(a.x0, b.x0) + w / 2, Math.max(a.y0, b.y0) + h / 2]);
  }

  // C6 — a line or a border across a text
  for (const t of texts) {
    const b = t.box, px = b.w * 0.06, py = b.h * 0.18;
    const core = { x0: b.x0 + px, y0: b.y0 + py, x1: b.x1 - px, y1: b.y1 - py };
    const E = lines.find((l) => boxesMeet(l.box, core) && l.pts.some((p) => inBox(core, p)));
    if (E) err("C6", `${E.name} проходит по надписи «${t.text.slice(0, 30)}»`, centre(b));
    const N = nodes.find((n) => boxesMeet(n.box, core) && n.pts.some((p) => inBox(core, p)));
    if (N) err("C6", `надпись «${t.text.slice(0, 30)}» не помещается: её пересекает рамка ${nameOf(N)}`, centre(b));
  }

  // C7 — everything is inside the sheet
  for (const it of [...nodes, ...edges, ...texts])
    if (!boxInBox(it.box, vb, 1)) err("C7", `${it.kind === "text" ? `надпись «${it.text.slice(0, 30)}»` : it.kind === "line" ? it.name : nameOf(it)} выходит за край рисунка`, centre(it.box));

  // C8 — legible at the width of a page
  const small = texts.filter((t) => (t.font * 160) / vw < 2.4).sort((a, b) => a.font - b.font)[0];
  if (small) warn("C8", `текст мелок: «${small.text.slice(0, 30)}» при ширине рисунка 16 см выйдет высотой ${((small.font * 160) / vw).toFixed(1)} мм — нужно не меньше 2,4 мм (около 7 пт)`);

  return { problems, nodes, edges, texts, font: F, nameOf };
}

module.exports = { analyse };
