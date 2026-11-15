// Draws a box-and-arrow scheme from a short description: nodes stand in the cells of a
// grid, connectors run along horizontal and vertical segments. The picture is black on
// white, sized to be read at the width of a page. The description holds no coordinates:
// what lies on what is found afterwards by check.js, and fixed by moving a node to
// another cell or choosing another route.
//
//   draw(spec) → SVG text.   The spec is described in references/drawing.md (C10).

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// approximate advance widths of Times New Roman, em — a little generous, so text fits
function widthEm(text) {
  let w = 0;
  for (const ch of text) {
    if (/[а-яё]/.test(ch)) w += 0.52;
    else if (/[a-z]/.test(ch)) w += 0.48;
    else if (/[А-ЯЁA-Z]/.test(ch)) w += 0.72;
    else if (/\d/.test(ch)) w += 0.5;
    else if (ch === " ") w += 0.27;
    else if (/[.,:;!'’|]/.test(ch)) w += 0.3;
    else w += 0.58;
  }
  return w;
}
function wrap(text, maxEm) {
  const out = [];
  for (const part of String(text).split("\n")) {
    let line = "";
    for (const word of part.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && widthEm(next) > maxEm) { out.push(line); line = word; } else line = next;
    }
    out.push(line);
  }
  return out;
}

const SIDES = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] };
const OPPOSITE = { left: "right", right: "left", top: "bottom", bottom: "top" };

