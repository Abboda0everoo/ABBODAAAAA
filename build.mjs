// Builds the static Ampliq website into ./dist (Node 20+).
//   Arabic (default, RTL) at the site root, English (LTR) under /en/.
//   Content lives in src/content/**/*.json and is edited from the dashboard at /admin/.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadContent, contentWarnings, lastModified, latestDate, LANGS } from "./src/content.mjs";
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

// Pages hidden from search engines (dashboard → "hide from search engines").
// The flag is shared by both languages of a page.
function isNoindex(key) {
  const t = content.ar;
  if (key.startsWith("service:")) return Boolean(t.services.find((s) => s.slug === key.slice(8))?.noindex);
  if (key.startsWith("article:")) return Boolean(t.posts.find((a) => a.slug === key.slice(8))?.noindex);
  return Boolean(t.pages[key]?.noindex);
}

// Last real content change per page (git history of the files it shows), for
// the sitemap. Navigation/footer texts (general.json) are left out on purpose.
function pageModified(key) {
  if (key.startsWith("service:")) return lastModified(`services/${key.slice(8)}.json`);
  if (key.startsWith("article:")) return posts.find((a) => a.slug === key.slice(8))?.modified;
  const files = {
    home: ["pages/home.json", "shared.json", "services", "blog", "clients.json"],
    about: ["pages/about.json", "shared.json"],
    services: ["pages/services.json", "shared.json", "services"],
    clients: ["pages/clients.json", "shared.json", "clients.json"],
    blog: ["pages/blog.json", "blog"],
    contact: ["pages/contact.json"],
  }[key];
  if (files) return lastModified(...files);
  if (key === "privacy" || key === "terms") return latestDate(content.ar.pages[key].updated, lastModified(`pages/${key}.json`));
  return "";
}

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
    noindex: isNoindex(key),
  };
}

const sitemap = { ar: [], en: [] };
let count = 0;
const published = { ar: [], en: [] }; // indexable pages, for llms.txt
async function emit(lang, key, page) {
  const ctx = makeCtx(lang, key);
  const result = typeof page === "function" ? page(ctx) : page;
  const html = renderDocument(ctx, result);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) throw new Error(`${ctx.path || "/"}: expected one <h1>, found ${h1s}`);
  await mkdir(`${OUT}/${ctx.path}`, { recursive: true });
  await writeFile(`${OUT}/${ctx.path}index.html`, html);
  count++;
  if (ctx.noindex) return;
  sitemap[lang].push({ path: ctx.path, alt: ctx.hasAlt ? ctx.altPath : null, lastmod: pageModified(key) || BUILD_DATE });
  const meta = result.meta;
  published[lang].push({ key, path: ctx.path, title: meta.title, description: meta.description });
}

for (const lang of LANGS) {
  const t = content[lang];
  await emit(lang, "home", pages.home);
  await emit(lang, "about", pages.about);
  await emit(lang, "services", pages.services);
  for (const s of t.services) await emit(lang, `service:${s.slug}`, (ctx) => pages.service(ctx, s));
  await emit(lang, "clients", pages.clients);
  await emit(lang, "blog", pages.blog);
  for (const a of t.posts) await emit(lang, `article:${a.slug}`, (ctx) => pages.article(ctx, a));
  await emit(lang, "contact", pages.contact);
  await emit(lang, "privacy", (ctx) => pages.legal(ctx, "privacy"));
  await emit(lang, "terms", (ctx) => pages.legal(ctx, "terms"));
}

