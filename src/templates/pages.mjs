// One renderer per page template. Each returns { meta, body, navKey, jsonld }.

import { esc, txt, latin, icon, brandIcon, formatDate, sectionId } from "../lib.mjs";
import {
  waves, sectionHead, pageHero, iconCard, stats, numbersBand, approach, cardGrid, models, logoTile, marquee,
  faq, ctaBand, contactInfo, nextSteps, contactForm, articleCard, resultsPanel, serviceRows, serviceCards,
} from "./components.mjs";

// ---------- structured data ----------
const absUrl = (ctx, p) => (ctx.config.siteUrl ? `${ctx.config.siteUrl}/${p}` : undefined);
const org = (ctx) => ({
  "@type": "Organization",
  name: "Ampliq",
  slogan: "Amplify Your Business Impact",
  ...(ctx.config.siteUrl ? { url: `${ctx.config.siteUrl}/`, logo: absUrl(ctx, "assets/icons/icon-512.png") } : {}),
  ...(ctx.config.contact.email ? { email: ctx.config.contact.email } : {}),
  ...(ctx.config.contact.phone ? { telephone: ctx.config.contact.phone } : {}),
});
function breadcrumbLd(ctx, crumbs) {
  if (!ctx.config.siteUrl) return [];
  const items = [{ label: ctx.t.ui.home, key: "home" }, ...crumbs];
  return [{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: absUrl(ctx, ctx.routePath(c.key)) })),
  }];
}
const faqLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

// ---------- pages ----------
export function home(ctx) {
  const { t, lang } = ctx;
  const p = t.pages.home;
  const latest = ctx.articles.slice(0, 3);
  const body = `
  <section class="hero" aria-labelledby="hero-title">
    ${waves("waves--home")}
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="overline">${latin(p.hero.overline, lang)}</p>
        <h1 id="hero-title">${txt(p.hero.title, lang)}</h1>
        <p class="rotator">
          <span class="sr-only">${esc(p.hero.rotatorPrefix)} ${esc(p.hero.rotator.join(lang === "ar" ? "، " : ", "))}</span>
          <span aria-hidden="true">${esc(p.hero.rotatorPrefix)} <span class="rotator-word" data-rotator='${esc(JSON.stringify(p.hero.rotator))}'>${esc(p.hero.rotator[0])}</span></span>
        </p>
        <p class="hero-lead">${txt(p.hero.lead, lang)}</p>
        <div class="actions">
          <a class="btn btn--primary btn--lg" href="${ctx.link("contact")}">${esc(t.ui.bookCta)}${icon("arrow-right", "icon-dir")}</a>
          <a class="btn btn--ghost btn--lg" href="${ctx.link("services")}">${esc(t.ui.servicesCta)}</a>
        </div>
        ${stats(ctx)}
      </div>
      <div class="hero-visual" aria-hidden="true">
        <img src="${ctx.asset("img/brand/ampliq-symbol.webp")}" alt="" width="417" height="259" fetchpriority="high">
      </div>
    </div>
  </section>

  ${marquee(ctx, p.clients.label)}

  <section class="section section--mist" id="services" aria-labelledby="services-title">
    <div class="container">
      <div class="head-row">
        ${sectionHead(ctx, { overline: p.services.overline, title: p.services.title, lead: p.services.lead, id: "services-title" })}
        <a class="btn btn--outline" href="${ctx.link("services")}">${esc(p.services.all)}${icon("arrow-right", "icon-dir")}</a>
      </div>
      ${serviceRows(ctx)}
    </div>
  </section>

  ${cardGrid(ctx, t.shared.why, { id: "why" })}

  ${approach(ctx)}

  <section class="section" id="about" aria-labelledby="about-title">
    <div class="container split">
      <div class="brand-panel" aria-hidden="true">
        ${waves("waves--panel")}
        <img src="${ctx.asset("img/brand/ampliq-lockup-dark.webp")}" alt="" width="1200" height="354" loading="lazy">
      </div>
      <div>
        ${sectionHead(ctx, { overline: p.about.overline, title: p.about.title, id: "about-title" })}
        <p class="body-lg">${txt(p.about.text, lang)}</p>
        <a class="btn btn--secondary" href="${ctx.link("about")}">${esc(p.about.link)}${icon("arrow-right", "icon-dir")}</a>
      </div>
    </div>
  </section>

  ${latest.length ? `
  <section class="section section--mist" id="insights" aria-labelledby="insights-title">
    <div class="container">
      <div class="head-row">
        ${sectionHead(ctx, { overline: p.blog.overline, title: p.blog.title, id: "insights-title" })}
        <a class="btn btn--outline" href="${ctx.link("blog")}">${esc(t.ui.allArticles)}${icon("arrow-right", "icon-dir")}</a>
      </div>
      <div class="grid grid--3">${latest.map((a) => articleCard(ctx, a)).join("")}</div>
    </div>
  </section>` : ""}

  <section class="section" id="start" aria-labelledby="start-title">
    <div class="container contact-grid">
      <div>
        ${sectionHead(ctx, { overline: p.start.overline, title: p.start.title, lead: p.start.lead, id: "start-title" })}
        ${nextSteps(ctx)}
        ${contactInfo(ctx)}
      </div>
      <div class="form-card">${contactForm(ctx, { id: "home-form" })}</div>
    </div>
  </section>`;

  const jsonld = [
    { "@context": "https://schema.org", ...org(ctx), description: p.meta.description, areaServed: ["SA", "EG", "AE", "IQ"] },
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Ampliq",
      description: p.meta.description,
      address: { "@type": "PostalAddress", addressLocality: lang === "ar" ? "الرياض" : "Riyadh", addressCountry: "SA" },
      areaServed: "SA",
      ...(ctx.config.siteUrl ? { url: `${ctx.config.siteUrl}/${ctx.path}`, image: absUrl(ctx, ctx.ogFile) } : {}),
      ...(ctx.config.contact.phone ? { telephone: ctx.config.contact.phone } : {}),
    },
  ];
  return { meta: p.meta, body, navKey: "home", jsonld };
}

