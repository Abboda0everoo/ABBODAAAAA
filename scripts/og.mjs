// Generates a 1200×630 share image for every page into src/assets/og/{lang}/.
// Optional dev tool — the images are committed, so `npm run build` never needs it.
// Requires Playwright: `npx playwright install chromium` once, then `npm run og`.
// (Set PLAYWRIGHT_MODULE to a module path if Playwright is installed elsewhere.)

import { mkdir, readFile, readdir } from "node:fs/promises";
import ar from "../src/content/ar.mjs";
import en from "../src/content/en.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const content = { ar, en };
// Pages and assets are served from a fake origin so fonts and images load.
const ORIGIN = "http://og.local";
const assets = `${ORIGIN}/assets`;
const TYPES = { woff2: "font/woff2", webp: "image/webp", png: "image/png", jpg: "image/jpeg" };

const posts = [];
for (const f of (await readdir("src/content/blog")).filter((x) => x.endsWith(".mjs"))) posts.push((await import(`../src/content/blog/${f}`)).default);

function pagesFor(lang) {
  const t = content[lang];
  const p = t.pages;
  return [
    { key: "home", overline: t.ui.tagline, title: p.home.hero.title },
    { key: "about", overline: p.about.hero.overline, title: p.about.hero.lead },
    { key: "services", overline: p.services.hero.overline, title: p.services.hero.lead },
    ...t.services.map((s) => ({ key: `service-${s.slug}`, overline: s.overline, title: s.title, sub: s.short })),
    { key: "clients", overline: p.clients.hero.overline, title: p.clients.hero.title, sub: p.clients.hero.lead },
    { key: "blog", overline: p.blog.hero.overline, title: p.blog.hero.title, sub: p.blog.hero.lead },
    ...posts.map((a) => ({ key: `article-${a.slug}`, overline: t.services.find((s) => s.slug === a.service).overline, title: a[lang].title })),
    { key: "contact", overline: p.contact.hero.overline, title: `${t.cta.title} ${t.cta.accent}` },
    { key: "privacy", overline: p.privacy.hero.overline, title: p.privacy.hero.title },
    { key: "terms", overline: p.terms.hero.overline, title: p.terms.hero.title },
  ];
}

const css = (await readFile("src/styles/main.css", "utf8")).match(/@font-face[^}]+}/g).join("\n").replaceAll("../fonts/", `${assets}/fonts/`);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const html = (lang, page) => `<!doctype html><html lang="${lang}" dir="${content[lang].dir}"><head><meta charset="utf-8"><style>
${css}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
.frame{position:relative;width:1200px;height:630px;overflow:hidden;background:radial-gradient(ellipse 70% 90% at ${lang === "ar" ? "20%" : "80%"} 0%,#12345A 0%,rgba(18,52,90,0) 70%),#0B1A2E;color:#fff;
  font-family:${lang === "ar" ? "'IBM Plex Sans Arabic','Montserrat'" : "'Montserrat','IBM Plex Sans Arabic'"},sans-serif;padding:72px 80px}
svg{position:absolute;width:760px;inset-inline-end:-220px;top:-80px;fill:none;stroke:#C9A15B}
.sym{position:absolute;width:300px;inset-inline-end:90px;top:150px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.4))}
.word{height:44px}
.over{font-family:Montserrat,sans-serif;font-size:18px;font-weight:600;letter-spacing:.3em;color:#C9A15B;margin-top:84px;direction:ltr;text-align:${lang === "ar" ? "right" : "left"}}
h1{font-size:${lang === "ar" ? 60 : 58}px;line-height:${lang === "ar" ? 1.35 : 1.12};font-weight:700;max-width:${lang === "ar" ? 720 : 700}px;margin-top:20px;letter-spacing:${lang === "ar" ? 0 : "-.02em"}}
p{font-size:24px;color:#B7BFCB;margin-top:16px;max-width:700px;line-height:1.6}
.bar{position:absolute;inset-inline:0;bottom:0;height:8px;background:#C9A15B}
</style></head><body><div class="frame">
<svg viewBox="0 0 600 600">${[90, 150, 210, 270].map((r, i) => `<circle cx="300" cy="300" r="${r}" opacity="${0.22 - i * 0.045}"/>`).join("")}</svg>
<img class="sym" src="${assets}/img/brand/ampliq-symbol.webp" alt="">
<img class="word" src="${assets}/img/brand/ampliq-wordmark-dark.webp" alt="">
<div class="over">${esc(page.overline)}</div>
<h1>${esc(page.title)}</h1>
${page.sub ? `<p>${esc(page.sub)}</p>` : ""}
<div class="bar"></div>
</div></body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 } });
const tab = await ctx.newPage();
let current = "";
await tab.route(`${ORIGIN}/**`, async (route) => {
  const path = new URL(route.request().url()).pathname;
  if (path === "/page") return route.fulfill({ contentType: "text/html; charset=utf-8", body: current });
  const ext = path.split(".").pop();
  return route.fulfill({ contentType: TYPES[ext] || "application/octet-stream", body: await readFile(`src${decodeURI(path)}`) });
});
let n = 0;
for (const lang of ["ar", "en"]) {
  await mkdir(`src/assets/og/${lang}`, { recursive: true });
  for (const page of pagesFor(lang)) {
    current = html(lang, page);
    await tab.goto(`${ORIGIN}/page`, { waitUntil: "load" });
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: `src/assets/og/${lang}/${page.key}.jpg`, type: "jpeg", quality: 82 });
    n++;
  }
}
await browser.close();
console.log(`Wrote ${n} share images to src/assets/og/`);
