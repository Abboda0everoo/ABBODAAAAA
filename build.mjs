// Builds the static AMPLIQ website into ./dist (no dependencies — Node 18+).
//   dist/index.html      Arabic (default, RTL)
//   dist/en/index.html   English (LTR)

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import config from "./src/config.mjs";
import ar from "./src/content/ar.mjs";
import en from "./src/content/en.mjs";
import { render404, renderPage } from "./src/template.mjs";

const OUT = "dist";

// Both languages must have the same shape, or one page silently loses content.
function checkParity(a, b, path = "content") {
  if (Array.isArray(a) !== Array.isArray(b) || typeof a !== typeof b) {
    throw new Error(`ar/en mismatch at ${path}: different types`);
  }
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
checkParity(ar, en);

const siteUrl = config.siteUrl.replace(/\/+$/, "");
const cfg = { ...config, siteUrl };

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/en`, { recursive: true });
await cp("src/assets", `${OUT}/assets`, { recursive: true });
await mkdir(`${OUT}/assets/css`, { recursive: true });
await mkdir(`${OUT}/assets/js`, { recursive: true });

const css = await readFile("src/styles/main.css", "utf8");
const js = await readFile("src/scripts/main.js", "utf8");
await writeFile(`${OUT}/assets/css/main.css`, css);
await writeFile(`${OUT}/assets/js/main.js`, js);
const assetVersion = createHash("sha256").update(css).update(js).digest("hex").slice(0, 10);

const pages = [
  { t: ar, file: "index.html", base: "", selfPath: "/", otherPath: "en/", otherLang: "en" },
  { t: en, file: "en/index.html", base: "../", selfPath: "/en/", otherPath: "../", otherLang: "ar" },
];
for (const p of pages) {
  await writeFile(`${OUT}/${p.file}`, renderPage({ ...p, config: cfg, assetVersion }));
}
await writeFile(`${OUT}/404.html`, render404({ assetVersion }));

await writeFile(
  `${OUT}/site.webmanifest`,
  JSON.stringify(
    {
      name: "AMPLIQ | أمبليك",
      short_name: "AMPLIQ",
      start_url: "./",
      display: "browser",
      background_color: "#0B1D33",
      theme_color: "#0B1D33",
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
  const alt = `<xhtml:link rel="alternate" hreflang="ar" href="${siteUrl}/"/><xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/"/>`;
  await writeFile(
    `${OUT}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${siteUrl}/</loc>${alt}</url>
  <url><loc>${siteUrl}/en/</loc>${alt}</url>
</urlset>
`
  );
}

const missing = Object.entries(config.contact).filter(([, v]) => !v).map(([k]) => k);
console.log(`Built ${OUT}/index.html (ar) and ${OUT}/en/index.html (en) — assets v${assetVersion}`);
if (missing.length) console.log(`Note: contact ${missing.join(", ")} not set in src/config.mjs — placeholders are shown.`);
if (!siteUrl) console.log("Note: siteUrl not set in src/config.mjs — canonical URLs and sitemap.xml are skipped.");
