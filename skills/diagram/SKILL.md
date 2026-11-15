---
name: diagram
description: >-
  Draw a diagram or a scheme for a report, a course project or another academic text —
  a process or life-cycle scheme, a flowchart, a block or structural scheme, a UML
  class, use-case, sequence, state or activity diagram, an ER diagram — as an SVG with a
  PNG for the document. Use when a text needs a picture of this kind and the user asks
  to draw it ("нарисуй схему", "диаграмма", "блок-схема", "схема процесса", "UML",
  "ER-диаграмма"), or when another skill of this plugin needs a figure that is not a
  screenshot. The skill decides what goes on the picture and what stays out, draws it
  with PlantUML, Graphviz, a plotting script or its own drawer, and checks with a script
  that nothing lies on anything — arrows on arrows first of all.
---

# Diagram

A diagram is drawn in three moves that do not mix: **what** goes on it, **how** it is
drawn, and the **check**. The first is a decision about content and is written down
before a single box is placed; the last is a script and has the final word.

Paths: `<skill>` = the directory holding this SKILL.md; `<assets>` = `<skill>/assets`.
The scripts need Node.js and Microsoft Edge (it measures and renders the picture) and
nothing else: no `npm i`. A picture made for a report lives in the report's `figures/`
folder as three files with one name: the source (`.puml`, `.dot`, `.py`, `.js`), the
`.svg` and the `.scope.md`; the `.png` is made from the SVG.

## Rule files

| Id | File | Owns |
| --- | --- | --- |
| M | `references/selection.md` | the question a diagram answers; which elements and relations go on it and which stay out; the scope file |
| C | `references/drawing.md` | what the check reports and how each problem is fixed (C1–C9); the description for the own drawer (C10); the tool and the look (C11, C12) |

## Hard stops

- A picture is never taken from the internet and never redrawn from one element for
  element. A scheme of a well-known model (a life cycle, a methodology) is drawn anew
  from what the text says about it; the source of the idea is cited in the text.
- No scope file — no drawing (M1). The decision about every element is made before the
  layout, not explained afterwards.
- A diagram goes into a document only after `check.js` ends without an «ОШИБКА». A
  problem is fixed in the source of the picture; it is not silenced with `--no-scope`,
  and `--lifelines` is used for sequence diagrams only.
- A diagram shows what exists: classes that are in the code, steps the process has,
  states the object takes (F-rules of the core). An element invented to make the picture
  fuller is an error of fact, not of style.
- Software is not installed without the user's word. PlantUML and Graphviz are used when
  they are on the machine; otherwise the own drawer is.

## Workflow

1. **Question and scope.** Read `references/selection.md`. Write
   `figures/<name>.scope.md`: the one question the picture answers, then every candidate
   element with «да» or «нет» and the reason (M1–M6). Show the table to the user when
   the choice is not obvious from the text the picture belongs to.
2. **Tool.** Read `references/drawing.md` and pick the route (C11): PlantUML for UML when
   it is installed, Graphviz for graphs it lays out well, a plotting script for charts of
   data, the own drawer (`draw.js`) for schemes of boxes and arrows and whenever nothing
   else is there.
3. **Draw** from the scope file — only the rows marked «да» — and get an SVG:
   - own drawer: `node <assets>/bin/draw.js figures/<name>.js`;
   - PlantUML: `java -jar plantuml.jar -tsvg figures/<name>.puml`;
   - Graphviz: `dot -Tsvg figures/<name>.dot -o figures/<name>.svg`;
   - a script of yours: it writes `figures/<name>.svg`.
4. **Check**: `node <assets>/bin/check.js figures/<name>.svg` (`--lifelines` for a
   sequence diagram). Fix every «ОШИБКА» by its rule (C1–C8, M) in the source and draw
   again; a «замечание» is fixed or left with a reason. Repeat until the check is clean.
5. **Render**: `node <assets>/bin/render.js figures/<name>.svg` → `figures/<name>.png`,
   and **look at the PNG**: the check finds what lies on what, not whether the picture
   reads well (C9).
6. **Hand over** the PNG to the text that needs it, with the caption that names what the
   picture shows (the question of M1, turned into a name) and one sentence for the text
   about what the reader should see in it.

A picture that fails the check three times in a row with the same problem is too crowded
for its sheet: go back to step 1 and split it by two questions (M5), do not shrink the
font.