// 404: served for unknown paths at any depth, so it uses root-absolute URLs.
{
  const ctx = makeCtx("ar", "home", { absolute: true });
  const html = renderDocument(ctx, pages.notFound(ctx, content.en))
    .replace(/\n<link rel="(canonical|alternate)"[^>]*>|\n<meta property="og:url"[^>]*>/g, "")
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">');
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

// ---------- crawl files ----------
// Search and AI-answer crawlers are named explicitly so a later rule for "*"
// can't shut them out by accident. GPTBot (model training, not ChatGPT search)
// follows the "*" group: allowed unless the company decides otherwise.
const SEARCH_BOTS = ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Claude-SearchBot"];
await writeFile(
  `${OUT}/robots.txt`,
  `# Ampliq — public pages are open to search engines and AI answer engines.
# /admin/ is the content dashboard (protected by GitHub login, not by this file).

User-agent: *
Allow: /
Disallow: /admin/

${SEARCH_BOTS.map((b) => `User-agent: ${b}`).join("\n")}
Allow: /
Disallow: /admin/
${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ""}`
);

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
  const newest = (entries) => latestDate(...entries.map((e) => e.lastmod)) || BUILD_DATE;
  await writeFile(`${OUT}/sitemap-ar.xml`, xml(sitemap.ar));
  await writeFile(`${OUT}/sitemap-en.xml`, xml(sitemap.en));
  await writeFile(
    `${OUT}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${siteUrl}/sitemap-ar.xml</loc><lastmod>${newest(sitemap.ar)}</lastmod></sitemap>
  <sitemap><loc>${siteUrl}/sitemap-en.xml</loc><lastmod>${newest(sitemap.en)}</lastmod></sitemap>
</sitemapindex>
`
  );

  // llms.txt: a plain-text map of the published pages for AI tools. Built only
  // from what the site itself publishes; no guarantee any platform reads it.
  const en = content.en;
  const ar = content.ar;
  const list = (lang, keys) =>
    published[lang]
      .filter((p) => keys(p.key))
      .map((p) => `- [${p.title.replace(/\s*\|\s*Ampliq$/, "")}](${siteUrl}/${p.path}): ${p.description}`)
      .join("\n");
  const contactLines = [
    `- Contact page: ${siteUrl}/en/contact/`,
    config.contact.email && `- Email: ${config.contact.email}`,
    config.contact.phone && `- Phone and WhatsApp: ${config.contact.phone}`,
    `- Location: ${en.contact.location}`,
  ].filter(Boolean);
  const core = (k) => ["home", "about", "services", "clients", "contact"].includes(k);
  const section = (title, body) => (body ? `## ${title}\n\n${body}\n` : "");
  await writeFile(
    `${OUT}/llms.txt`,
    `# Ampliq

> ${en.pages.home.meta.description}

Ampliq (AMPLIQ) — "${en.ui.tagline}". The website is bilingual: Arabic at the root (${siteUrl}/) and English under ${siteUrl}/en/. Descriptions below are taken from the published pages.

${section("Services", list("en", (k) => k.startsWith("service:")))}
${section("Company", list("en", core))}
${section("Insights", list("en", (k) => k.startsWith("article:")))}
## Contact

${contactLines.join("\n")}

## بالعربية

> ${ar.pages.home.meta.description}

${section("الخدمات", list("ar", (k) => k.startsWith("service:")))}
${section("الشركة", list("ar", core))}
${section("المقالات", list("ar", (k) => k.startsWith("article:")))}
## Optional

- [Sitemap](${siteUrl}/sitemap.xml)
- [Privacy policy](${siteUrl}/en/privacy/)
- [Terms of use](${siteUrl}/en/terms/)
`.replace(/\n{3,}/g, "\n\n")
  );
}

console.log(`Built ${count} pages (${sitemap.ar.length + sitemap.en.length} indexable) + 404 + /admin/ into ${OUT}/ — assets v${assetVersion}`);
for (const w of contentWarnings()) console.log(`Warning: ${w}`);
const missing = Object.entries(config.contact).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) console.log(`Note: contact ${missing.join(", ")} not set (dashboard → Settings) — placeholders are shown.`);
if (!config.form.endpoint) console.log("Note: form endpoint not set — the form falls back to email" + (config.contact.email ? "." : " (also not set)."));
if (!siteUrl) console.log("Note: site URL not set — canonical/hreflang tags, sitemaps and llms.txt are skipped.");
