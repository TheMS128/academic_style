#!/usr/bin/env node
// HTML -> PNG with headless Edge at 2x, then crops the blank margin around the
// content: Edge captures a fixed window, the drawing is usually smaller, and the
// leftover white space would shrink the figure once it is scaled into the page.
//
//   node render.js <file.html | dir> [...] [--size 1200x1800] [--pad 24] [--no-crop]
//
// A page may set its own capture box: <meta name="capture-size" content="1180x900">
// and its own margin left after the crop: <meta name="capture-pad" content="0">
// (console transcripts are cut flush to the dark block). --pad on the command line wins.
// Output: <name>.png next to each .html; prints the final pixel size.

const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { runEdge } = require("../lib/edge");

// ---------- minimal PNG codec (8-bit, non-interlaced, RGB or RGBA) ----------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function decodePng(buf) {
  let pos = 8;
  let width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`неподдерживаемый PNG: depth ${bitDepth}, color ${colorType}, interlace ${interlace}`);
  }
  const ch = colorType === 6 ? 4 : 3;
  const stride = width * ch;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const img = Buffer.alloc(stride * height);
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    raw.copy(cur, 0, rp, rp + stride);
    rp += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev[x];
      const c = x >= ch ? prev[x - ch] : 0;
      let v = cur[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    cur.copy(img, y * stride);
    cur.copy(prev);
  }
  return { width, height, ch, img };
}

function encodePng(width, height, ch, img) {
  const stride = width * ch;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) img.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  const chunk = (type, data) => {
    const b = Buffer.alloc(12 + data.length);
    b.writeUInt32BE(data.length, 0);
    b.write(type, 4, "ascii");
    data.copy(b, 8);
    b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = ch === 4 ? 6 : 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- crop ----------
function cropToContent({ width, height, ch, img }, pad) {
  const stride = width * ch;
  const white = (x, y) => {
    const i = y * stride + x * ch;
    return img[i] >= 250 && img[i + 1] >= 250 && img[i + 2] >= 250;
  };
  const rowBlank = (y) => { for (let x = 0; x < width; x++) if (!white(x, y)) return false; return true; };
  const colBlank = (x, top, bot) => { for (let y = top; y <= bot; y++) if (!white(x, y)) return false; return true; };
  let top = 0, bot = height - 1;
  while (top < bot && rowBlank(top)) top++;
  while (bot > top && rowBlank(bot)) bot--;
  let left = 0, right = width - 1;
  while (left < right && colBlank(left, top, bot)) left++;
  while (right > left && colBlank(right, top, bot)) right--;

  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad);
  bot = Math.min(height - 1, bot + pad);
  const w = right - left + 1, h = bot - top + 1, os_ = w * ch;
  const out = Buffer.alloc(os_ * h);
  for (let y = 0; y < h; y++) {
    const from = (top + y) * stride + left * ch;
    img.copy(out, y * os_, from, from + os_);
  }
  return { width: w, height: h, ch, img: out };
}

// ---------- render ----------
function render(htmlFile, { size = "1200x1800", pad, crop = true } = {}) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const [w, h] = ((html.match(/<meta\s+name="capture-size"\s+content="(\d+x\d+)"/) || [])[1] || size).split("x").map(Number);
  pad ??= +((html.match(/<meta\s+name="capture-pad"\s+content="(\d+)"/) || [])[1] ?? 24);
  const tmp = path.join(os.tmpdir(), `lab-report-render-${process.pid}.png`);
  fs.rmSync(tmp, { force: true });
  runEdge([
    "--hide-scrollbars",
    "--force-device-scale-factor=2", "--virtual-time-budget=4000",
    `--screenshot=${tmp}`, `--window-size=${w},${h}`, path.resolve(htmlFile),
  ], { stdio: "ignore", timeout: 60000 });
  let pic = decodePng(fs.readFileSync(tmp));
  fs.rmSync(tmp, { force: true });
  if (crop) pic = cropToContent(pic, pad);
  const out = htmlFile.replace(/\.html?$/i, ".png");
  fs.writeFileSync(out, encodePng(pic.width, pic.height, pic.ch, pic.img));
  return { out, width: pic.width, height: pic.height };
}

if (require.main === module) {
  const opts = {};
  const inputs = [];
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--size") opts.size = args[++i];
    else if (args[i] === "--pad") opts.pad = +args[++i];
    else if (args[i] === "--no-crop") opts.crop = false;
    else inputs.push(args[i]);
  }
  if (!inputs.length) {
    console.error("usage: node render.js <file.html | dir> [...] [--size WxH] [--pad N] [--no-crop]");
    process.exit(2);
  }
  const files = inputs.flatMap((x) => fs.statSync(x).isDirectory()
    ? fs.readdirSync(x).filter((f) => /\.html?$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((f) => path.join(x, f))
    : [x]);
  for (const f of files) {
    const r = render(f, opts);
    console.log(`${path.basename(r.out)} ${r.width}x${r.height}`);
  }
}

module.exports = { render, decodePng, encodePng, cropToContent, crc32 };
