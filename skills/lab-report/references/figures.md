# Figures — producing the pictures

**G1. Content is real.** Program output, page renders, query results and numbers come
from actually running, rendering or computing them — never hand-written. Diagrams and
wireframes are schematics and are named as such («Диаграмма …», «Прототип макета …»).
Decoration around a real render is allowed when wanted. The only text inside a picture
is its own labels — an explanation belongs in the paragraph above it (V5). How it was
captured stays out of the text (F4 of the core). A missing toolchain is reported once, with the
choice: install it, or no run figures. Sources (`.html`) and PNGs live together in
`reports/<lab>/figures/`.

**G2. Source by what the lab produced.**

| The lab produced | Figure |
| --- | --- |
| a program | transcript of a real run — Console template (G5) |
| a web page | headless-Edge render of the student's own `.html` (G3) |
| a mobile app | `adb exec-out screencap -p > reports/<lab>/figures/figN.png` with the screen open on the emulator, or the user's screenshot (G6) |
| a query / data script | the real result set — Analysis result template (G5) |
| a public URL in scope | Edge `--screenshot` of the URL; privacy-preserving choice on consent banners, no forms |
| a model (UML, ERD, flow) | Diagram template (G5), notation in `families/analysis.md` |
| a specification of an unbuilt site | wireframe — `families/design.md` |
| an installed GUI app (Excel, StarUML), a page behind a login | the user's screenshot |

**G3. Render.**

```
node <assets>/bin/render.js reports/<lab>/figures [--size 1200x1800] [--pad 24] [--no-crop]
```

Renders every `.html` (or the files given) with headless Edge at 2× and crops the blank
margin — leftover white space would shrink the figure on the page. A page larger than
1200×1800 CSS px sets its own box: `<meta name="capture-size" content="1000x2200">`; a
page that must be cut flush, with no white margin left, sets `<meta name="capture-pad"
content="0">` (the Console template does). The PNG size is read at build time.

**G4. Window screenshots** — a console with its title bar, an IDE, a GUI app — are
captured whole and cropped to the area used, never embedded full-screen: scaled into the
page, a maximized window's text shrinks to an unreadable strip.

```
node <assets>/bin/crop-screen.js reports/<lab>/figures/fig1.png [...] [--pad 12] [--no-jitter]
```

The crop keeps the top-left corner, title bar included, and cuts the right and bottom
edges just past the last text; then each side loses a random 0…N px of plain background
(N ≤ 15), so margins differ between screenshots while the title, the icon and the last
line stay whole. The PNG is marked and a second run leaves its margins alone; `--rect`
on a marked file gives a new picture and new margins; `--no-jitter` turns the random
trim off. Window screenshots only — diagrams, wireframes and renders are cropped by
`render.js` and must not go through `crop-screen.js`.

**G5. Templates.**

*Console:*

```html
<!doctype html><meta charset="utf-8"><meta name="capture-pad" content="0">
<body style="margin:0;padding:16px;background:#fff">
<pre style="margin:0;padding:14px 16px;background:#0c0c0c;color:#cccccc;
            font:13px/1.45 Consolas,'Courier New',monospace;white-space:pre-wrap">TEXT</pre>
</body>
```

The picture is the dark block alone, cut flush by `capture-pad` 0: square corners, no
white margin, no label above it — the caption under the figure names it.
`TEXT` is the captured output, HTML-escaped. A piped run does not echo input —
interleave the prompts with the values actually entered; from the first result line on,
everything is verbatim. Split a long transcript into per-figure slices matching the
captions.

*Diagram (UML / ER / flow):* a plain page with inline `<svg>` (or `<pre class="mermaid">`
plus the mermaid script), black on white. Legible at ~15 cm printed width: `viewBox`
width ≤ 1200; `font-size` ≥ viewBox width ÷ 45 (20 for 900, 27 for 1200), never below
18, titles a step larger; stroke ≥ 1.6 with arrowheads to match; `<body>` padding ≤ 4 px
and no dead space inside the viewBox. Embedded `wide` (B8); still cramped → its own page.

*Analysis result:* an HTML `<table>`: 1 px `#bbb` grid, bold header row on `#f3f3f3`,
numeric cells right-aligned in a mono font, 2–6 px padding. Numbers from a script run or
the user's data file.

**G6. Screenshots of an app** show the **result of the action** the paragraph describes:
the button while held, the dialog the long press opened, the list after the item was
added, the screen the navigation led to. A screen that shows only itself (a menu, a list
as it opens) is captured as it opens. **One screenshot per figure** — two states are two
figures, never two phones side by side; when only one can stay, it is the state after
the action.

**G7. Tall figures.** Taller than about 23 cm at the default width, a picture does not
fit a page with its caption and the build stops naming the figure — a phone screenshot
(1080×2400) always does. Never shrink, crop or split on your own: ask once for the whole
report, offering

1. crop to the area the task needs — the changed button, the dialog, the rows —
   `node <assets>/bin/crop-screen.js <png> --rect x,y,w,h`;
2. 15 cm height instead of the width: `figure(…, { fit: "height" })`, the whole screen
   narrower (about 7 cm for a phone);
3. a proposal fitted to the pictures — for Android, cutting the status and navigation
   bars (`--rect 0,<status>,<width>,<height − status − nav>`, bars measured on the
   screenshot), alone or with option 2; for a long scrolled page, two figures of its two
   parts.

Apply the answer to every tall figure of the report and record it in `notes.md`.
