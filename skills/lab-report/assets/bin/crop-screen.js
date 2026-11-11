#!/usr/bin/env node
// Window screenshot -> PNG cropped to the used area. A screenshot of a maximized window
// (console, IDE, GUI app) is mostly empty background: the text occupies the top-left
// corner, and scaled into the page it would shrink to an unreadable strip. The crop
// keeps the top-left origin — title bar included — and cuts the right and bottom edges
// just past the last content pixel.
//
//   node crop-screen.js <file.png | dir> [...] [--pad 12] [--no-jitter]
//   node crop-screen.js <file.png> [...] --rect x,y,w,h [--no-jitter]
//
// Background is sampled per row at the right edge, so a light title bar over a dark
// console body both work. Overwrites the PNG in place and prints the new size.
// --rect cuts an exact rectangle instead — the area of a tall screenshot that the task
// needs, or an Android screen without its status and navigation bars.
// Not for diagrams and page renders — render.js crops those around a white margin.
//
// After the crop every side loses a random 0…N px, where N is the plain background
// between that edge and the first content pixel, minus a safety gap, capped at 15 —
// so no two screenshots carry the same margins, and the title text, the window icon or
// the last line of output are never touched. A 1–2 px window border is cut whole or
// kept whole. The PNG is marked afterwards; a marked file is not trimmed a second time.

const fs = require("fs");
const path = require("path");
const { decodePng, encodePng, crc32 } = require("./render");

const JITTER_MAX = 15; // px taken from one side at most
const JITTER_GAP = 3; // px of background kept between the new edge and the content
const JITTER_TOL = 24; // summed RGB difference still counted as the same background
const MARK = "lab-report\0jitter";

function cropScreen({ width, height, ch, img }, pad = 12) {
  const stride = width * ch;
  let right = 0, bottom = 0;
  for (let y = 0; y < height; y++) {
    const b = y * stride + (width - 1) * ch;
    const br = img[b], bg = img[b + 1], bb = img[b + 2];
    for (let x = 0; x < width - 1; x++) {
      const i = y * stride + x * ch;
      const d = Math.abs(img[i] - br) + Math.abs(img[i + 1] - bg) + Math.abs(img[i + 2] - bb);
      if (d > 60) {
        if (x > right) right = x;
        bottom = y;
      }
    }
  }
  const w = Math.min(width, right + 1 + pad);
  const h = Math.min(height, bottom + 1 + pad);
  const os_ = w * ch;
  const out = Buffer.alloc(os_ * h);
  for (let y = 0; y < h; y++) img.copy(out, y * os_, y * stride, y * stride + os_);
  return { width: w, height: h, ch, img: out };
}

function cropRect({ width, height, ch, img }, [x, y, w, h]) {
  if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > width || y + h > height)
    throw new Error(`--rect ${x},${y},${w},${h} выходит за границы снимка ${width}x${height}`);
  const stride = width * ch;
  const os_ = w * ch;
  const out = Buffer.alloc(os_ * h);
  for (let r = 0; r < h; r++) img.copy(out, r * os_, (y + r) * stride + x * ch, (y + r) * stride + x * ch + os_);
  return { width: w, height: h, ch, img: out };
}

// How many px can go from one side. Lines are compared pixel by pixel with the first
// background line, so a column crossing a light title bar and a dark console body is
// still background as long as it repeats the edge column.
function trimmable({ width, height, ch, img }, side) {
  const vertical = side === "left" || side === "right";
  const depth = vertical ? width : height;
  const span = vertical ? height : width;
  const at = (k, i) => {
    const d = side === "right" || side === "bottom" ? depth - 1 - k : k;
    return (vertical ? i * width + d : d * width + i) * ch;
  };
  const same = (k, m) => {
    for (let i = 0; i < span; i++) {
      const a = at(k, i), b = at(m, i);
      if (Math.abs(img[a] - img[b]) + Math.abs(img[a + 1] - img[b + 1]) + Math.abs(img[a + 2] - img[b + 2]) > JITTER_TOL) return false;
    }
    return true;
  };
  // border: the first line the next two repeat; none of 0…2 qualifies — content at the edge
  let border = -1;
  for (let b = 0; b <= 2 && b + 2 < depth; b++) if (same(b, b + 1) && same(b, b + 2)) { border = b; break; }
  if (border < 0) return { n: 0, border: 0 };
  let content = border + 3;
  while (content < depth && content - border <= JITTER_MAX + JITTER_GAP && same(border, content)) content++;
  return { n: Math.max(0, Math.min(JITTER_MAX, content - JITTER_GAP)), border };
}

function jitter(pic, rand = Math.random) {
  const cut = {};
  for (const side of ["top", "left", "right", "bottom"]) {
    const { n, border } = trimmable(pic, side);
    let t = Math.floor(rand() * (n + 1));
    if (t > 0 && t < border) t = border <= n ? border : 0; // no half of a border
    cut[side] = t;
  }
  const w = pic.width - cut.left - cut.right;
  const h = pic.height - cut.top - cut.bottom;
  if (w < 1 || h < 1) return { pic, cut: { top: 0, left: 0, right: 0, bottom: 0 } };
  return { pic: cropRect(pic, [cut.left, cut.top, w, h]), cut };
}

const isMarked = (buf) => buf.includes(Buffer.from(MARK, "latin1"));

// a tEXt chunk before IEND tells a later run the margins are already random
function withMark(png) {
  const data = Buffer.from(MARK, "latin1");
  const c = Buffer.alloc(12 + data.length);
  c.writeUInt32BE(data.length, 0);
  c.write("tEXt", 4, "ascii");
  data.copy(c, 8);
  c.writeUInt32BE(crc32(c.subarray(4, 8 + data.length)), 8 + data.length);
  return Buffer.concat([png.subarray(0, png.length - 12), c, png.subarray(png.length - 12)]);
}

if (require.main === module) {
  let pad = 12;
  let rect = null;
  let jitterOn = true;
  const inputs = [];
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pad") pad = +args[++i];
    else if (args[i] === "--rect") rect = args[++i].split(",").map(Number);
    else if (args[i] === "--no-jitter") jitterOn = false;
    else inputs.push(args[i]);
  }
  if (!inputs.length || (rect && (rect.length !== 4 || rect.some(Number.isNaN)))) {
    console.error("usage: node crop-screen.js <file.png | dir> [...] [--pad N] [--no-jitter] | <file.png> [...] --rect x,y,w,h");
    process.exit(2);
  }
  const files = inputs.flatMap((x) => fs.statSync(x).isDirectory()
    ? fs.readdirSync(x).filter((f) => /\.png$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((f) => path.join(x, f))
    : [x]);
  for (const f of files) {
    const buf = fs.readFileSync(f);
    const marked = isMarked(buf);
    let pic = rect ? cropRect(decodePng(buf), rect) : cropScreen(decodePng(buf), pad);
    let note = "";
    // a new --rect makes a new picture; otherwise a marked file keeps its margins
    if (jitterOn && (rect || !marked)) {
      const j = jitter(pic);
      pic = j.pic;
      note = ` (срез ↑${j.cut.top} ←${j.cut.left} →${j.cut.right} ↓${j.cut.bottom})`;
    } else if (jitterOn) note = " (поля уже случайные, не тронуты)";
    const png = encodePng(pic.width, pic.height, pic.ch, pic.img);
    fs.writeFileSync(f, jitterOn || marked ? withMark(png) : png);
    console.log(`${path.basename(f)} ${pic.width}x${pic.height}${note}`);
  }
}

module.exports = { cropScreen, cropRect, trimmable, jitter };
