// The builder runs on the lab-report skill's libraries and on the core's lint: both
// skills are installed next to this one. Nothing is copied from them.

const fs = require("fs");
const path = require("path");

const SKILLS = path.resolve(__dirname, "..", "..", "..");
const LAB = path.join(SKILLS, "lab-report", "assets");
const CORE = path.join(SKILLS, "core", "assets");

if (!fs.existsSync(path.join(LAB, "lib", "meta.js")))
  throw new Error(`рядом со скиллом course-project нет скилла lab-report (${LAB}) — сборщик работает на его библиотеках`);
if (!fs.existsSync(path.join(LAB, "node_modules", "docx")))
  throw new Error(`зависимости не установлены — выполните один раз: npm i (в папке ${LAB})`);
if (!fs.existsSync(path.join(CORE, "lint", "index.js")))
  throw new Error(`рядом со скиллом course-project нет скилла core (${CORE}) — текст проверяется его линтом`);

module.exports = {
  LAB,
  CORE,
  docx: require(path.join(LAB, "node_modules", "docx")),
  JSZip: require(path.join(LAB, "node_modules", "jszip")),
  labMeta: require(path.join(LAB, "lib", "meta")),
  labPackage: require(path.join(LAB, "lib", "package")),
  wrap: require(path.join(LAB, "lib", "title")).wrap,
  pngSize: require(path.join(LAB, "lib", "compose")).pngSize,
  core: require(path.join(CORE, "lint")),
};
