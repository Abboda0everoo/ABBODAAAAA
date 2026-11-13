// Quality checks on the built site in dist/ (run after a build with the site URL set):
//   SITE_URL=https://ampliq.netlify.app npm run build && npm run check   (or: npm test)
// Fails on broken structure (links, canonical, hreflang, sitemap, JSON-LD,
// leaked secrets); warns on content issues (duplicate titles/descriptions,
// lengths) so an editor's wording never blocks a deploy.

import { readFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "dist";
const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(OUT);
const htmlFiles = files.filter((f) => f.endsWith(".html") && !f.startsWith(`${OUT}/admin/`));
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => decode(tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? "");
const tags = (html, re) => html.match(re) || [];
const urlPath = (f) => "/" + f.slice(OUT.length + 1).replace(/index\.html$/, "");

// Site URL: from the canonical of the home page.
const home = await readFile(`${OUT}/index.html`, "utf8");
const siteUrl = attr(tags(home, /<link rel="canonical"[^>]*>/)[0] || "", "href").replace(/\/$/, "");
if (!siteUrl) console.log("Note: no canonical on the home page — build with SITE_URL set to check canonical, hreflang and sitemaps.");

const pages = new Map(); // path → { noindex, canonical, alternates, title, description }
for (const f of htmlFiles) {
  const html = await readFile(f, "utf8");
  const path = urlPath(f);
  const is404 = f === `${OUT}/404.html`;
  const head = html.slice(0, html.indexOf("</head>"));

  const htmlTag = html.match(/<html[^>]*>/)?.[0] || "";
  const lang = attr(htmlTag, "lang");
  const dir = attr(htmlTag, "dir");
  if (!{ ar: "rtl", en: "ltr" }[lang] || { ar: "rtl", en: "ltr" }[lang] !== dir) err(path, `<html lang="${lang}" dir="${dir}"> is not ar/rtl or en/ltr`);

  const titles = tags(head, /<title>[^<]*<\/title>/g);
  const descs = tags(head, /<meta name="description"[^>]*>/g);
  if (titles.length !== 1) err(path, `expected one <title>, found ${titles.length}`);
  if (descs.length !== 1) err(path, `expected one meta description, found ${descs.length}`);
  const h1 = tags(html, /<h1[\s>]/g).length;
  if (h1 !== 1) err(path, `expected one <h1>, found ${h1}`);
  const title = decode(titles[0]?.replace(/<\/?title>/g, "") || "");
  const description = attr(descs[0] || "", "content");
  if (!is404) {
    if (title.length > 65) warn(path, `title is ${title.length} characters (aim for ≤ 60)`);
    if (description.length < 70 || description.length > 170) warn(path, `description is ${description.length} characters (aim for 70–160)`);
  }

  const robots = attr(tags(head, /<meta name="robots"[^>]*>/)[0] || "", "content");
  const noindex = /noindex/.test(robots);
  const canonicals = tags(head, /<link rel="canonical"[^>]*>/g).map((t) => attr(t, "href"));
  const alternates = tags(head, /<link rel="alternate" hreflang[^>]*>/g).map((t) => ({ lang: attr(t, "hreflang"), href: attr(t, "href") }));
  if (siteUrl && !is404) {
    if (noindex) {
      if (canonicals.length || alternates.length) err(path, "noindex page must not carry canonical or hreflang links");
    } else {
      if (canonicals.length !== 1) err(path, `expected one canonical, found ${canonicals.length}`);
      else if (canonicals[0] !== siteUrl + path) err(path, `canonical ${canonicals[0]} is not the page's own URL`);
    }
  }
  if (is404 && !noindex) err(path, "404 page must be noindex");

  // JSON-LD must parse and carry a context.
  for (const block of tags(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/g)) {
    try {
      const data = JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/g, ""));
      if (data["@context"] !== "https://schema.org") err(path, "JSON-LD block without @context https://schema.org");
    } catch (e) {
      err(path, `invalid JSON-LD (${e.message})`);
    }
  }

  // Internal links and assets must exist (relative or root-absolute; query/hash ignored).
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = decode(m[1]);
    if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(url)) continue;
    const clean = url.split(/[?#]/)[0];
    if (!clean) continue;
    let target = clean.startsWith("/") ? join(OUT, clean) : join(f, "..", clean);
    if (clean.endsWith("/") || (existsSync(target) && statSync(target).isDirectory())) target = join(target, "index.html");
    if (!existsSync(target)) err(path, `broken link ${url}`);
  }

  if (!is404) pages.set(path, { noindex, canonical: canonicals[0], alternates, title, description });
}

