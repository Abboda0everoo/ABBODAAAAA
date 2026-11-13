// Page shell: <head> metadata, header, footer and site-wide widgets.

import { esc, txt, icon, brandIcon, num } from "../lib.mjs";

const FONT_PRELOAD = {
  ar: ["fonts/plex-arabic-arabic-400.woff2", "fonts/plex-arabic-arabic-700.woff2"],
  en: ["fonts/montserrat-latin-400-700.woff2"],
};

export function contactMethods(ctx) {
  const { contact } = ctx.config;
  const digits = (s) => s.replace(/[^\d]/g, "");
  return [
    { key: "phone", icon: icon("phone"), value: contact.phone, href: contact.phone ? `tel:+${digits(contact.phone).replace(/^0/, "966")}` : "", event: "phone" },
    { key: "email", icon: icon("mail"), value: contact.email, href: contact.email ? `mailto:${contact.email}` : "", event: "email" },
    { key: "whatsapp", icon: brandIcon("whatsapp"), value: contact.whatsapp ? `+${digits(contact.whatsapp)}` : "", href: contact.whatsapp ? `https://wa.me/${digits(contact.whatsapp)}` : "", event: "whatsapp" },
  ];
}

const SOCIAL_NAMES = { instagram: "Instagram", snapchat: "Snapchat", linkedin: "LinkedIn", x: "X" };

// Icon links to the official social accounts (dashboard → Settings).
export function socialLinks(ctx, cls = "") {
  const { social } = ctx.config;
  if (!social.length) return "";
  const label = ctx.lang === "ar" ? "حسابات Ampliq على مواقع التواصل" : "Ampliq on social media";
  const newTab = ctx.lang === "ar" ? "(تفتح في نافذة جديدة)" : "(opens in a new tab)";
  return `<ul class="social-links${cls ? ` ${cls}` : ""}" aria-label="${label}">${social
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener me" data-social="${s.key}" aria-label="${SOCIAL_NAMES[s.key]} ${newTab}" title="${SOCIAL_NAMES[s.key]}">${brandIcon(s.key)}</a></li>`)
    .join("")}</ul>`;
}

function header(ctx, navKey) {
  const { t } = ctx;
  const items = t.nav
    .map((n) => {
      const current = n.key === navKey ? ' aria-current="page"' : "";
      return `<li><a href="${ctx.link(n.key)}"${current}>${esc(n.label)}</a></li>`;
    })
    .join("");
  return `
<header class="site-header" id="top">
  <div class="container header-inner">
    <a class="brand" href="${ctx.link("home")}">
      <img src="${ctx.asset("img/brand/ampliq-wordmark-dark.webp")}" alt="${esc(t.ui.logoAlt)}" width="138" height="34">
    </a>
    <nav class="nav" id="site-nav" aria-label="${esc(t.ui.mainNav)}">
      <ul>${items}</ul>
      <a class="btn btn--primary nav-cta" href="${ctx.link("contact")}">${esc(t.ui.bookCta)}</a>
    </nav>
    <div class="header-actions">
      <a class="lang-switch" href="${ctx.altLink}" hreflang="${ctx.other.lang}" lang="${ctx.other.lang}" aria-label="${esc(t.ui.switchAria)}" data-lang-switch>${icon("globe")}<span>${esc(t.ui.switchShort)}</span></a>
      <a class="btn btn--ghost btn--sm header-cta" href="${ctx.link("contact")}"${navKey === "contact" ? ' aria-current="page"' : ""}>${esc(t.ui.contactCta)}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${esc(t.ui.menu)}" data-label-open="${esc(t.ui.menu)}" data-label-close="${esc(t.ui.close)}">${icon("menu", "i-open")}${icon("x", "i-close")}</button>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const { t, config, lang } = ctx;
  const company = [
    ["about", t.nav[0].label],
    ["clients", t.nav[2].label],
    ["blog", t.nav[3].label],
    ["contact", t.ui.contactCta],
  ];
  const methods = contactMethods(ctx)
    .map((m) =>
      m.href
        ? `<li>${m.icon}<a href="${esc(m.href)}" dir="ltr" data-contact="${m.event}"${m.key === "whatsapp" ? ' rel="noopener"' : ""}>${esc(m.value)}</a></li>`
        : `<li>${m.icon}<span>${esc(t.contact.placeholders[m.key])}</span></li>`
    )
    .join("");
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="${ctx.asset("img/brand/ampliq-wordmark-dark.webp")}" alt="${esc(t.ui.logoAlt)}" width="162" height="40" loading="lazy">
        <p class="overline" lang="en" dir="ltr">${esc(t.ui.tagline)}</p>
        <p>${txt(t.footer.about, lang)}</p>
        ${socialLinks(ctx)}
      </div>
      <nav aria-labelledby="f-company">
        <h2 class="footer-title" id="f-company">${esc(t.footer.company)}</h2>
        <ul>${company.map(([k, l]) => `<li><a href="${ctx.link(k)}">${esc(l)}</a></li>`).join("")}</ul>
      </nav>
      <nav aria-labelledby="f-services">
        <h2 class="footer-title" id="f-services">${esc(t.footer.services)}</h2>
        <ul>${ctx.services.map((s) => `<li><a href="${ctx.link(`service:${s.slug}`)}">${esc(s.title)}</a></li>`).join("")}<li><a href="${ctx.link("services")}#models">${esc(t.shared.models.title)}</a></li></ul>
      </nav>
      <div>
        <h2 class="footer-title">${esc(t.footer.contact)}</h2>
        <ul class="footer-contact"><li>${icon("map-pin")}<span>${esc(t.contact.location)}</span></li>${methods}</ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${num(config.year)} <span lang="en">Ampliq</span>. ${esc(t.footer.rights)}</p>
      <ul class="footer-legal">
        <li><a href="${ctx.link("privacy")}">${esc(t.footer.privacy)}</a></li>
        <li><a href="${ctx.link("terms")}">${esc(t.footer.terms)}</a></li>
        <li><a href="${ctx.altLink}" hreflang="${ctx.other.lang}" lang="${ctx.other.lang}" data-lang-switch>${esc(t.ui.switchLabel)}</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

