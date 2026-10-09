// Builds the static Ampliq website into ./dist (Node 20+).
//   Arabic (default, RTL) at the site root, English (LTR) under /en/.
//   Content lives in src/content/**/*.json and is edited from the dashboard at /admin/.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadContent, contentWarnings, LANGS } from "./src/content.mjs";
import { cmsConfig } from "./src/admin/config.mjs";
import { relLink, relFile } from "./src/lib.mjs";
import { renderDocument } from "./src/templates/layout.mjs";
import * as pages from "./src/templates/pages.mjs";

const OUT = "dist";
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const { content, config } = await loadContent();
const { siteUrl } = config;
const posts = content.ar.posts;

// ---------- routes ----------
const ROUTES = { home: "", about: "about/", services: "services/", clients: "clients/", blog: "blog/", contact: "contact/", privacy: "privacy/", terms: "terms/" };
const routePath = (lang, key) => {
  const prefix = lang === "en" ? "en/" : "";
  if (key.startsWith("service:")) return `${prefix}services/${key.slice(8)}/`;
  if (key.startsWith("article:")) return `${prefix}blog/${key.slice(8)}/`;
  if (!(key in ROUTES)) throw new Error(`Unknown route: ${key}`);
  return prefix + ROUTES[key];
};

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
// Uploaded images are stored as site-absolute paths ("/assets/uploads/x.jpg").
const isSiteFile = (p) => typeof p === "string" && /^\/[^/]/.test(p);

function makeCtx(lang, key, { absolute = false } = {}) {
  const t = content[lang];
  const otherLang = lang === "ar" ? "en" : "ar";
  const path = routePath(lang, key);
  const ogKey = key.replace(":", "-");
  // Share image: the page's own, else an article's cover, else the home image.
  const cover = key.startsWith("article:") ? t.posts.find((a) => a.slug === key.slice(8))?.cover : "";
  const ogCandidates = [`assets/og/${lang}/${ogKey}.jpg`, isSiteFile(cover) ? cover.slice(1) : null, `assets/og/${lang}/home.jpg`, "assets/icons/icon-512.png"].filter(Boolean);
  const ogFile = ogCandidates.find((f) => existsSync(`src/${f}`)) ?? "assets/icons/icon-512.png";
  const file = (p) => (absolute ? `/${p}` : relFile(path, p));
  // Arabic-only articles have no English twin: the language switch goes to the English blog.
  const hasAlt = !key.startsWith("article:") || content[otherLang].posts.some((a) => a.slug === key.slice(8));
  const altKey = hasAlt ? key : "blog";
  return {
    t,
    lang,
    config,
    key,
    path,
    hasAlt,
    altPath: routePath(otherLang, altKey),
    arPath: routePath("ar", key),
    other: { lang: otherLang, t: content[otherLang] },
    routePath: (k) => routePath(lang, k),
    link: (k) => (absolute ? `/${routePath(lang, k)}` : relLink(path, routePath(lang, k))),
    otherLink: (k) => (absolute ? `/${routePath(otherLang, k)}` : relLink(path, routePath(otherLang, k))),
    altLink: absolute ? `/${routePath(otherLang, altKey)}` : relLink(path, routePath(otherLang, altKey)),
    asset: (p) => (absolute ? `/assets/${p}` : relFile(path, `assets/${p}`)),
    file,
    // CMS image fields: full URLs pass through, "/assets/…" becomes relative.
    media: (p) => (isSiteFile(p) ? file(p.slice(1)) : p || ""),
    // Markdown HTML: make "/…" links and images relative too; on Arabic pages
    // mark the Latin brand name as English (as txt() does for plain text).
    fixUrls: (html) => {
      const out = html.replace(/(\s(?:src|href))="\/(?!\/)([^"]*)"/g, (_, attr, p) => `${attr}="${file(p)}"`);
      return lang === "ar" ? out.replace(/>[^<]+/g, (text) => text.replace(/Ampliq/g, '<span lang="en">Ampliq</span>')) : out;
    },
    services: t.services,
    articles: t.posts,
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
  sitemap[lang].push({ path: ctx.path, alt: ctx.hasAlt ? ctx.altPath : null, lastmod });
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
  for (const a of t.posts) await emit(lang, `article:${a.slug}`, (ctx) => pages.article(ctx, a), a.date);
  await emit(lang, "contact", pages.contact);
  await emit(lang, "privacy", (ctx) => pages.legal(ctx, "privacy"), t.pages.privacy.updated);
  await emit(lang, "terms", (ctx) => pages.legal(ctx, "terms"), t.pages.terms.updated);
  count += sitemap[lang].length;
}

// 404: served for unknown paths at any depth, so it uses root-absolute URLs.
{
  const ctx = makeCtx("ar", "home", { absolute: true });
  const html = renderDocument(ctx, pages.notFound(ctx, content.en))
    .replace(/\n<link rel="(canonical|alternate)"[^>]*>|\n<meta property="og:url"[^>]*>/g, "")
    .replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
  await writeFile(`${OUT}/404.html`, html);
}

// ---------- dashboard (Decap CMS at /admin/) ----------
await mkdir(`${OUT}/admin`, { recursive: true });
await cp("src/admin/index.html", `${OUT}/admin/index.html`);
await cp("src/admin/cms.js", `${OUT}/admin/cms.js`);
// JSON is valid YAML; Decap reads config.yml next to the admin page.
await writeFile(`${OUT}/admin/config.yml`, JSON.stringify(cmsConfig({ siteUrl }), null, 2) + "\n");

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

await writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /admin/\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ""}`);
if (siteUrl) {
  const xml = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((e) => {
    if (!e.alt) return `  <url>
    <loc>${siteUrl}/${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
  </url>`;
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

console.log(`Built ${count} pages (${sitemap.ar.length} Arabic, ${sitemap.en.length} English) + 404 + /admin/ into ${OUT}/ — assets v${assetVersion}`);
for (const w of contentWarnings()) console.log(`Warning: ${w}`);
const missing = Object.entries(config.contact).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) console.log(`Note: contact ${missing.join(", ")} not set (dashboard → Settings) — placeholders are shown.`);
if (!config.form.endpoint) console.log("Note: form endpoint not set — the form falls back to email" + (config.contact.email ? "." : " (also not set)."));
if (!siteUrl) console.log("Note: site URL not set — canonical/hreflang tags and sitemaps are skipped.");
