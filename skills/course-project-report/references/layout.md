# Layout and the builder — maintenance only

Not read while a note is written. Every number lives in `assets/lib/profile.js`; this file
says where the numbers come from and how the document is put together.

## Where the layout comes from

Three explanatory notes made on the department's template (ВлГУ, кафедра ИСПИ), read as
samples, not as a standard: where they agree, the profile follows them; where they
contradict each other or themselves, ГОСТ 2.104 and ГОСТ 2.105 decide.

| Taken from the samples | Decided against them |
| --- | --- |
| frame on every sheet, the title page included | frame 185 × 287 mm, 5 mm from the right edge (the samples' is 181 mm wide) |
| form 2 on the first sheet of the contents, form 2а after | form 2 on one sheet only: the samples carry it on the abstract as well, ГОСТ 2.104 gives it to the first sheet after the title page (E10) |
| the title page: an italic sans-serif, no line for the discipline, the signatures in two columns, the post before the teacher's name («доц. Петров П. П.»), the positions of its blocks | one style for all first-level headings (the samples set «ЗАКЛЮЧЕНИЕ» larger) |
| body: Times New Roman 14, 1.5 lines, justified, first line 1.27 cm | no full stop after a heading number («4.4.1.» in one sample) |
| chapters in capitals, centred, each on a new sheet | text 10 mm below the frame and above the title block (the samples start 1.4 mm under the frame) |
| lists with a dash, «1)», «а)»; the marker at the paragraph indent | code with single line spacing (1.5 in the samples) |
| «Рисунок N – Название» under the figure; a listing captioned as a figure | the sheet number and the number of sheets are fields (typed by hand in the samples) |
| contents of two levels that lists «Аннотация» and itself | the name of a table at the left (at the right in the one sample that has a table; ГОСТ 2.105 and ГОСТ 7.32 put it at the left) |
| | sources by ГОСТ Р 7.0.100-2018, numbered «1.» (the samples use a shortened entry and «1)») |
| | «ABSTRACT» in bold, as «АННОТАЦИЯ» is |

`table.captionAlign`, `stamp.abstract` and `stamp.contents` (E10), `line.code` and `lists.source` switch the choices
most likely to differ from one teacher to another.

## Title page (`title.js`)

The text of the title page stands 3 mm inside the frame, wider than the body, because
the lines of the university's name are long. The blocks sit where the samples have them:
«КУРСОВОЙ ПРОЕКТ» at `title.workTop`, the signatures at `title.signTop`, the city on the
last line above the frame. «Выполнил:» and «Принял:» stand in one column and what belongs
to them in the next, set with a tab stop. A topic longer than a line breaks before its
quoted name. `title.posts` maps the post of `RULES.MD` to its short form.

## Sections

| Section | Sheets | Header | Bottom margin |
| --- | --- | --- | --- |
| 1 | title page | frame | 10 mm; side margins 3 mm inside the frame |
| 2 | abstract | frame (`stamp.abstract`: form 2 or 2а) | 15 mm (55 / 30 mm) |
| 3 | contents | first sheet: frame + form 2 (`stamp.contents`: form 2а); next: frame + form 2а | 55 mm (30 mm) |
| 4 | everything else | frame + form 2а | 30 mm |

Sheets are numbered through the whole document from the title page; the numbers are PAGE
fields in the title block.

## The frame and the title block (`frame.js`)

docx-js writes a header with a marker paragraph for every section; `pack()` replaces the
whole header part with the XML of `headerXml()`. Lines are DrawingML shapes
(`wps:wsp`, `prstGeom="line"`) with a VML fallback, anchored to the page and placed
behind the text. Inscriptions are paragraphs in text frames (`w:framePr`) anchored to the
page: a frame is plain WordprocessingML, so a PAGE or NUMPAGES field works in it, and it
takes no room in the header. An inscription is centred in its cell by moving the frame
down, since a text frame has no vertical alignment. `geometry()` holds the cells of both
forms in millimetres from the page corner.

## Contents

`compose()` collects the headings with their bookmarks; `tocXml()` writes a TOC field
whose entries are already in place, each with an empty PAGEREF field. `updateFields` in
the settings makes Word offer to update the fields when the file is opened; Word for the
web does not update them by itself.

## What is shared

`deps.js` takes docx-js and JSZip, the title-field helpers, the document properties and
the package clean-up from `lab-report/assets`, and the lint from `core/assets`. The
document properties are the lab report's, unchanged.

## What cannot be checked here

No Word on the build machine: the frame, the title block and the page flow are verified
only by opening the file. `stamp` geometry can be drawn from the built header's own
coordinates, which checks the numbers but not how Word renders them.
