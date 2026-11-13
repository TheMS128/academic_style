#!/usr/bin/env node
// Checks that the sources of a note exist, and lays out what is needed to judge whether
// each one belongs to the topic (K12). For every entry of the list it prints the form
// problems (K10), requests the address and compares the title of the page with the title
// in the entry, and quotes the sentences of the note that refer to the source.
//
//   node sources.js kp/<project> [--offline]
//
// The script makes requests only to the addresses written in the list of sources. It does
// not decide relevance: that is read by the one who runs it, from the titles and the
// sentences printed here.

const fs = require("fs");
const path = require("path");

const fail = (msg) => { console.error(msg); process.exit(2); };
const args = process.argv.slice(2);
const offline = args.includes("--offline");
const arg = args.find((a) => !a.startsWith("--"));
if (!arg) fail("usage: node sources.js kp/<project> [--offline]");
const dir = path.resolve(arg);
const file = path.join(dir, "build.js");
if (!fs.existsSync(file)) fail(`нет файла ${file}`);

let lib;
try { lib = require("../lib"); } catch (e) { fail(e.message); }
const { run, buildProject, ...api } = lib;
const { checkEntry, entryTitle } = require("../lib/sources");
const { plain, itemText, itemNested } = require("../lib/compose");

const note = require(file)(api);
const list = note.body.filter((b) => b.kind === "sources").flatMap((b) => b.items);
if (!list.length) fail("в записке нет списка источников");

// every sentence of the note, to quote the ones that refer to a source
const texts = note.body.flatMap((b) =>
  b.kind === "p" ? [plain(b.text)]
    : b.kind === "list" ? b.items.flatMap((i) => [plain(itemText(i)), ...itemNested(i).map(plain)])
      : b.kind === "abstract" ? b.ru.map(plain) : []);
const sentences = texts.flatMap((t) => t.split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z«])/));

const words = (s) => (s.toLowerCase().match(/[a-zа-яё0-9#+.]{3,}/g) || []).map((w) => w.replace(/[.]+$/, ""));
function overlap(title, page) {
  const want = [...new Set(words(title))];
  const have = new Set(words(page));
  if (!want.length) return 0;
  // Russian endings differ between the entry and the page: compare the first five letters
  const stems = new Set([...have].map((w) => w.slice(0, 5)));
  return want.filter((w) => have.has(w) || stems.has(w.slice(0, 5))).length / want.length;
}

const tag = (html, re) => ((html.match(re) || [])[1] || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/\s+/g, " ").trim();

async function request(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; source-check)", "Accept": "text/html,*/*", "Accept-Language": "ru,en;q=0.8" } });
    const buf = Buffer.from(await res.arrayBuffer()).subarray(0, 600000);
    const type = res.headers.get("content-type") || "";
    const charset = ((type.match(/charset=([\w-]+)/i) || buf.subarray(0, 2000).toString("latin1").match(/charset=["']?([\w-]+)/i) || [])[1] || "utf-8").toLowerCase();
    let html;
    try { html = new TextDecoder(charset).decode(buf); } catch { html = buf.toString("utf8"); }
    return {
      status: res.status, final: res.url, html: /html/.test(type) || /<html/i.test(html.slice(0, 2000)),
      title: tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i), h1: tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      og: tag(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i),
    };
  } catch (e) {
    return { error: e.name === "AbortError" ? "нет ответа за 20 с" : (e.cause && e.cause.code) || e.message };
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  const t = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")).title; } catch { return null; } })();
  if (t) console.log(`Тема записки: ${t["Тема"]}\nДисциплина: ${t["Дисциплина"]}\n`);
  let errors = 0, unchecked = 0;
  for (const [i, [key, entry]] of list.entries()) {
    const form = checkEntry(entry);
    console.log(`${i + 1}. «${key}» [${form.kind}] ${entry}`);
    for (const m of form.errors) { errors++; console.log(`   ОШИБКА [K10]: ${m}`); }
    for (const m of form.warns) console.log(`   замечание [K10]: ${m}`);

    const title = entryTitle(entry);
    if (!form.url) { unchecked++; console.log("   существование: печатный источник — скрипт его не проверяет; проверяется по каталогу библиотеки или у автора (K12)"); }
    else if (offline) { unchecked++; console.log("   существование: не проверялось (--offline)"); }
    else {
      const r = await request(form.url);
      if (r.error) { unchecked++; console.log(`   существование: не удалось проверить — ${r.error}; адрес открывается вручную (K12)`); }
      else if (r.status === 404 || r.status === 410) { errors++; console.log(`   ОШИБКА [K12]: страницы нет — сервер ответил ${r.status}`); }
      else if (r.status >= 400) { unchecked++; console.log(`   существование: не удалось проверить — сервер ответил ${r.status} (часто так отвечают скрипту, а не браузеру); адрес открывается вручную (K12)`); }
      else {
        const page = [r.title, r.og, r.h1].filter(Boolean).join(" | ");
        const moved = new URL(r.final).pathname.length <= 1 && new URL(form.url).pathname.length > 1;
        console.log(`   существование: страница отвечает (${r.status})${r.final !== form.url ? `, адрес после перехода: ${r.final}` : ""}`);
        if (moved) console.log("   замечание [K12]: адрес перенаправляет на главную страницу сайта — самой страницы, возможно, уже нет");
        if (!r.html) console.log("   заголовок страницы: это не веб-страница (файл) — название сверяется вручную");
        else {
          console.log(`   заголовок страницы: ${page || "нет"}`);
          const share = overlap(title, page);
          if (page && share < 0.5) console.log(`   замечание [K12]: название в записи («${title}») расходится с заголовком страницы — совпало ${Math.round(share * 100)} % слов`);
        }
      }
    }
    const cited = sentences.filter((s) => s.includes(`{src:${key}}`));
    if (!cited.length) console.log("   в тексте: ссылок нет");
    for (const s of cited.slice(0, 3)) console.log(`   в тексте: ${s.replace(/\{src:[^}]+\}/g, "N").slice(0, 260)}`);
    console.log("");
  }
  console.log(`Источников: ${list.length}. Ошибок: ${errors}. Не проверено скриптом: ${unchecked}.`);
  console.log("Связь каждого источника с темой и с предложением, которое на него ссылается, оценивается по K12 — по названию, заголовку страницы и цитатам выше.");
  if (errors) process.exitCode = 1;
})();
