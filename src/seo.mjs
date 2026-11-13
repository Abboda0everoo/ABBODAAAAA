// Central SEO helpers: <head> metadata and the site-wide structured data.
// Every page gets its title, description, robots, canonical, hreflang,
// Open Graph and Twitter tags from here, so the rules live in one place.

import { esc } from "./lib.mjs";

export const absUrl = (config, p = "") => (config.siteUrl ? `${config.siteUrl}/${p}` : "");
const idOf = (config, name) => (config.siteUrl ? `${config.siteUrl}/#${name}` : undefined);

// ---------- <head> ----------
export function headTags(ctx, page) {
  const { t, lang, config } = ctx;
  const { meta, ogType = "website" } = page;
  const abs = (p) => absUrl(config, p);
  const ogImage = config.siteUrl ? abs(ctx.ogFile) : ctx.asset(ctx.ogFile.replace(/^assets\//, ""));
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    // A page hidden from search keeps "follow" so its links are still crawled;
    // it gets no canonical or hreflang, which would contradict the noindex.
    `<meta name="robots" content="${ctx.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">`,
  ];
  if (config.googleVerification) tags.push(`<meta name="google-site-verification" content="${esc(config.googleVerification)}">`);
  if (config.siteUrl && !ctx.noindex) {
    tags.push(`<link rel="canonical" href="${abs(ctx.path)}">`);
    if (ctx.hasAlt) {
      tags.push(
        `<link rel="alternate" hreflang="${lang}" href="${abs(ctx.path)}">`,
        `<link rel="alternate" hreflang="${ctx.other.lang}" href="${abs(ctx.altPath)}">`,
        `<link rel="alternate" hreflang="x-default" href="${abs(ctx.arPath)}">`
      );
    }
  }
  if (config.siteUrl) tags.push(`<meta property="og:url" content="${abs(ctx.path)}">`);
  tags.push(
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="Ampliq">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:locale" content="${t.locale}">`,
    ...(ctx.hasAlt ? [`<meta property="og:locale:alternate" content="${ctx.other.t.locale}">`] : []),
    `<meta property="og:image" content="${esc(ogImage)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(meta.title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<meta name="twitter:image" content="${esc(ogImage)}">`
  );
  return tags.join("\n");
}

// ---------- structured data ----------
// One Organization (and WebSite) with a fixed @id, repeated identically on
// every page; page-level schema points at it instead of redefining it.
export function organization(ctx) {
  const { config, t } = ctx;
  const { email, phone } = config.contact;
  return {
    "@type": "Organization",
    ...(idOf(config, "organization") ? { "@id": idOf(config, "organization") } : {}),
    name: "Ampliq",
    alternateName: "AMPLIQ",
    slogan: "Amplify Your Business Impact",
    description: t.pages.home.meta.description,
    ...(config.siteUrl
      ? { url: `${config.siteUrl}/`, logo: { "@type": "ImageObject", url: absUrl(config, "assets/icons/icon-512.png"), width: 512, height: 512 } }
      : {}),
    address: { "@type": "PostalAddress", addressLocality: t.lang === "ar" ? "الرياض" : "Riyadh", addressCountry: "SA" },
    // The markets stated on the site ("4 Arab markets" in the shared numbers).
    areaServed: ["Saudi Arabia", "Egypt", "United Arab Emirates", "Iraq"].map((name) => ({ "@type": "Country", name })),
    ...(email ? { email } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(config.social.length ? { sameAs: config.social.map((s) => s.url) } : {}),
    ...(email || phone
      ? { contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["Arabic", "English"], ...(email ? { email } : {}), ...(phone ? { telephone: phone } : {}) } }
      : {}),
  };
}

export function website(ctx) {
  const { config } = ctx;
  return {
    "@type": "WebSite",
    ...(idOf(config, "website") ? { "@id": idOf(config, "website") } : {}),
    name: "Ampliq",
    ...(config.siteUrl ? { url: `${config.siteUrl}/` } : {}),
    inLanguage: ["ar", "en"],
    publisher: orgRef(ctx),
  };
}

// A reference to the Organization: its @id when the site URL is known,
// otherwise the minimal inline entity.
export const orgRef = (ctx) => (ctx.config.siteUrl ? { "@id": idOf(ctx.config, "organization") } : { "@type": "Organization", name: "Ampliq" });

export const siteGraph = (ctx) => ({ "@context": "https://schema.org", "@graph": [organization(ctx), website(ctx)] });
