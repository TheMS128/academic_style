// The essay is built on the libraries of two skills installed next to this one: the
// course project's composer (contents, chapters, sources, appendices, 1.5 lines) and the
// lab report's title page. Nothing is copied from them.

const fs = require("fs");
const path = require("path");

const SKILLS = path.resolve(__dirname, "..", "..", "..");
const LAB = path.join(SKILLS, "lab-report", "assets");
const KP = path.join(SKILLS, "course-project-report", "assets");

for (const [name, dir] of [["lab-report", LAB], ["course-project-report", KP]])
  if (!fs.existsSync(path.join(dir, "lib", "index.js")))
    throw new Error(`рядом со скиллом essay нет скилла ${name} (${dir}) — сборщик работает на его библиотеках`);
if (!fs.existsSync(path.join(LAB, "node_modules", "docx")))
  throw new Error(`зависимости не установлены — выполните один раз: npm i (в папке ${LAB})`);

// docx and jszip resolved as lab-report's own files resolve them (one build of each)
const fromLab = (name) => require(require.resolve(name, { paths: [path.join(LAB, "lib")] }));

module.exports = {
  LAB,
  KP,
  docx: fromLab("docx"),
  JSZip: fromLab("jszip"),
  labMeta: require(path.join(LAB, "lib", "meta")),
  labTitle: require(path.join(LAB, "lib", "title")),
  labProfile: require(path.join(LAB, "lib", "profile")).VLSU,
  labStyles: require(path.join(LAB, "lib", "styles")),
  kpProfile: require(path.join(KP, "lib", "profile")),
  kpStyles: require(path.join(KP, "lib", "styles")),
  kpCompose: require(path.join(KP, "lib", "compose")),
  kpCheck: require(path.join(KP, "lib", "check")),
  kpIndex: require(path.join(KP, "lib", "index")),
  kpBlocks: require(path.join(KP, "lib", "blocks")),
};
