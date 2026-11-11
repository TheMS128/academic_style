# Design / specification labs — functional spec, IA, navigation, interface, prototypes

The lab specifies a site or app that is not built yet. Figures are diagrams (use case,
site structure) and chrome-less wireframes. Adds to S: a requirements list of tasks
distinct in essence and in fact is `Задания`, a single task stated as a paragraph is
`Задание` (S3).

## Выполнение работы

1. One block per requirement of the assignment, in its order — functional requirements,
   site structure, content, navigation, interface, information design, page prototypes
   — named in the block's opening sentence, not in a subchapter (S5). Inside:
   explanation paragraph(s), the figure paragraph (V5), the figure.
2. Sections or pages go into a table `№ | Раздел | Назначение (и содержание)` from five
   up, when the report refers back to the register; fewer, or a «раздел | одна строка»
   shape, is a `list()` (B4, B5).
3. Every decision is tied to this particular site and its reason — «офис расположен в
   промышленной зоне, поэтому в разделе «Контакты» размещается карта с маршрутом» — not
   to websites in general. Reasons come from the assignment, the variant and `notes.md`.

## Wireframes

- Source: `reports/<lab>/figures/figN.html` with a shared `wf.css` — grey blocks, dashed
  placeholder rectangles labelled by role («Логотип», «Изображение», «Навигация»), one
  flat layout. Vary the placeholder text where the real content differs; no single label
  down the whole page.
- Render with `render.js` (G3); embed `wide` (B8).
- The caption and the prose call it a prototype — «Прототип макета главной страницы»,
  «эскиз раздела …» — never as if a built page is shown. How it was drawn is not
  described (F5).
- A Figma / Balsamiq look is exported by the user and supplied as images.
- In the Вывод, what was designed is named by its kind and counted (S11).
