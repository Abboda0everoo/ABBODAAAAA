// Renders one language version of the AMPLIQ site to an HTML string.
// Layout and components follow the AMPLIQ design system (v1.0).

import icons from "./icons.mjs";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const icon = (name, cls = "") => {
  if (!icons[name]) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
};

export function renderPage({ t, config, base, selfPath, otherPath, otherLang, assetVersion }) {
  const isAr = t.lang === "ar";
  const asset = (p) => `${base}assets/${p}`;
  const abs = (p) => (config.siteUrl ? `${config.siteUrl}/${p}` : null);
  // English fragments inside the Arabic page are isolated so they keep LTR order and use Satoshi.
  const latin = (s) => (isAr ? `<span class="en" lang="en" dir="ltr">${esc(s)}</span>` : esc(s));
  const num = (s) => `<span class="num" dir="ltr">${esc(s)}</span>`;
  const arrow = icon("arrow-right", "icon-dir");
  const { contact } = config;

  const eyebrow = (text, n) =>
    `<p class="eyebrow">${isAr ? `<span class="en" lang="en" dir="ltr">` : ""}${n ? `<span class="eyebrow-num">${esc(n)}</span>` : ""}${esc(text)}${isAr ? "</span>" : ""}</p>`;

  const head = (s, id, { title = s.title, lead = s.lead } = {}) => `
      <header class="sec-head reveal">
        ${eyebrow(s.eyebrow, s.num)}
        <h2 class="sec-title" id="${id}-title">${esc(title)}</h2>
        ${lead ? `<p class="sec-lead">${esc(lead)}</p>` : ""}
      </header>`;

  const card = (item, { featured = false, plainIcon = false, compact = false } = {}) =>
    compact
      ? `
          <article class="card card--compact">
            <div class="card-row"><span class="icon-plain">${icon(item.icon)}</span><h3 class="card-title">${esc(item.title)}</h3></div>
            <p class="card-text">${esc(item.text)}</p>
          </article>`
      : `
          <article class="card card--basic${featured ? " card--featured" : ""}">
            ${plainIcon ? `<span class="icon-plain">${icon(item.icon)}</span>` : `<span class="badge">${icon(item.icon)}</span>`}
            <h3 class="card-title">${esc(item.title)}</h3>
            <p class="card-text">${esc(item.text)}</p>
          </article>`;

  const feature = (item) => `
          <article class="feature">
            <span class="badge badge--sm">${icon(item.icon)}</span>
            <div>
              <h3 class="feature-title">${esc(item.title)}</h3>
              <p class="feature-text">${esc(item.text)}</p>
            </div>
          </article>`;

  const checklist = (items, cls = "") => `
            <ul class="checklist${cls ? " " + cls : ""}">
              ${items.map((p) => `<li>${icon("check-circle")}<span>${esc(p)}</span></li>`).join("\n              ")}
            </ul>`;

  // ---------- contact helpers ----------
  const contactItems = [
    {
      key: "phone",
      icon: "phone",
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone.replace(/[^+\d]/g, "")}` : null,
    },
    { key: "email", icon: "mail", value: contact.email, href: contact.email ? `mailto:${contact.email}` : null },
    {
      key: "website",
      icon: "globe",
      value: contact.website,
      href: contact.website ? (/^https?:\/\//.test(contact.website) ? contact.website : `https://${contact.website}`) : null,
    },
  ];
  const contactValue = (c) =>
    c.value ? `<span class="contact-value" dir="ltr">${esc(c.value)}</span>` : `<span class="contact-value">${esc(t.contact.placeholders[c.key])}</span>`;
  const contactItem = (c) => {
    const inner = `${icon(c.icon)}<span><small>${esc(t.contact.labels[c.key])}</small>${contactValue(c)}</span>`;
    return c.href
      ? `<li><a class="contact-item" href="${esc(c.href)}"${c.key === "website" ? ' rel="noopener"' : ""}>${inner}</a></li>`
      : `<li><span class="contact-item is-placeholder">${inner}</span></li>`;
  };
  const locationItem = `<li><span class="contact-item">${icon("map-pin")}<span><small>${esc(t.contact.labels.location)}</small><span class="contact-value">${esc(t.contact.location)}</span></span></span></li>`;
  const hasForm = Boolean(contact.email);

  // ---------- head metadata ----------
  const ogImage = abs("assets/img/og-image.jpg") || asset("img/og-image.jpg");
  const altLocale = isAr ? "en_US" : "ar_SA";
  const seoLinks = config.siteUrl
    ? `
<link rel="canonical" href="${config.siteUrl}${selfPath}">
<link rel="alternate" hreflang="ar" href="${config.siteUrl}/">
<link rel="alternate" hreflang="en" href="${config.siteUrl}/en/">
<link rel="alternate" hreflang="x-default" href="${config.siteUrl}/">
<meta property="og:url" content="${config.siteUrl}${selfPath}">`
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AMPLIQ",
    alternateName: "أمبليك",
    slogan: "Intelligence Amplified. Growth Simplified.",
    description: t.meta.description,
    address: { "@type": "PostalAddress", addressLocality: "Riyadh", addressCountry: "SA" },
    areaServed: ["SA", "EG", "AE", "IQ"],
    knowsAbout: ["Digital marketing", "Human resources management", "Management consulting"],
    ...(config.siteUrl ? { url: config.siteUrl, logo: abs("assets/icons/icon-512.png") } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone } : {}),
  };

  const s = t; // shorthand

  return `<!doctype html>
<html lang="${t.lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t.meta.title)}</title>
<meta name="description" content="${esc(t.meta.description)}">
<meta name="theme-color" content="#0B1D33">${seoLinks}
<meta property="og:type" content="website">
<meta property="og:site_name" content="AMPLIQ">
<meta property="og:title" content="${esc(t.meta.title)}">
<meta property="og:description" content="${esc(t.meta.description)}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${altLocale}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${asset("icons/favicon.ico")}" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${asset("icons/favicon-32.png")}">
<link rel="apple-touch-icon" href="${asset("icons/apple-touch-icon.png")}">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap">
<link rel="preload" href="${asset("fonts/satoshi-700.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset("css/main.css")}?v=${assetVersion}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="skip-link" href="#main">${esc(t.ui.skip)}</a>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a class="brand" href="#home">
      <img src="${asset("img/logo-wordmark-dark.webp")}" alt="${esc(t.ui.logoAlt)}" width="156" height="50">
    </a>
    <nav class="nav" id="site-nav" aria-label="${esc(t.ui.mainNav)}">
      <ul>
        ${t.nav.map((n) => `<li><a href="${n.href}" data-nav="${n.href.slice(1)}">${esc(n.label)}</a></li>`).join("\n        ")}
      </ul>
      <a class="btn btn--primary nav-cta" href="#contact">${esc(t.ui.contactCta)}</a>
    </nav>
    <div class="header-actions">
      <a class="lang-switch" href="${otherPath}" hreflang="${otherLang}" lang="${otherLang}" data-page-link data-lang-switch aria-label="${esc(t.ui.switchAria)}">${icon("globe")}<span>${esc(t.ui.switchShort)}</span></a>
      <a class="btn btn--primary btn--sm header-cta" href="#contact">${esc(t.ui.contactCta)}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${esc(t.ui.menu)}" data-label-open="${esc(t.ui.menu)}" data-label-close="${esc(t.ui.close)}">${icon("menu", "i-open")}${icon("x", "i-close")}</button>
    </div>
  </div>
</header>

<main id="main" tabindex="-1">

  <!-- Hero -->
  <section class="hero section--dark" id="home" aria-labelledby="home-title">
    <div class="container hero-grid">
      <div class="hero-copy">
        ${eyebrow(s.hero.eyebrow)}
        <h1 id="home-title">${esc(s.hero.title)}</h1>
        <p class="hero-lead">${esc(s.hero.lead)}</p>
        <div class="hero-actions">
          <a class="btn btn--primary" href="#contact">${esc(s.hero.primary)}${arrow}</a>
          <a class="btn btn--ghost" href="#services">${esc(s.hero.secondary)}</a>
        </div>
        <div class="hero-meta">
          <span class="hero-loc">${icon("map-pin")}${esc(s.hero.location)}</span>
          <span class="tagline" lang="en" dir="ltr">${esc(s.hero.tagline)}</span>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-mark"><img src="${asset("img/logo-mark-dark.webp")}" alt="" width="503" height="485" fetchpriority="high"></div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section class="section" id="about" data-nav="about" aria-labelledby="about-title">
    <div class="container about-grid">
      <div>
        ${head(s.about, "about", { title: s.about.subtitle, lead: null })}
        <div class="prose reveal">
          ${s.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n          ")}
        </div>
      </div>
      <ul class="pillars reveal" role="list">
        ${s.about.pillars
          .map(
            (p) => `<li class="pillar">
          <span class="badge">${icon(p.icon)}</span>
          <div><h3 class="pillar-title">${esc(p.title)}</h3><p class="pillar-text">${esc(p.text)}</p></div>
        </li>`
          )
          .join("\n        ")}
      </ul>
    </div>
  </section>

  <!-- Vision, mission & name -->
  <section class="section section--surface" id="vision" data-nav="about" aria-labelledby="vision-title">
    <div class="container">
      ${head(s.vision, "vision")}
      <div class="grid grid--3 reveal">
        ${card(s.vision.vision, { featured: true })}
        ${card(s.vision.mission)}
        <article class="card card--basic name-card">
          <span class="badge">${icon(s.vision.name.icon)}</span>
          <h3 class="card-title">${esc(s.vision.name.title)}</h3>
          <p class="name-formula" lang="en" dir="ltr">${esc(s.vision.name.formula)}</p>
          <dl class="name-parts">
            ${s.vision.name.parts.map((p) => `<div><dt lang="en" dir="ltr">${esc(p.term)}</dt><dd>${esc(p.text)}</dd></div>`).join("\n            ")}
          </dl>
        </article>
      </div>
    </div>
  </section>

  <!-- Values + numbers -->
  <section class="section section--dark" id="values" data-nav="about" aria-labelledby="values-title">
    <div class="container">
      ${head(s.values, "values")}
      <div class="grid grid--5 reveal">
        ${s.values.items.map((v) => card(v)).join("")}
      </div>

      <div class="numbers" id="numbers">
        <header class="sec-head sec-head--sub reveal">
          ${eyebrow(s.numbers.eyebrow)}
          <h2 class="sec-title" id="numbers-title">${esc(s.numbers.title)}</h2>
        </header>
        <ul class="stats reveal" role="list">
          ${s.numbers.items
            .map(
              (n) => `<li class="stat">
            <p class="stat-value">${num(n.value)}</p>
            <h3 class="stat-title">${esc(n.title)}</h3>
            <p class="stat-text">${esc(n.text)}</p>
          </li>`
            )
            .join("\n          ")}
        </ul>
        <div class="served reveal">
          <span class="served-label">${esc(s.numbers.sectorsLabel)}</span>
          <ul class="chips" role="list">
            ${s.numbers.sectors.map((x) => `<li class="chip">${esc(x)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Sectors -->
  <section class="section" id="sectors" data-nav="sectors" aria-labelledby="sectors-title">
    <div class="container">
      ${head(s.sectors, "sectors")}
      <div class="grid grid--3 reveal">
        ${s.sectors.items.map((x) => card(x)).join("")}
      </div>
    </div>
  </section>

  <!-- Challenges -->
  <section class="section section--surface" id="challenges" data-nav="sectors" aria-labelledby="challenges-title">
    <div class="container">
      ${head(s.challenges, "challenges")}
      <div class="grid grid--3 reveal">
        ${s.challenges.items.map((x) => card(x, { plainIcon: true })).join("")}
      </div>
    </div>
  </section>

  <!-- Services overview -->
  <section class="section" id="services" data-nav="services" aria-labelledby="services-title">
    <div class="container">
      ${head(s.services, "services")}
      <div class="grid grid--3 reveal">
        ${s.services.items
          .map(
            (x, i) => `
          <article class="card service-card${i === 0 ? " card--featured" : ""}">
            <div class="service-top"><span class="badge">${icon(x.icon)}</span><span class="service-num">${num(x.num)}</span></div>
            <h3 class="card-title">${esc(x.title)}</h3>
            <p class="card-text">${esc(x.text)}</p>
            ${checklist(x.points)}
            <a class="card-link" href="${x.href}">${esc(t.ui.serviceDetails)}${arrow}</a>
          </article>`
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- 01 Digital marketing -->
  <section class="section section--surface" id="marketing" data-nav="services" aria-labelledby="marketing-title">
    <div class="container split">
      <div class="split-head">${head(s.marketing, "marketing")}</div>
      <div class="features reveal">
        ${s.marketing.items.map(feature).join("")}
      </div>
    </div>
  </section>

  <!-- 01 Digital marketing: deliverables & KPIs -->
  <section class="section section--dark" id="deliverables" data-nav="services" aria-labelledby="deliverables-title">
    <div class="container">
      ${head(s.deliverables, "deliverables")}
      <div class="deliverables reveal">
        <div class="panel">
          <h3 class="panel-title">${esc(s.deliverables.outputsTitle)}</h3>
          ${checklist(s.deliverables.outputs, "checklist--lg")}
        </div>
        <div>
          <h3 class="panel-title">${esc(s.deliverables.kpisTitle)}</h3>
          <ul class="pills" role="list">
            ${s.deliverables.kpis.map((k) => `<li class="pill">${esc(k)}</li>`).join("\n            ")}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- 02 Human resources -->
  <section class="section" id="hr" data-nav="services" aria-labelledby="hr-title">
    <div class="container">
      ${head(s.hr, "hr")}
      <div class="grid grid--4 reveal">
        ${s.hr.items.map((x) => card(x, { compact: true })).join("")}
      </div>
    </div>
  </section>

  <!-- 03 Management consulting -->
  <section class="section section--surface" id="consulting" data-nav="services" aria-labelledby="consulting-title">
    <div class="container">
      ${head(s.consulting, "consulting")}
      <ol class="grid grid--3 phases reveal" role="list">
        ${s.consulting.phases
          .map(
            (p, i) => `
        <li class="card phase${i === 0 ? " card--featured" : ""}">
          <div class="service-top"><span class="badge">${icon(p.icon)}</span><span class="service-num">${num(p.num)}</span></div>
          <h3 class="card-title">${esc(p.title)}</h3>
          ${checklist(p.points)}
        </li>`
          )
          .join("")}
      </ol>
      <div class="outputs reveal">
        <span class="outputs-label">${esc(s.consulting.outputsLabel)}</span>
        <ul class="chips" role="list">
          ${s.consulting.outputs.map((o) => `<li class="chip">${esc(o)}</li>`).join("")}
        </ul>
      </div>
    </div>
  </section>

  <!-- Approach -->
  <section class="section section--dark" id="approach" data-nav="approach" aria-labelledby="approach-title">
    <div class="container">
      ${head(s.approach, "approach")}
      <ol class="steps reveal" role="list">
        ${s.approach.steps
          .map(
            (st) => `<li class="step">
          <span class="step-num">${num(st.num)}</span>
          <div><h3 class="step-title">${esc(st.title)}</h3><p class="step-text">${esc(st.text)}</p></div>
        </li>`
          )
          .join("\n        ")}
      </ol>
    </div>
  </section>

  <!-- Engagement models -->
  <section class="section" id="models" data-nav="approach" aria-labelledby="models-title">
    <div class="container">
      ${head(s.models, "models")}
      <div class="grid grid--4 reveal">
        ${s.models.items
          .map(
            (m, i) => `
          <article class="card model-card${i === 0 ? " card--featured" : ""}">
            <span class="badge">${icon(m.icon)}</span>
            <h3 class="card-title">${esc(m.title)}</h3>
            <p class="card-text">${esc(m.text)}</p>
            <p class="model-fit"><strong>${esc(s.models.fitLabel)}</strong> ${esc(m.fit)}</p>
          </article>`
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Why AMPLIQ -->
  <section class="section section--surface" id="why" data-nav="why" aria-labelledby="why-title">
    <div class="container">
      ${head(s.why, "why")}
      <div class="grid grid--3 reveal">
        ${s.why.items.map((x, i) => card(x, { featured: i === 0 })).join("")}
      </div>
    </div>
  </section>

  <!-- Leadership -->
  <section class="section" id="leadership" data-nav="why" aria-labelledby="leadership-title">
    <div class="container">
      ${head(s.leadership, "leadership")}
      <div class="leaders reveal">
        ${s.leadership.people
          .map(
            (p) => `
        <article class="leader">
          <div class="leader-photo"><img src="${asset(`img/team/${p.photo}.webp`)}" alt="${esc(p.name)}" width="720" height="1032" loading="lazy" decoding="async"></div>
          <div class="leader-body">
            <h3 class="leader-name">${esc(p.name)}</h3>
            <p class="leader-role">${esc(p.role)}</p>
            <p class="leader-bio">${esc(p.bio)}</p>
          </div>
        </article>`
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Clients -->
  <section class="section section--surface" id="clients" data-nav="clients" aria-labelledby="clients-title">
    <div class="container">
      ${head(s.clients, "clients")}
      <ul class="logos reveal" role="list">
        ${config.clients
          .map(
            (c) =>
              `<li class="logo-tile${c.bg ? " logo-tile--filled" : ""}"${c.bg ? ` style="--tile-bg:${c.bg}"` : ""}><img src="${asset(`img/clients/${c.file}.webp`)}" alt="${esc(c[t.lang])}" loading="lazy" decoding="async"></li>`
          )
          .join("\n        ")}
      </ul>
    </div>
  </section>

  <!-- Contact -->
  <section class="section section--dark contact${hasForm ? " contact--form" : ""}" id="contact" data-nav="contact" aria-labelledby="contact-title">
    <div class="container${hasForm ? " contact-grid" : ""}">
      <div class="contact-copy reveal">
        ${hasForm ? "" : `<img class="contact-mark" src="${asset("img/logo-mark-dark.webp")}" alt="" width="503" height="485" loading="lazy">`}
        ${eyebrow(s.contact.eyebrow)}
        <h2 class="sec-title" id="contact-title">${esc(s.contact.title)}</h2>
        <p class="sec-lead">${esc(s.contact.lead)}</p>
        <ul class="contact-list" role="list">
          ${contactItems.map(contactItem).join("\n          ")}
          ${locationItem}
        </ul>
      </div>
      ${
        hasForm
          ? `
      <form class="contact-form panel reveal" data-mailto="${esc(contact.email)}" data-subject="${esc(s.contact.form.subject)}">
        <h3 class="panel-title">${esc(s.contact.form.title)}</h3>
        <div class="field"><label for="f-name">${esc(s.contact.form.name)}</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div class="field-row">
          <div class="field"><label for="f-org">${esc(s.contact.form.org)}</label><input id="f-org" name="org" autocomplete="organization"></div>
          <div class="field"><label for="f-reply">${esc(s.contact.form.reply)}</label><input id="f-reply" name="reply" autocomplete="email" required></div>
        </div>
        <div class="field"><label for="f-service">${esc(s.contact.form.service)}</label>
          <select id="f-service" name="service">${s.contact.form.serviceOptions.map((o) => `<option>${esc(o)}</option>`).join("")}</select>
        </div>
        <div class="field"><label for="f-message">${esc(s.contact.form.message)}</label><textarea id="f-message" name="message" rows="4" required></textarea></div>
        <button class="btn btn--primary" type="submit">${esc(s.contact.form.submit)}${icon("send", "icon-dir")}</button>
        <p class="form-note">${esc(s.contact.form.note)}</p>
      </form>`
          : ""
      }
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="${asset("img/logo-wordmark-dark.webp")}" alt="${esc(t.ui.logoAlt)}" width="200" height="65" loading="lazy">
        <p>${esc(s.about.paragraphs[0])}</p>
        <p class="tagline" lang="en" dir="ltr">${esc(s.hero.tagline)}</p>
      </div>
      <nav aria-labelledby="f-company">
        <h2 class="footer-title" id="f-company">${esc(s.footer.company)}</h2>
        <ul>${s.footer.companyLinks.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("")}</ul>
      </nav>
      <nav aria-labelledby="f-services">
        <h2 class="footer-title" id="f-services">${esc(s.footer.services)}</h2>
        <ul>${s.footer.serviceLinks.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("")}</ul>
      </nav>
      <div>
        <h2 class="footer-title">${esc(s.footer.contact)}</h2>
        <ul class="footer-contact">
          <li>${icon("map-pin")}<span>${esc(s.contact.location)}</span></li>
          ${contactItems
            .map((c) => `<li>${icon(c.icon)}${c.href ? `<a href="${esc(c.href)}" dir="ltr">${esc(c.value)}</a>` : `<span>${esc(t.contact.placeholders[c.key])}</span>`}</li>`)
            .join("\n          ")}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${num(config.year)} ${esc(s.footer.brand)}. ${esc(s.footer.rights)}</p>
      <div class="footer-bottom-links">
        <a href="${otherPath}" hreflang="${otherLang}" lang="${otherLang}" data-page-link data-lang-switch>${esc(t.ui.switchLabel)}</a>
        <a href="#top" class="to-top">${esc(t.ui.backToTop)}${icon("arrow-up")}</a>
      </div>
    </div>
  </div>
</footer>

<script src="${asset("js/main.js")}?v=${assetVersion}" defer></script>
</body>
</html>
`;
}

// Served by static hosts for unknown paths, so it uses root-absolute URLs.
export function render404({ assetVersion }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 | AMPLIQ</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0B1D33">
<link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap">
<link rel="stylesheet" href="/assets/css/main.css?v=${assetVersion}">
</head>
<body class="page-404">
<main class="section section--dark notfound">
  <div class="container">
    <img class="contact-mark" src="/assets/img/logo-mark-dark.webp" alt="" width="503" height="485">
    <p class="stat-value"><span class="num" dir="ltr">404</span></p>
    <h1 class="sec-title">الصفحة غير موجودة</h1>
    <p class="sec-title en" lang="en" dir="ltr">Page not found</p>
    <div class="hero-actions">
      <a class="btn btn--primary" href="/">الصفحة الرئيسية</a>
      <a class="btn btn--ghost" href="/en/" lang="en">Home</a>
    </div>
  </div>
</main>
</body>
</html>
`;
}
