// Builds the static Ampliq website into ./dist (no dependencies — Node 18+).
//   Arabic (default, RTL) at the site root, English (LTR) under /en/.

import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import config from "./src/config.mjs";
import ar from "./src/content/ar.mjs";
import en from "./src/content/en.mjs";
import { relLink, relFile, readMinutes } from "./src/lib.mjs";
import { renderDocument } from "./src/templates/layout.mjs";
import * as pages from "./src/templates/pages.mjs";

const OUT = "dist";
const content = { ar, en };
const LANGS = ["ar", "en"];
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ---------- content checks ----------
// Both languages must have the same shape, or one site silently loses content.
function checkParity(a, b, path) {
  if (Array.isArray(a) !== Array.isArray(b) || typeof a !== typeof b) throw new Error(`ar/en mismatch at ${path}: different types`);
  if (Array.isArray(a)) {
    if (a.length !== b.length) throw new Error(`ar/en mismatch at ${path}: ${a.length} vs ${b.length} items`);
    a.forEach((x, i) => checkParity(x, b[i], `${path}[${i}]`));
  } else if (a && typeof a === "object") {
    const ka = Object.keys(a).sort().join();
    const kb = Object.keys(b).sort().join();
    if (ka !== kb) throw new Error(`ar/en mismatch at ${path}: keys {${ka}} vs {${kb}}`);
    Object.keys(a).forEach((k) => checkParity(a[k], b[k], `${path}.${k}`));
  }
}
checkParity(ar, en, "content");

const blogFiles = (await readdir("src/content/blog")).filter((f) => f.endsWith(".mjs")).sort();
const posts = [];
for (const f of blogFiles) {
  const post = (await import(`./src/content/blog/${f}`)).default;
  checkParity(post.ar, post.en, `blog/${f}`);
  if (!ar.services.some((s) => s.slug === post.service)) throw new Error(`blog/${f}: unknown service "${post.service}"`);
  posts.push(post);
}
posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));

for (const lang of LANGS) {
  const text = JSON.stringify(content[lang]) + JSON.stringify(posts.map((p) => p[lang]));
  // Persian letters that look Arabic (پ چ ژ گ ک ی) break search and spelling.
  if (lang === "ar" && /[پچژگکی]/.test(text)) throw new Error("Arabic content contains Persian letters (پ چ ژ گ ک ی)");
}

// ---------- routes ----------
const ROUTES = { home: "", about: "about/", services: "services/", clients: "clients/", blog: "blog/", contact: "contact/", privacy: "privacy/", terms: "terms/" };
const routePath = (lang, key) => {
  const prefix = lang === "en" ? "en/" : "";
  if (key.startsWith("service:")) return `${prefix}services/${key.slice(8)}/`;
  if (key.startsWith("article:")) return `${prefix}blog/${key.slice(8)}/`;
  if (!(key in ROUTES)) throw new Error(`Unknown route: ${key}`);
  return prefix + ROUTES[key];
};

const siteUrl = (process.env.SITE_URL || config.siteUrl).replace(/\/+$/, "");
const cfg = { ...config, siteUrl };

// ---------- assets ----------
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("src/assets", `${OUT}/assets`, { recursive: true });
await mkdir(`${OUT}/assets/css`, { recursive: true });
await mkdir(`${OUT}/assets/js`, { recursive: true });
const css = await readFile("src/styles/main.css", "utf8");
const js = await readFile("src/scripts/main.js", "utf8");
await writeFile(`${OUT}/assets/css/main.css`, css);
await writeFile(`${OUT}/assets/js/main.js`, js);
const assetVersion = createHash("sha256").update(css).update(js).digest("hex").slice(0, 10);

// ---------- pages ----------
const localizedPosts = (lang) =>
  posts.map((p) => ({
    slug: p.slug,
    service: p.service,
    date: p.date,
    icon: p.icon,
    category: content[lang].services.find((s) => s.slug === p.service).title,
    minutes: readMinutes(p[lang].blocks),
    ...p[lang],
  }));

