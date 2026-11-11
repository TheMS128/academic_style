// The profile's «limits»: a phrase the genre permits, counted per paragraph, section or
// text. Over the limit it is reported under the rule that owns the phrase.

const { where } = require("./util");

const SCOPE = { paragraph: "абзаце", section: "разделе", text: "тексте" };

module.exports = function limits(d, r) {
  for (const l of d.limits) {
    const groups = new Map();
    for (const p of d.own.filter((q) => !r.silent(l.rule, q))) {
      const key = l.per === "paragraph" ? p.i : l.per === "section" ? (p.heads || []).join(" / ") : "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    for (const ps of groups.values()) {
      const text = ps.map((p) => p.text).join("\n");
      const hits = l.res.flatMap((re) => text.match(re) || []).map((s) => s.toLowerCase());
      if (hits.length <= l.max) continue;
      const names = [...new Set(hits)].map((s) => `«${s}»`).join(", ");
      const at = l.per === "text" ? "" : `: ${where(ps.find((p) => l.res.some((re) => p.text.match(re))))}`;
      r.warn(l.rule, `${names} ×${hits.length} в одном ${SCOPE[l.per]} — в этом жанре не больше ${l.max}${at}`);
    }
  }
};
