// The builder runs on the lab-report skill's libraries and on the core's lint: both
// skills are installed next to this one. Nothing is copied from them.

const fs = require("fs");
const path = require("path");

const SKILLS = path.resolve(__dirname, "..", "..", "..");
const LAB = path.join(SKILLS, "lab-report", "assets");
const CORE = path.join(SKILLS, "core", "assets");

if (!fs.existsSync(path.join(LAB, "lib", "meta.js")))
  throw new Error(`рядом со скиллом course-project-report нет скилла lab-report (${LAB}) — сборщик работает на его библиотеках`);
if (!fs.existsSync(path.join(LAB, "node_modules", "docx")))
  throw new Error(`зависимости не установлены — выполните один раз: npm i (в папке ${LAB})`);
if (!fs.existsSync(path.join(CORE, "lint", "index.js")))
  throw new Error(`рядом со скиллом course-project-report нет скилла core (${CORE}) — текст проверяется его линтом`);

module.exports = {
  LAB,
  CORE,
  // resolved as lab-report's own files resolve them: docx ships one file for require("docx")
  // and another for its directory, and objects of one are not recognised by the other
  docx: require(require.resolve("docx", { paths: [path.join(LAB, "lib")] })),
  JSZip: require(require.resolve("jszip", { paths: [path.join(LAB, "lib")] })),
  labMeta: require(path.join(LAB, "lib", "meta")),
  labPackage: require(path.join(LAB, "lib", "package")),
  wrap: require(path.join(LAB, "lib", "title")).wrap,
  labTitle: require(path.join(LAB, "lib", "title")),
  labStyles: require(path.join(LAB, "lib", "styles")),
  labProfile: require(path.join(LAB, "lib", "profile")).VLSU,
  pngSize: require(path.join(LAB, "lib", "compose")).pngSize,
  core: require(path.join(CORE, "lint")),
};