function makeCtx(lang, key, { absolute = false } = {}) {
  const t = content[lang];
  const otherLang = lang === "ar" ? "en" : "ar";
  const path = routePath(lang, key);
  const ogKey = key.replace(":", "-");
  const ogCandidates = [`assets/og/${lang}/${ogKey}.jpg`, `assets/og/${lang}/home.jpg`, "assets/icons/icon-512.png"];
  const ogFile = ogCandidates.find((f) => existsSync(`src/${f}`)) ?? ogCandidates[2];
  return {
    t,
    lang,
    config: cfg,
    key,
    path,
    altPath: routePath(otherLang, key),
    arPath: routePath("ar", key),
    other: { lang: otherLang, t: content[otherLang] },
    routePath: (k) => routePath(lang, k),
    link: (k) => (absolute ? `/${routePath(lang, k)}` : relLink(path, routePath(lang, k))),
    otherLink: (k) => (absolute ? `/${routePath(otherLang, k)}` : relLink(path, routePath(otherLang, k))),
    altLink: absolute ? `/${routePath(otherLang, key)}` : relLink(path, routePath(otherLang, key)),
    asset: (p) => (absolute ? `/assets/${p}` : relFile(path, `assets/${p}`)),
    file: (p) => (absolute ? `/${p}` : relFile(path, p)),
    services: t.services,
    articles: localizedPosts(lang),
    ogFile,
    assetVersion,
  };
}

const sitemap = { ar: [], en: [] };
async function emit(lang, key, page, lastmod = BUILD_DATE) {
  const ctx = makeCtx(lang, key);
  const result = typeof page === "function" ? page(ctx) : page;
  const html = renderDocument(ctx, result);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) throw new Error(`${ctx.path || "/"}: expected one <h1>, found ${h1s}`);
  await mkdir(`${OUT}/${ctx.path}`, { recursive: true });
  await writeFile(`${OUT}/${ctx.path}index.html`, html);
  sitemap[lang].push({ path: ctx.path, alt: ctx.altPath, arPath: ctx.arPath, lastmod });
}

let count = 0;
for (const lang of LANGS) {
  const t = content[lang];
  await emit(lang, "home", pages.home);
  await emit(lang, "about", pages.about);
  await emit(lang, "services", pages.services);
  for (const s of t.services) await emit(lang, `service:${s.slug}`, (ctx) => pages.service(ctx, s));
  await emit(lang, "clients", pages.clients);
  await emit(lang, "blog", pages.blog, posts[0]?.date ?? BUILD_DATE);
  for (const a of localizedPosts(lang)) await emit(lang, `article:${a.slug}`, (ctx) => pages.article(ctx, a), a.date);
  await emit(lang, "contact", pages.contact);
  await emit(lang, "privacy", (ctx) => pages.legal(ctx, "privacy"), t.pages.privacy.updated);
  await emit(lang, "terms", (ctx) => pages.legal(ctx, "terms"), t.pages.terms.updated);
  count += sitemap[lang].length;
}

// 404: served for unknown paths at any depth, so it uses root-absolute URLs.
{
  const ctx = makeCtx("ar", "home", { absolute: true });
  const html = renderDocument(ctx, pages.notFound(ctx, en))
    .replace(/\n<link rel="(canonical|alternate)"[^>]*>|\n<meta property="og:url"[^>]*>/g, "")
    .replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
  await writeFile(`${OUT}/404.html`, html);
}

// ---------- site files ----------
await writeFile(
  `${OUT}/site.webmanifest`,
  JSON.stringify(
    {
      name: "Ampliq",
      short_name: "Ampliq",
      start_url: "./",
      display: "browser",
      background_color: "#0B1A2E",
      theme_color: "#07111F",
      icons: [
        { src: "assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "assets/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2
  ) + "\n"
);

await writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ""}`);
if (siteUrl) {
  const xml = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((e) => {
    const [arP, enP] = e.path.startsWith("en/") ? [e.alt, e.path] : [e.path, e.alt];
    return `  <url>
    <loc>${siteUrl}/${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="ar" href="${siteUrl}/${arP}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/${enP}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/${arP}"/>
  </url>`;
  })
  .join("\n")}
</urlset>
`;
  await writeFile(`${OUT}/sitemap-ar.xml`, xml(sitemap.ar));
  await writeFile(`${OUT}/sitemap-en.xml`, xml(sitemap.en));
  await writeFile(
    `${OUT}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${siteUrl}/sitemap-ar.xml</loc><lastmod>${BUILD_DATE}</lastmod></sitemap>
  <sitemap><loc>${siteUrl}/sitemap-en.xml</loc><lastmod>${BUILD_DATE}</lastmod></sitemap>
</sitemapindex>
`
  );
}

console.log(`Built ${count} pages (${sitemap.ar.length} Arabic, ${sitemap.en.length} English) + 404 into ${OUT}/ — assets v${assetVersion}`);
const missing = Object.entries(config.contact).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) console.log(`Note: contact ${missing.join(", ")} not set in src/config.mjs — placeholders are shown.`);
if (!config.form.endpoint) console.log("Note: form.endpoint not set — the form falls back to email" + (config.contact.email ? "." : " (also not set)."));
if (!siteUrl) console.log("Note: siteUrl not set — canonical/hreflang tags and sitemaps are skipped.");
