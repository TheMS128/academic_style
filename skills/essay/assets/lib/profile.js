// The essay's layout: the course project's text (Times New Roman 14, 1.5 lines, chapters in
// capitals, contents, sources, appendices) on a plain A4 page — no frame and no title
// block — with the lab report's margins and its first-line indent of 1.25 cm. The page
// number stands at the bottom centre; the title page counts but carries none.

const { kpProfile, labProfile } = require("./deps");
const { KP, mm } = kpProfile;

const ESSAY = {
  ...KP,
  // KP's text margins are measured from the page edge, as here: 30 / 15 / 20 / 20 mm
  text: { left: 30, right: 15, top: 20, bottom: 20, aboveStamp: 0 },
  indent: { ...KP.indent, firstLine: labProfile.indent.firstLine },  // 1.25 cm
  footer: 567,                                                       // page number from the bottom edge, twips
  toc: { ...KP.toc, listsItself: false },                            // the contents does not list itself
};

module.exports = { ESSAY, mm };