function draw(spec) {
  const F = spec.font || 20;
  const sw = +(F / 12).toFixed(2);
  const lineH = 1.25 * F, padX = 0.8 * F, padY = 0.6 * F;
  const maxText = (spec.maxWidth || 11 * F) / F;                 // em
  const gapX = spec.gapX || 4 * F, gapY = spec.gapY || 3.2 * F;
  const problems = [];

  // ---- nodes: size from the text
  const byId = new Map();
  const nodes = (spec.nodes || []).map((n) => {
    if (!n.id || !Array.isArray(n.at)) throw new Error(`узел без id или без клетки at: ${JSON.stringify(n).slice(0, 80)}`);
    if (byId.has(n.id)) throw new Error(`id «${n.id}» использован дважды`);
    const shape = n.shape || "box";
    const node = { ...n, shape, col: n.at[0], row: n.at[1] };
    if (shape === "class") {
      node.title = wrap(n.text, maxText * 1.4);
      node.parts = [n.fields || [], n.methods || []].filter((p) => p.length);   // an empty compartment is not drawn
      const longest = Math.max(...node.title.map(widthEm), ...node.parts.flat().map(widthEm), 6);
      node.w = longest * F + 2 * padX;
      node.h = node.title.length * lineH + 2 * padY * 0.7 + node.parts.reduce((s, p) => s + Math.max(1, p.length) * lineH + padY * 0.7, 0);
    } else {
      node.lines = wrap(n.text ?? "", maxText);
      const tw = Math.max(...node.lines.map(widthEm), 2) * F, th = node.lines.length * lineH;
      const k = { diamond: [1.9, 2.1], ellipse: [1.35, 1.5], plain: [1, 1] }[shape] || [1, 1];
      node.w = Math.max(tw * k[0] + 2 * padX, shape === "plain" ? 0 : 6 * F);
      node.h = th * k[1] + 2 * padY;
    }
    byId.set(n.id, node);
    return node;
  });
  const taken = new Map();
  for (const n of nodes) { const key = `${n.col},${n.row}`; if (taken.has(key)) throw new Error(`узлы «${taken.get(key)}» и «${n.id}» стоят в одной клетке ${key}`); taken.set(key, n.id); }

  // ---- grid: a column is as wide as its widest node, a row as tall as its tallest
  const cols = [...new Set(nodes.map((n) => n.col))].sort((a, b) => a - b), rows = [...new Set(nodes.map((n) => n.row))].sort((a, b) => a - b);
  const colW = new Map(cols.map((c) => [c, Math.max(...nodes.filter((n) => n.col === c).map((n) => n.w))]));
  const rowH = new Map(rows.map((r) => [r, Math.max(...nodes.filter((n) => n.row === r).map((n) => n.h))]));
  const colX = new Map(), rowY = new Map();
  // the gap between two columns is widened to hold the label of a connector that crosses it
  const idOf = new Map(nodes.map((n) => [n.id, n]));
  const gapAfter = (c) => Math.max(gapX, ...(spec.edges || []).filter((e) => e.text && idOf.get(e.from) && idOf.get(e.to)).map((e) => {
    const a = idOf.get(e.from), b = idOf.get(e.to), lo = Math.min(a.col, b.col), hi = Math.max(a.col, b.col);
    return a.row === b.row && lo === c && cols[cols.indexOf(c) + 1] === hi ? widthEm(e.text) * 0.9 * F + 2.4 * F : 0;
  }));
  let x = 0; for (const c of cols) { colX.set(c, x + colW.get(c) / 2); x += colW.get(c) + gapAfter(c); }
  let y = 0; for (const r of rows) { rowY.set(r, y + rowH.get(r) / 2); y += rowH.get(r) + gapY; }
  for (const n of nodes) {
    n.cx = colX.get(n.col); n.cy = rowY.get(n.row);
    if (n.shape !== "class" && n.shape !== "plain" && spec.equalWidth !== false) n.w = Math.max(n.w, Math.min(colW.get(n.col), n.w * 1.6));
    n.x0 = n.cx - n.w / 2; n.x1 = n.cx + n.w / 2; n.y0 = n.cy - n.h / 2; n.y1 = n.cy + n.h / 2;
  }

  // ---- connectors: sides, then a slot on each side, then the route
  const edges = (spec.edges || []).map((e) => {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) throw new Error(`связь ${e.from} → ${e.to}: узла с таким id нет`);
    if (a === b) throw new Error(`связь ${e.from} → ${e.to}: петля на себя не поддерживается`);
    const dx = Math.sign(b.col - a.col), dy = Math.sign(b.row - a.row);
    let route = e.route || (dy === 0 || dx === 0 ? "straight" : "hv");
    const H = dx > 0 ? "right" : "left", V = dy > 0 ? "bottom" : "top";
    let fromSide, toSide;
    if (route === "straight") { fromSide = dy === 0 ? H : V; toSide = OPPOSITE[fromSide]; }
    else if (route === "hv") { fromSide = H; toSide = OPPOSITE[V]; }
    else if (route === "vh") { fromSide = V; toSide = OPPOSITE[H]; }
    else if (route === "z") { fromSide = H; toSide = OPPOSITE[H]; }
    else if (route === "zv") { fromSide = V; toSide = OPPOSITE[V]; }
    else throw new Error(`связь ${e.from} → ${e.to}: route «${route}» — нужно straight, hv, vh, z или zv`);
    return { ...e, a, b, route, fromSide: e.fromSide || fromSide, toSide: e.toSide || toSide };
  });
  // several connectors on one side of a node spread along it, in the order of their other ends
  const ports = new Map();
  for (const e of edges) for (const [node, side, other] of [[e.a, e.fromSide, e.b], [e.b, e.toSide, e.a]]) {
    const key = `${node.id}|${side}`;
    if (!ports.has(key)) ports.set(key, []);
    ports.get(key).push({ e, node, side, order: side === "left" || side === "right" ? other.cy : other.cx });
  }
  const point = new Map();
  for (const list of ports.values()) {
    list.sort((p, q) => p.order - q.order);
    list.forEach((p, i) => {
      const t = (i + 1) / (list.length + 1), n = p.node;
      const at = p.side === "left" ? [n.x0, n.y0 + n.h * t] : p.side === "right" ? [n.x1, n.y0 + n.h * t] : p.side === "top" ? [n.x0 + n.w * t, n.y0] : [n.x0 + n.w * t, n.y1];
      // a diamond and an ellipse touch their box only at the middle of a side
      if ((n.shape === "diamond" || n.shape === "ellipse") && list.length === 1) { at[0] = p.side === "left" ? n.x0 : p.side === "right" ? n.x1 : n.cx; at[1] = p.side === "top" ? n.y0 : p.side === "bottom" ? n.y1 : n.cy; }
      point.set(`${p.e.from}>${p.e.to}|${p.node.id}`, at);
    });
  }
  for (const e of edges) {
    const p = point.get(`${e.from}>${e.to}|${e.a.id}`), q = point.get(`${e.from}>${e.to}|${e.b.id}`);
    const fh = e.fromSide === "left" || e.fromSide === "right", th = e.toSide === "left" || e.toSide === "right";
    const shift = e.shift || 0;
    let pts;
    if (fh && th) { const mx = (p[0] + q[0]) / 2 + shift; pts = Math.abs(p[1] - q[1]) < 0.5 ? [p, q] : [p, [mx, p[1]], [mx, q[1]], q]; }
    else if (!fh && !th) { const my = (p[1] + q[1]) / 2 + shift; pts = Math.abs(p[0] - q[0]) < 0.5 ? [p, q] : [p, [p[0], my], [q[0], my], q]; }
    else if (fh) pts = [p, [q[0], p[1]], q];
    else pts = [p, [p[0], q[1]], q];
    e.pts = pts;
  }

  // ---- groups: a frame around its nodes, the caption inside its top-left corner
  const groups = (spec.groups || []).map((g) => {
    const inside = g.around.map((id) => byId.get(id) || (() => { throw new Error(`группа «${g.text}»: узла ${id} нет`); })());
    const pad = 0.9 * F;
    return { ...g, x0: Math.min(...inside.map((n) => n.x0)) - pad, y0: Math.min(...inside.map((n) => n.y0)) - pad - lineH, x1: Math.max(...inside.map((n) => n.x1)) + pad, y1: Math.max(...inside.map((n) => n.y1)) + pad };
  });

  // ---- SVG
  const out = [];
  const f = (v) => +v.toFixed(1);
  for (const g of groups) {
    out.push(`<rect x="${f(g.x0)}" y="${f(g.y0)}" width="${f(g.x1 - g.x0)}" height="${f(g.y1 - g.y0)}" fill="none" stroke="#000" stroke-width="${sw}" stroke-dasharray="${f(F * 0.4)} ${f(F * 0.25)}"/>`);
    out.push(`<text x="${f(g.x0 + 0.5 * F)}" y="${f(g.y0 + 1.05 * F)}" font-style="italic">${esc(g.text)}</text>`);
  }
  const textBlock = (lines, cx, top, opts = "") => lines.map((l, i) => `<text x="${f(cx)}" y="${f(top + lineH * (i + 0.5) + F * 0.33)}" ${opts}>${esc(l)}</text>`).join("");
  for (const n of nodes) {
    const box = `fill="#fff" stroke="#000" stroke-width="${sw}"`;
    if (n.shape === "box") out.push(`<rect x="${f(n.x0)}" y="${f(n.y0)}" width="${f(n.w)}" height="${f(n.h)}" ${box}/>`);
    else if (n.shape === "round") out.push(`<rect x="${f(n.x0)}" y="${f(n.y0)}" width="${f(n.w)}" height="${f(n.h)}" rx="${f(Math.min(n.h / 2, F * 0.9))}" ${box}/>`);
    else if (n.shape === "ellipse") out.push(`<ellipse cx="${f(n.cx)}" cy="${f(n.cy)}" rx="${f(n.w / 2)}" ry="${f(n.h / 2)}" ${box}/>`);
    else if (n.shape === "diamond") out.push(`<polygon points="${f(n.cx)},${f(n.y0)} ${f(n.x1)},${f(n.cy)} ${f(n.cx)},${f(n.y1)} ${f(n.x0)},${f(n.cy)}" ${box}/>`);
    else if (n.shape === "class") {
      out.push(`<rect x="${f(n.x0)}" y="${f(n.y0)}" width="${f(n.w)}" height="${f(n.h)}" ${box}/>`);
      let top = n.y0 + padY * 0.7;
      out.push(textBlock(n.title, n.cx, top, 'text-anchor="middle" font-weight="bold"'));
      top += n.title.length * lineH;
      for (const part of n.parts) {
        top += padY * 0.35;
        out.push(`<line x1="${f(n.x0)}" y1="${f(top)}" x2="${f(n.x1)}" y2="${f(top)}" stroke="#000" stroke-width="${sw}"/>`);
        top += padY * 0.35;
        out.push(textBlock(part, n.x0 + padX, top));
        top += Math.max(1, part.length) * lineH;
      }
      continue;
    } else if (n.shape !== "plain") throw new Error(`узел «${n.id}»: shape «${n.shape}» — нужно box, round, ellipse, diamond, class или plain`);
    out.push(textBlock(n.lines, n.cx, n.cy - (n.lines.length * lineH) / 2, 'text-anchor="middle"'));
  }
  const head = F * 0.6, half = F * 0.22;
  for (const e of edges) {
    const kind = e.kind || "arrow";
    const pts = e.pts.map((p) => [...p]);
    const tip = (end, big) => {                                   // returns the polygon of a head and shortens the line to its base
      const i = end === "to" ? pts.length - 1 : 0, j = end === "to" ? pts.length - 2 : 1;
      const [tx, ty] = pts[i], [px, py] = pts[j];
      const len = Math.hypot(tx - px, ty - py) || 1, ux = (tx - px) / len, uy = (ty - py) / len;
      const L = head * (big ? 1.25 : 1), W = half * (big ? 1.5 : 1);
      const base = [tx - ux * L, ty - uy * L];
      pts[i] = base;
      return { tipAt: [tx, ty], base, left: [base[0] - uy * W, base[1] + ux * W], right: [base[0] + uy * W, base[1] - ux * W], far: [tx - ux * 2 * L, ty - uy * 2 * L] };
    };
    const poly = (ps, fill) => `<polygon points="${ps.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="${fill}" stroke="#000" stroke-width="${sw}" stroke-linejoin="miter"/>`;
    const heads = [];
    if (kind === "arrow" || kind === "dashed" || kind === "both") { const t = tip("to"); heads.push(poly([t.tipAt, t.left, t.right], "#000")); }
    if (kind === "both") { const t = tip("from"); heads.push(poly([t.tipAt, t.left, t.right], "#000")); }
    if (kind === "inherit") { const t = tip("to", true); heads.push(poly([t.tipAt, t.left, t.right], "#fff")); }
    if (kind === "compose" || kind === "aggregate") {
      const t = tip("from"); const mid = t.base; pts[0] = t.far;
      heads.push(poly([t.tipAt, [mid[0] + (t.left[0] - mid[0]), mid[1] + (t.left[1] - mid[1])], t.far, t.right], kind === "compose" ? "#000" : "#fff"));
    }
    if (!["arrow", "dashed", "both", "inherit", "compose", "aggregate", "line"].includes(kind)) throw new Error(`связь ${e.from} → ${e.to}: kind «${kind}» неизвестен`);
    out.push(`<polyline points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="none" stroke="#000" stroke-width="${sw}"${kind === "dashed" || e.dashed ? ` stroke-dasharray="${f(F * 0.4)} ${f(F * 0.25)}"` : ""}/>`);
    out.push(...heads);
    if (e.text) {
      // the label sits beside the longest segment: above a horizontal one, to the right of a vertical one
      let best = 1, len = 0;
      for (let i = 1; i < e.pts.length; i++) { const l = Math.hypot(e.pts[i][0] - e.pts[i - 1][0], e.pts[i][1] - e.pts[i - 1][1]); if (l > len) { len = l; best = i; } }
      const [p, q] = [e.pts[best - 1], e.pts[best]];
      const mx = (p[0] + q[0]) / 2 + (e.labelOffset ? e.labelOffset[0] : 0), my = (p[1] + q[1]) / 2 + (e.labelOffset ? e.labelOffset[1] : 0);
      const horizontal = Math.abs(p[1] - q[1]) < 0.5;
      out.push(horizontal
        ? `<text x="${f(mx)}" y="${f(my - F * 0.45)}" text-anchor="middle" font-size="${f(F * 0.9)}">${esc(e.text)}</text>`
        : `<text x="${f(mx + F * 0.4)}" y="${f(my + F * 0.3)}" font-size="${f(F * 0.9)}">${esc(e.text)}</text>`);
    }
  }

  // ---- the sheet: tight around the drawing
  const xs = [...nodes.flatMap((n) => [n.x0, n.x1]), ...groups.flatMap((g) => [g.x0, g.x1]), ...edges.flatMap((e) => e.pts.map((p) => p[0]))];
  const ys = [...nodes.flatMap((n) => [n.y0, n.y1]), ...groups.flatMap((g) => [g.y0, g.y1]), ...edges.flatMap((e) => e.pts.map((p) => p[1]))];
  const labelRoom = edges.some((e) => e.text) ? 6 * F : 0;       // labels may stick out to the right
  const pad = 0.6 * F;
  const X0 = Math.min(...xs) - pad, Y0 = Math.min(...ys) - pad - (edges.some((e) => e.text) ? F : 0);
  const W = Math.max(...xs) + pad + labelRoom * 0 - X0, H = Math.max(...ys) + pad - Y0;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(X0)} ${f(Y0)} ${f(W)} ${f(H)}" width="${f(W)}" height="${f(H)}" font-family="Times New Roman, Times, serif" font-size="${F}" fill="#000">\n${out.join("\n")}\n</svg>\n`, problems, width: W, height: H };
}

module.exports = { draw };
