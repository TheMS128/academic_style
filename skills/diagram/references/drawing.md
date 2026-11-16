# C — drawing and checking a diagram

What the check reports (C1–C8), what it cannot see (C9), the own drawer (C10), the choice
of a tool (C11) and the look of a picture (C12). What goes on the picture is
`selection.md` (M).

## The check

`node <assets>/bin/check.js figures/<name>.svg` opens the SVG in a browser, takes the real
geometry of every shape, line and text and reports what lies on what. Each problem names
the elements by their labels and gives the place in the coordinates of the picture. A
problem is fixed in the source and the picture is drawn again — never in the SVG by hand,
the next drawing would lose the fix.

**C1. A line on a line.** Two connectors run along each other. They leave or enter a
node at different points, or one of them takes another route. Two arrows that share a
stretch are read as one arrow with two ends.

**C2. A line across a line.** Move a node so that connected nodes stand next to each
other; take the other side of the node; change the route. A crossing that survives every
arrangement means the picture answers two questions (M5). The check does not count as a
crossing a line that ends on another one (a tree of connectors) and lines that meet at
the same point of a node.

**C3. A line through a box.** A connector passes through a node it does not connect.
Route it around, or move the node out of the way. A line may cross the frame of a group
its own node stands in.

**C4. A box on a box.** Two nodes overlap. A node entirely inside another is a group and
is fine; a partial overlap is never meant.

**C5. Text on text.** Two labels overlap: usually the labels of two connectors, or a
label and a node's text. Shorten a label, move it, or widen the gap.

**C6. A line or a border across a text.** A connector runs over a label, or a text is
wider than its box and the border cuts it. Break the text into lines, widen the box, move
the label off the line.

**C7. Outside the sheet.** Something sticks out of the viewBox and will be cut off in the
PNG. Enlarge the sheet.

**C8. Too small.** A «замечание»: at a page width of 16 cm the text comes out lower than
2.4 mm (about 7 pt). The picture has too much on it for one sheet (M5) or the sheet has
dead space; the font is not what gets changed.

`--lifelines` — for sequence diagrams only: vertical lines are lifelines, and a message
crosses them by design; overlaps (C1) are still reported. `--no-scope` skips the
comparison with the scope file and is for trying the script on a foreign picture, never
for a picture that goes into a document.

**C9. What the check cannot see.** It finds overlaps; it does not know whether the
picture reads. After a clean check the PNG is looked at once for: the direction of the
flow (one direction — top to bottom or left to right — with back arrows as the visible
exception); alignment; arrows that touch their nodes; the same shape for the same kind of
thing; labels that stand next to their own line and not between two; empty space.
A text measured in a font the machine does not have comes out differently on another
machine: the pictures are rendered to PNG where they were checked.

## The own drawer

**C10. `draw.js`.** `node <assets>/bin/draw.js figures/<name>.js` draws boxes and
connectors from a description without coordinates. Nodes stand in the cells of a grid;
a column is as wide as its widest node, a row as tall as its tallest; connectors run
along horizontal and vertical segments.

```js
module.exports = {
  nodes: [
    { id: "plan", text: "Планирование итерации", at: [0, 0] },                 // at: [column, row]
    { id: "ok", text: "Цель достигнута?", at: [1, 0], shape: "diamond" },
    { id: "user", shape: "class", text: "User", fields: ["role: Role"], methods: [], at: [0, 1] },
  ],
  edges: [
    { from: "plan", to: "ok" },                                                // kind: "arrow" by default
    { from: "ok", to: "user", text: "да", route: "vh" },
  ],
  groups: [{ text: "Итерация", around: ["plan", "ok"] }],
};
```

| Field | Values |
| --- | --- |
| node `shape` | `box` (default), `round` — start, end, state; `ellipse` — use case; `diamond` — decision; `class` — name, `fields`, `methods`; `plain` — text without a border |
| edge `kind` | `arrow` (default), `line`, `dashed` — dependency, with an arrow; `both`; `inherit` — hollow triangle at `to`; `compose` / `aggregate` — filled / hollow diamond at `from` |
| edge `route` | `straight` — same row or column (default there); `hv` — out sideways, in from above or below (default otherwise); `vh` — the opposite; `z` — sideways, down a gap, sideways; `zv` — the same turned |
| edge `fromSide`, `toSide` | `left`, `right`, `top`, `bottom` — instead of the sides the route gives |
| edge `shift` | moves the middle segment of a `z` / `zv` route, in units of the picture |
| edge `text`, `labelOffset` | the label and its shift `[dx, dy]` |
| top level | `font` (20), `gapX`, `gapY` — the gaps between columns and rows, `maxWidth` — where node text wraps |

Several connectors on one side of a node spread along it by themselves. The drawer does
not look for a route without crossings: it draws what is described, the check says what
went wrong, and the fix is a different cell, side or route. Start from the arrangement in
which connected nodes are neighbours and the main flow goes one way.

## Tools and look

**C11. The tool.** The picture ends as an SVG whatever made it, so the same check applies.

| The picture | Tool | When |
| --- | --- | --- |
| UML: class, sequence, state, activity, use case | PlantUML (`java -jar plantuml.jar -tsvg`) | Java and the jar are on the machine |
| a graph with many nodes: dependencies, a tree, a state machine | Graphviz (`dot -Tsvg`) | `dot` is on the machine |
| a chart of data: bars, lines, a histogram | a script with a plotting library that saves SVG | the library is installed; the numbers come from the work's own data |
| a scheme of boxes and arrows, a flowchart, a life cycle, a small class or ER diagram | the own drawer (C10) | always available |
| something none of them draws | an SVG written by a script of yours | the script is kept as the source |

What is installed is found out by running the tool (`java -version`, `dot -V`), not
assumed; nothing is downloaded without the user's word. A layout the tool chose is not
exempt from the check: PlantUML and Graphviz cross lines too, and the fix is in their
source — the order of declarations, `left to right direction`, `rankdir`, hidden links,
fewer elements. For PlantUML use `skinparam monochrome true`, `skinparam shadowing
false`, `skinparam defaultFontName "Times New Roman"`; for Graphviz
`node [shape=box, fontname="Times New Roman"]`.

**C12. The look.** Black on white, no colour and no shadows: the picture is printed.
One font, Times New Roman, the size of the body text of the document or a step smaller
when the picture is scaled to the page. Lines 1.5–2 px at a width of 1000. Shapes and
lines mean what the notation says and one thing each: in UML the kinds of `edge.kind` of
C10; in a flowchart a rectangle is an action, a diamond a decision, a rounded box the
start and the end. No legend is needed when the notation is standard; a shape of your own
invention is explained in the text. Text on the picture is in the language of the
document; names from the code stay as they are in the code (M6).
