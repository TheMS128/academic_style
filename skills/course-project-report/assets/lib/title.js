// Title page: the lab report's title page, set inside the frame of the course project.
// lab-report's title.js lays it out — the header of the university, «Курсовой проект»,
// the discipline and the topic, the signatures, the city and the year — with the same
// sizes, line heights and styles (lab-report's styles.js → titleStyles), so the title
// pages of the plugin look the same. Only the page differs: the text stands
// `title.side` mm inside the frame and ends `title.below` mm above it.

const { labTitle, labProfile } = require("./deps");
const { mm } = require("./profile");

// the lab report's profile with the page of this title sheet; the signature block keeps
// its width, measured from the right edge of the text
function titleProfile(p) {
  const margin = {
    top: mm(p.text.top),
    bottom: mm(p.frame.bottom + p.title.below),
    left: mm(p.frame.left + p.title.side),
    right: mm(p.frame.right + p.title.side),
  };
  const labWidth = labProfile.page.width - labProfile.page.margin.left - labProfile.page.margin.right;
  const width = p.page.width - margin.left - margin.right;
  return {
    ...labProfile,
    page: { width: p.page.width, height: p.page.height, margin },
    indent: { ...labProfile.indent, signLeft: width - (labWidth - labProfile.indent.signLeft) },
  };
}

function titlePage(t, p) {
  return labTitle.titlePage({ ...t, "Тип работы": "Курсовой проект" }, titleProfile(p));
}

module.exports = { titlePage, titleProfile };