export function about(ctx) {
  const { t, lang } = ctx;
  const p = t.pages.about;
  const crumbs = [{ label: t.nav[0].label, key: "about" }];
  const body = `
  ${pageHero(ctx, { overline: p.hero.overline, title: p.hero.title, lead: p.hero.lead, crumbs })}

  <section class="section" aria-labelledby="story-title">
    <div class="container split split--top">
      <div>
        <h2 class="sec-title" id="story-title">${txt(p.story.title, lang)}</h2>
        <div class="prose-block">${p.story.paragraphs.map((x) => `<p>${txt(x, lang)}</p>`).join("")}</div>
      </div>
      <ul class="pillars" role="list">
        ${p.story.pillars.map((x, i) => `<li class="pillar${i === 0 ? " pillar--dark" : ""}"><span class="badge">${icon(x.icon)}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div></li>`).join("")}
      </ul>
    </div>
  </section>

  <section class="section section--mist" aria-labelledby="vision-title">
    <div class="container">
      ${sectionHead(ctx, { overline: p.vision.overline, title: p.vision.title, id: "vision-title" })}
      <div class="grid grid--2">
        <article class="card card--dark vm"><span class="badge">${icon("eye")}</span><h3 class="card-title">${esc(p.vision.visionTitle)}</h3><p class="card-text">${txt(p.vision.vision, lang)}</p></article>
        <article class="card vm"><span class="badge">${icon("compass")}</span><h3 class="card-title">${esc(p.vision.missionTitle)}</h3><p class="card-text">${txt(p.vision.mission, lang)}</p></article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="name-title">
    <div class="container">
      ${sectionHead(ctx, { overline: p.name.overline, title: p.name.title, id: "name-title" })}
      <p class="formula" lang="en" dir="ltr"><span>Ampl</span><span class="gold">iq</span> <span class="eq">=</span> Amplify <span class="eq">+</span> <span class="gold">IQ</span></p>
      <div class="grid grid--2 name-parts">
        ${p.name.parts.map((x) => `<div class="name-part"><p class="name-term" lang="en" dir="ltr">${esc(x.term)}</p><h3>${esc(x.label)}</h3><p>${txt(x.text, lang)}</p></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="section section--mist" aria-labelledby="values-title">
    <div class="container">
      ${sectionHead(ctx, { overline: p.values.overline, title: p.values.title, lead: p.values.lead, id: "values-title" })}
      <div class="grid grid--5">${p.values.items.map((v) => iconCard(ctx, v, { tag: v.en })).join("")}</div>
    </div>
  </section>

  ${numbersBand(ctx, p.numbers)}

  <section class="section" id="leadership" aria-labelledby="leadership-title">
    <div class="container">
      ${sectionHead(ctx, { overline: p.leadership.overline, title: p.leadership.title, id: "leadership-title" })}
      <div class="leaders">
        ${p.leadership.people
          .map(
            (x) => `
        <article class="leader">
          <div class="leader-photo"><img src="${ctx.asset(`img/team/${x.photo}.webp`)}" alt="${esc(x.name)}" width="720" height="1032" loading="lazy" decoding="async"></div>
          <div class="leader-body">
            <h3 class="leader-name">${esc(x.name)}</h3>
            <p class="leader-role">${esc(x.role)}</p>
            <p class="leader-bio">${txt(x.bio, lang)}</p>
          </div>
        </article>`
          )
          .join("")}
      </div>
    </div>
  </section>
  ${ctaBand(ctx)}`;
  const people = p.leadership.people.map((x) => ({ "@type": "Person", name: x.name, jobTitle: x.role }));
  return { meta: p.meta, body, navKey: "about", jsonld: [{ "@context": "https://schema.org", "@type": "AboutPage", name: p.meta.title, description: p.meta.description, about: { ...org(ctx), employee: people } }, ...breadcrumbLd(ctx, crumbs)] };
}

export function services(ctx) {
  const { t } = ctx;
  const p = t.pages.services;
  const crumbs = [{ label: t.nav[1].label, key: "services" }];
  const body = `
  ${pageHero(ctx, { overline: p.hero.overline, title: p.hero.title, lead: p.hero.lead, crumbs })}
  <section class="section" aria-label="${esc(p.hero.title)}">
    <div class="container"><div class="grid grid--3">${serviceCards(ctx, { headingLevel: 2 })}</div></div>
  </section>
  ${cardGrid(ctx, t.shared.challenges, { id: "challenges", surface: "mist", plain: true })}
  ${approach(ctx)}
  ${models(ctx)}
  ${ctaBand(ctx)}`;
  return { meta: p.meta, body, navKey: "services", jsonld: breadcrumbLd(ctx, crumbs) };
}

export function service(ctx, s) {
  const { t, lang } = ctx;
  const idx = ctx.services.findIndex((x) => x.slug === s.slug);
  const crumbs = [{ label: t.nav[1].label, key: "services" }, { label: s.title, key: `service:${s.slug}` }];
  const related = ctx.articles.find((a) => a.service === s.slug);
  const cols = s.offer.items.length % 4 === 0 ? 4 : 3;
  const body = `
  ${pageHero(ctx, {
    overline: `${String(idx + 1).padStart(2, "0")} — ${s.overline}`,
    title: s.title,
    lead: s.lead,
    crumbs,
    actions: `<a class="btn btn--primary btn--lg" href="${ctx.link("contact")}">${esc(t.ui.bookCta)}${icon("arrow-right", "icon-dir")}</a>`,
  })}

  <section class="section" aria-labelledby="overview-title">
    <div class="container split split--top">
      <div>
        <h2 class="sec-title" id="overview-title">${txt(s.short, lang)}</h2>
        <div class="prose-block">${s.overview.map((x) => `<p>${txt(x, lang)}</p>`).join("")}</div>
      </div>
      <aside class="panel panel--light" aria-label="${esc(s.title)}">
        <span class="badge badge--lg">${icon(s.icon)}</span>
        <ul class="checklist" role="list">${s.points.map((x) => `<li>${icon("check-circle")}<span>${esc(x)}</span></li>`).join("")}</ul>
      </aside>
    </div>
  </section>

  ${cardGrid(ctx, { title: s.offer.title, items: s.offer.items }, { id: "offer", surface: "mist", cols })}
  ${resultsPanel(ctx, s)}
  ${faq(ctx, s.faq, { title: t.ui.faqTitle })}
  <section class="section section--mist" aria-labelledby="more-title">
    <div class="container">
      ${sectionHead(ctx, { overline: "EXPLORE", title: t.ui.moreTitle, id: "more-title" })}
      <div class="grid grid--3">${serviceCards(ctx, { exclude: s.slug })}${related ? articleCard(ctx, related) : ""}</div>
    </div>
  </section>
  ${ctaBand(ctx)}`;

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: s.title,
      serviceType: s.title,
      description: s.meta.description,
      provider: org(ctx),
      areaServed: { "@type": "Country", name: "SA" },
      hasOfferCatalog: { "@type": "OfferCatalog", name: s.offer.title, itemListElement: s.offer.items.map((o) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: o.title, description: o.text } })) },
      ...(ctx.config.siteUrl ? { url: absUrl(ctx, ctx.path) } : {}),
    },
    faqLd(s.faq),
    ...breadcrumbLd(ctx, crumbs),
  ];
  return { meta: s.meta, body, navKey: "services", jsonld };
}

export function clients(ctx) {
  const { t } = ctx;
  const p = t.pages.clients;
  const crumbs = [{ label: t.nav[2].label, key: "clients" }];
  const body = `
  ${pageHero(ctx, { overline: p.hero.overline, title: p.hero.title, lead: p.hero.lead, crumbs })}
  <section class="section" aria-labelledby="logos-title">
    <div class="container">
      <h2 class="sec-title sec-title--sm" id="logos-title">${esc(p.logos.title)}</h2>
      <ul class="logo-grid" role="list">${ctx.config.clients.map((c) => logoTile(ctx, c)).join("")}</ul>
    </div>
  </section>
  ${cardGrid(ctx, t.shared.sectors, { id: "sectors", surface: "mist" })}
  ${numbersBand(ctx, p.numbers)}
  ${ctaBand(ctx)}`;
  return { meta: p.meta, body, navKey: "clients", jsonld: breadcrumbLd(ctx, crumbs) };
}

export function blog(ctx) {
  const { t } = ctx;
  const p = t.pages.blog;
  const crumbs = [{ label: t.nav[3].label, key: "blog" }];
  const cats = ctx.services.filter((s) => ctx.articles.some((a) => a.service === s.slug));
  const body = `
  ${pageHero(ctx, { overline: p.hero.overline, title: p.hero.title, lead: p.hero.lead, crumbs })}
  <section class="section" aria-label="${esc(p.hero.title)}">
    <div class="container">
      <div class="blog-tools" data-blog-tools hidden>
        <div class="filters" role="group" aria-label="${esc(p.filterLabel)}">
          <button type="button" class="filter" aria-pressed="true" data-filter="all">${esc(p.all)}</button>
          ${cats.map((s) => `<button type="button" class="filter" aria-pressed="false" data-filter="${s.slug}">${esc(s.title)}</button>`).join("")}
        </div>
        <div class="search">
          <label class="sr-only" for="blog-search">${esc(p.searchLabel)}</label>
          ${icon("search")}
          <input id="blog-search" type="search" placeholder="${esc(p.searchPh)}" autocomplete="off" data-blog-search>
        </div>
      </div>
      <div class="grid grid--3" data-blog-list>${ctx.articles.map((a) => articleCard(ctx, a, { headingLevel: 2 })).join("")}</div>
      <p class="empty" role="status" hidden data-blog-empty>${esc(p.empty)}</p>
    </div>
  </section>
  ${ctaBand(ctx)}`;
  return { meta: p.meta, body, navKey: "blog", jsonld: [{ "@context": "https://schema.org", "@type": "Blog", name: p.meta.title, description: p.meta.description, publisher: org(ctx) }, ...breadcrumbLd(ctx, crumbs)] };
}

function blocks(ctx, list) {
  let h = 0;
  return list
    .map((b) => {
      if (b.type === "h2") return `<h2 id="${sectionId(h++)}">${txt(b.text, ctx.lang)}</h2>`;
      if (b.type === "ul" || b.type === "ol") return `<${b.type}>${b.items.map((i) => `<li>${txt(i, ctx.lang)}</li>`).join("")}</${b.type}>`;
      return `<p>${txt(b.text, ctx.lang)}</p>`;
    })
    .join("\n          ");
}

export function article(ctx, a) {
  const { t, lang } = ctx;
  const crumbs = [{ label: t.nav[3].label, key: "blog" }, { label: a.title, key: `article:${a.slug}` }];
  const heads = a.blocks.filter((b) => b.type === "h2");
  const others = ctx.articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const shareUrl = ctx.config.siteUrl ? `${ctx.config.siteUrl}/${ctx.path}` : "";
  const share = (name, base) => `<a class="share-btn" href="${shareUrl ? base(encodeURIComponent(shareUrl)) : "#"}" data-share="${name}" rel="noopener" target="_blank" aria-label="${esc(name === "x" ? "X" : name === "linkedin" ? "LinkedIn" : "WhatsApp")}">${brandIcon(name)}</a>`;
  const body = `
  ${pageHero(ctx, {
    title: a.title,
    crumbs,
    extra: `<p class="post-meta post-meta--hero"><span class="pill pill--dark">${esc(a.category)}</span>${icon("calendar")}<time datetime="${a.date}">${esc(formatDate(a.date, t.dateLocale))}</time><span aria-hidden="true">·</span>${icon("clock")}<span>${esc(t.ui.readTime(a.minutes))}</span><span aria-hidden="true">·</span><span>${txt(t.ui.by, lang)}</span></p>`,
  })}
  <section class="section">
    <div class="container article-grid">
      <aside class="toc" aria-labelledby="toc-title">
        <p class="toc-title" id="toc-title">${esc(t.ui.toc)}</p>
        <ol>${heads.map((hd, i) => `<li><a href="#${sectionId(i)}">${txt(hd.text, lang)}</a></li>`).join("")}</ol>
      </aside>
      <article class="prose">
          <p class="lede">${txt(a.excerpt, lang)}</p>
          ${blocks(ctx, a.blocks)}
        <div class="share" data-share-bar>
          <p>${esc(t.ui.share)}</p>
          ${share("x", (u) => `https://x.com/intent/post?url=${u}`)}
          ${share("linkedin", (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`)}
          ${share("whatsapp", (u) => `https://wa.me/?text=${u}`)}
          <button type="button" class="share-btn share-copy" data-copy-link data-copied="${esc(t.ui.copied)}" aria-label="${esc(t.ui.copyLink)}">${icon("link")}</button>
          <span class="copy-status" role="status" aria-live="polite"></span>
        </div>
      </article>
    </div>
  </section>
  ${others.length ? `
  <section class="section section--mist" aria-labelledby="related-title">
    <div class="container">
      ${sectionHead(ctx, { overline: "INSIGHTS", title: t.ui.related, id: "related-title" })}
      <div class="grid grid--3">${others.map((x) => articleCard(ctx, x)).join("")}</div>
    </div>
  </section>` : ""}
  ${ctaBand(ctx)}`;
  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.description,
      datePublished: a.date,
      dateModified: a.date,
      inLanguage: lang,
      author: org(ctx),
      publisher: org(ctx),
      ...(ctx.config.siteUrl ? { mainEntityOfPage: absUrl(ctx, ctx.path), image: absUrl(ctx, ctx.ogFile) } : {}),
    },
    ...breadcrumbLd(ctx, crumbs),
  ];
  return { meta: { title: `${a.title} | Ampliq`, description: a.description }, body, navKey: "blog", jsonld, ogType: "article" };
}

export function contact(ctx) {
  const { t } = ctx;
  const p = t.pages.contact;
  const crumbs = [{ label: t.ui.contactCta, key: "contact" }];
  const body = `
  ${pageHero(ctx, { overline: p.hero.overline, title: p.hero.title, lead: p.hero.lead, crumbs })}
  <section class="section">
    <div class="container contact-grid contact-grid--page">
      <div class="form-card">${contactForm(ctx, { id: "contact-form" })}</div>
      <div class="contact-aside">
        <h2 class="block-title">${esc(p.infoTitle)}</h2>
        ${contactInfo(ctx)}
        ${nextSteps(ctx)}
      </div>
    </div>
  </section>`;
  return { meta: p.meta, body, navKey: "contact", jsonld: [{ "@context": "https://schema.org", "@type": "ContactPage", name: p.meta.title, description: p.meta.description, about: org(ctx) }, ...breadcrumbLd(ctx, crumbs)] };
}

export function legal(ctx, key) {
  const { t, lang } = ctx;
  const p = t.pages[key];
  const crumbs = [{ label: p.hero.title, key }];
  const body = `
  ${pageHero(ctx, {
    overline: p.hero.overline,
    title: p.hero.title,
    crumbs,
    extra: `<p class="post-meta post-meta--hero">${icon("clock")}<span>${esc(t.ui.updated)}: <time datetime="${p.updated}">${esc(formatDate(p.updated, t.dateLocale))}</time></span></p>`,
  })}
  <section class="section">
    <div class="container"><article class="prose prose--narrow">${blocks(ctx, p.blocks)}</article></div>
  </section>`;
  return { meta: p.meta, body, navKey: null, jsonld: breadcrumbLd(ctx, crumbs) };
}

export function notFound(ctx, en) {
  const { t } = ctx;
  const p = t.pages.notFound;
  const body = `
  <section class="hero hero--404" aria-labelledby="nf-title">
    ${waves("waves--home")}
    <div class="container nf">
      <img src="${ctx.asset("img/brand/ampliq-symbol.webp")}" alt="" width="417" height="259">
      <p class="stat-value"><span class="num" dir="ltr">404</span></p>
      <h1 id="nf-title">${esc(p.title)}</h1>
      <p class="hero-lead">${esc(p.text)}</p>
      <p class="hero-lead" lang="en" dir="ltr">${esc(en.pages.notFound.title)} — ${esc(en.pages.notFound.text)}</p>
      <div class="actions">
        <a class="btn btn--primary btn--lg" href="${ctx.link("home")}">${esc(p.home)}</a>
        <a class="btn btn--ghost btn--lg" href="${ctx.otherLink("home")}" lang="en">${esc(en.pages.notFound.home)}</a>
      </div>
    </div>
  </section>`;
  return { meta: { title: `404 | Ampliq`, description: p.text }, body, navKey: null, jsonld: [] };
}