// hreflang: every alternate exists, is indexable, and links back.
if (siteUrl) {
  for (const [path, p] of pages) {
    for (const a of p.alternates) {
      const target = pages.get(a.href.slice(siteUrl.length));
      if (!target) { err(path, `hreflang ${a.lang} → ${a.href} is not a page of this site`); continue; }
      if (target.noindex) err(path, `hreflang ${a.lang} → ${a.href} is noindex`);
      if (a.lang !== "x-default" && !target.alternates.some((b) => b.href === siteUrl + path)) err(path, `hreflang ${a.lang} → ${a.href} does not link back`);
    }
  }
}

// Duplicate titles and descriptions among indexable pages.
for (const field of ["title", "description"]) {
  const seen = new Map();
  for (const [path, p] of pages) {
    if (p.noindex) continue;
    if (seen.has(p[field])) warn(path, `same ${field} as ${seen.get(p[field])}`);
    else seen.set(p[field], path);
  }
}

// Sitemaps: valid lists of exactly the indexable pages.
if (siteUrl) {
  const index = await readFile(`${OUT}/sitemap.xml`, "utf8").catch(() => "");
  if (!index.includes("<sitemapindex")) err("/sitemap.xml", "missing or not a sitemap index");
  const listed = new Set();
  for (const loc of index.match(/<loc>[^<]+<\/loc>/g) || []) {
    const file = join(OUT, loc.slice(5, -6).slice(siteUrl.length));
    const xml = await readFile(file, "utf8").catch(() => "");
    if (!xml.includes("<urlset")) { err(file, "listed in sitemap.xml but missing"); continue; }
    for (const entry of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
      const url = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] || "";
      const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || "";
      const page = pages.get(url.slice(siteUrl.length));
      if (!url.startsWith(siteUrl + "/") || !page) err(file, `${url} is not a page of this site`);
      else if (page.noindex) err(file, `${url} is noindex but listed`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) err(file, `${url} has lastmod "${lastmod}"`);
      listed.add(url);
    }
  }
  for (const [path, p] of pages) if (!p.noindex && !listed.has(siteUrl + path)) err(path, "indexable page missing from the sitemap");

  const robots = await readFile(`${OUT}/robots.txt`, "utf8").catch(() => "");
  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) err("/robots.txt", "no Sitemap line");
  if (/^Disallow:\s*\/\s*$/m.test(robots)) err("/robots.txt", "a group disallows the whole site");
  for (const bot of ["Googlebot", "Bingbot", "OAI-SearchBot"]) if (!robots.includes(`User-agent: ${bot}`)) err("/robots.txt", `${bot} not listed`);

  const llms = await readFile(`${OUT}/llms.txt`, "utf8").catch(() => "");
  if (!llms.startsWith("# ")) err("/llms.txt", "missing or without a title");
  for (const m of llms.matchAll(/\]\((https?:[^)]+)\)/g)) {
    const p = m[1].slice(siteUrl.length);
    if (!m[1].startsWith(siteUrl) || (!pages.has(p) && !existsSync(join(OUT, p)))) err("/llms.txt", `link ${m[1]} is not on this site`);
  }
}

// No secrets in public files.
const SECRET = /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})\b|client_secret|BEGIN [A-Z ]*PRIVATE KEY/;
for (const f of files.filter((x) => /\.(html|js|css|json|yml|txt|xml|webmanifest)$/.test(x))) {
  if (SECRET.test(await readFile(f, "utf8"))) err(f, "looks like it contains a secret key or token");
}

for (const w of warnings) console.log(`Warning: ${w}`);
for (const e of errors) console.log(`Error: ${e}`);
const indexable = [...pages.values()].filter((p) => !p.noindex).length;
console.log(`Checked ${htmlFiles.length} HTML files (${indexable} indexable): ${errors.length} error(s), ${warnings.length} warning(s).`);
if (errors.length) process.exit(1);