function widgets(ctx, title) {
  const { t, config } = ctx;
  let out = "";
  const wa = config.contact.whatsapp.replace(/[^\d]/g, "");
  if (wa) {
    const text = t.ui.whatsappMessage;
    const href = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    // Floating WhatsApp button on every page, with a small message bubble that
    // pops up once per visit (see main.js).
    out += `
<div class="wa-widget" data-wa-widget data-wa-base="https://wa.me/${wa}" data-wa-text="${esc(t.ui.whatsappMessage)}">
  <div class="wa-bubble" hidden data-wa-bubble>
    <button type="button" class="wa-bubble-close" aria-label="${ctx.lang === "ar" ? "إغلاق" : "Close"}" data-wa-close>${icon("x")}</button>
    <a href="${href}" rel="noopener" target="_blank" data-contact="whatsapp" data-wa-link>
      <strong>${esc(t.ui.whatsappBubbleTitle || "")}</strong>
      <span>${esc(t.ui.whatsappBubbleText || "")}</span>
    </a>
  </div>
  <a class="wa-float" href="${href}" rel="noopener" target="_blank" data-contact="whatsapp" data-wa-link aria-label="${esc(t.ui.whatsapp)}" title="${esc(t.ui.whatsapp)}">${brandIcon("whatsapp")}</a>
</div>`;
  }
  if (config.gtmId) {
    out += `
<div class="consent" role="region" aria-label="${esc(t.ui.cookieMore)}" hidden data-consent>
  <p>${esc(t.ui.cookieText)} <a href="${ctx.link("privacy")}">${esc(t.ui.cookieMore)}</a></p>
  <div class="consent-actions">
    <button type="button" class="btn btn--ghost btn--sm" data-consent-choice="denied">${esc(t.ui.cookieReject)}</button>
    <button type="button" class="btn btn--primary btn--sm" data-consent-choice="granted">${esc(t.ui.cookieAccept)}</button>
  </div>
</div>`;
  }
  return out;
}

// Google Tag Manager with Consent Mode v2. GTM loads on every page (so Google
// can detect it), but analytics storage stays "denied" — no analytics cookies —
// until the visitor accepts in the cookie banner. Advertising storage is never
// granted: the privacy policy says the site uses no advertising cookies.
function gtmHead(ids) {
  return `
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  try { if (localStorage.getItem('ampliq-consent') === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' }); } catch (e) {}
  gtag('js', new Date());
  dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
</script>
${ids.map((id) => `<script async src="https://www.googletagmanager.com/gtm.js?id=${id}"></script>`).join("\n")}`;
}

export function renderDocument(ctx, page) {
  const { t, lang, config } = ctx;
  const { meta, body, navKey = null, jsonld = [], ogType = "website" } = page;
  const abs = (p) => (config.siteUrl ? `${config.siteUrl}/${p}` : "");
  const ogImage = config.siteUrl ? abs(ctx.ogFile) : ctx.asset(ctx.ogFile.replace(/^assets\//, ""));
  const seo = config.siteUrl
    ? `
<link rel="canonical" href="${abs(ctx.path)}">
${ctx.hasAlt ? `<link rel="alternate" hreflang="${lang}" href="${abs(ctx.path)}">
<link rel="alternate" hreflang="${ctx.other.lang}" href="${abs(ctx.altPath)}">
<link rel="alternate" hreflang="x-default" href="${abs(ctx.arPath)}">` : ""}
<meta property="og:url" content="${abs(ctx.path)}">`
    : "";
  const siteConfig = {
    lang,
    gtmId: config.gtmId || "",
    formEndpoint: config.form.endpoint || "",
    email: config.contact.email || "",
  };
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="theme-color" content="#07111F">${config.googleVerification ? `
<meta name="google-site-verification" content="${esc(config.googleVerification)}">` : ""}${seo}
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Ampliq">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${ctx.other.t.locale}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ctx.asset("icons/favicon.ico")}" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${ctx.asset("icons/favicon-32.png")}">
<link rel="apple-touch-icon" href="${ctx.asset("icons/apple-touch-icon.png")}">
<link rel="manifest" href="${ctx.file("site.webmanifest")}">
${FONT_PRELOAD[lang].map((f) => `<link rel="preload" href="${ctx.asset(f)}" as="font" type="font/woff2" crossorigin>`).join("\n")}
<link rel="stylesheet" href="${ctx.asset("css/main.css")}?v=${ctx.assetVersion}">${config.gtmIds.length ? gtmHead(config.gtmIds) : ""}
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
<script id="site-config" type="application/json">${JSON.stringify(siteConfig)}</script>
</head>
<body>
<a class="skip-link" href="#main">${esc(t.ui.skip)}</a>
${header(ctx, navKey)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(ctx)}
${widgets(ctx, meta.title)}
<script src="${ctx.asset("js/main.js")}?v=${ctx.assetVersion}" defer></script>
</body>
</html>
`;
}
