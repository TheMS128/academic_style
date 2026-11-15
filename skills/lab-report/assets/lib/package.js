// Clean-up of the package docx-js produces. Shared with the other builders of the plugin.

// docx-js closes every non-final section with an extra empty paragraph that holds the
// section break, and that paragraph takes a line of its own on the title page. Move
// the break into the section's last paragraph instead.
function mergeSectionBreaks(xml) {
  const empty = /<w:p><w:pPr>(<w:sectPr>[\s\S]*?<\/w:sectPr>)<\/w:pPr><\/w:p>/g;
  let out = "";
  let last = 0;
  for (const m of xml.matchAll(empty)) {
    const head = xml.slice(last, m.index);
    const start = head.lastIndexOf("<w:p>");
    if (head.endsWith("</w:p>") && start >= 0) {
      const prev = head.slice(start);
      const merged = prev.includes("</w:pPr>")
        ? prev.replace("</w:pPr>", `${m[1]}</w:pPr>`)
        : prev.replace("<w:p>", `<w:p><w:pPr>${m[1]}</w:pPr>`);
      out += head.slice(0, start) + merged;
    } else {
      out += head + m[0];
    }
    last = m.index + m[0].length;
  }
  return out + xml.slice(last);
}

// docx-js writes comments, footnotes and endnotes parts into every package, used or not.
// A part the document never refers to is dropped together with its relationship and its
// content type; one that is in use stays.
const UNUSED_PARTS = [
  { part: "comments", ref: /<w:comment(Reference|RangeStart)\b/ },
  { part: "footnotes", ref: /<w:footnoteReference\b/ },
  { part: "endnotes", ref: /<w:endnoteReference\b/ },
];
async function dropUnusedParts(zip, documentXml) {
  const relsFile = "word/_rels/document.xml.rels";
  let rels = await zip.file(relsFile).async("string");
  let types = await zip.file("[Content_Types].xml").async("string");
  for (const { part, ref } of UNUSED_PARTS) {
    if (ref.test(documentXml) || !zip.file(`word/${part}.xml`)) continue;
    zip.remove(`word/${part}.xml`);
    zip.remove(`word/_rels/${part}.xml.rels`);
    rels = rels.replace(new RegExp(`<Relationship [^>]*Target="${part}\\.xml"[^>]*/>`, "g"), "");
    types = types.replace(new RegExp(`<Override [^>]*PartName="/word/${part}\\.xml"[^>]*/>`, "g"), "");
  }
  zip.file(relsFile, rels);
  zip.file("[Content_Types].xml", types);
}

// A PNG may carry text, time and EXIF chunks — the tool that made it, a date, a device.
// None of it belongs in the report: only the chunks that draw the picture are kept.
const PNG_DRAWING = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "bKGD", "pHYs"]);
function stripPngMetadata(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return buf;
  const out = [buf.subarray(0, 8)];
  for (let o = 8; o + 12 <= buf.length; ) {
    const size = 12 + buf.readUInt32BE(o);
    if (PNG_DRAWING.has(buf.toString("latin1", o + 4, o + 8))) out.push(buf.subarray(o, o + size));
    o += size;
  }
  return Buffer.concat(out);
}

async function stripMedia(zip) {
  for (const name of Object.keys(zip.files).filter((n) => /^word\/media\/.+\.png$/i.test(n)))
    zip.file(name, stripPngMetadata(await zip.file(name).async("nodebuffer")));
}

module.exports = { mergeSectionBreaks, dropUnusedParts, stripPngMetadata, stripMedia };
