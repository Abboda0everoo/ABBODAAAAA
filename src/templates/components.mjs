// Reusable page sections, styled by src/styles/main.css.

import { esc, txt, latin, num, icon, brandIcon, formatDate } from "../lib.mjs";
import { contactMethods } from "./layout.mjs";

const pad2 = (i) => String(i + 1).padStart(2, "0");

// Concentric arcs: the "amplify" motif used behind heroes and the CTA band.
export const waves = (cls = "") => `
<svg class="waves${cls ? " " + cls : ""}" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
  ${[90, 150, 210, 270].map((r, i) => `<circle cx="300" cy="300" r="${r}" style="--i:${i}"/>`).join("")}
</svg>`;

export function sectionHead(ctx, { overline, title, lead, id, center = false }) {
  return `
    <header class="sec-head${center ? " sec-head--center" : ""}">
      ${overline ? `<p class="overline">${latin(overline, ctx.lang)}</p>` : ""}
      <h2 class="sec-title"${id ? ` id="${id}"` : ""}>${txt(title, ctx.lang)}</h2>
      ${lead ? `<p class="sec-lead">${txt(lead, ctx.lang)}</p>` : ""}
    </header>`;
}

export function breadcrumbs(ctx, crumbs) {
  const items = [{ label: ctx.t.ui.home, key: "home" }, ...crumbs];
  return `
      <nav class="crumbs" aria-label="${esc(ctx.t.ui.breadcrumb)}">
        <ol>${items
          .map((c, i) =>
            i === items.length - 1
              ? `<li><span aria-current="page">${esc(c.label)}</span></li>`
              : `<li><a href="${ctx.link(c.key)}">${esc(c.label)}</a>${icon("chevron-down", "crumb-sep")}</li>`
          )
          .join("")}</ol>
      </nav>`;
}

export function pageHero(ctx, { overline, title, lead, crumbs = [], actions = "", extra = "" }) {
  return `
  <section class="page-hero">
    ${waves("waves--hero")}
    <div class="container page-hero-inner">
      ${breadcrumbs(ctx, crumbs)}
      ${overline ? `<p class="overline">${latin(overline, ctx.lang)}</p>` : ""}
      <h1>${txt(title, ctx.lang)}</h1>
      ${lead ? `<p class="page-lead">${txt(lead, ctx.lang)}</p>` : ""}
      ${extra}
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </div>
  </section>`;
}

export function iconCard(ctx, item, { tag = "", plain = false } = {}) {
  return `
        <article class="card">
          <span class="${plain ? "icon-plain" : "badge"}">${icon(item.icon)}</span>
          ${tag ? `<p class="card-tag">${latin(tag, ctx.lang)}</p>` : ""}
          <h3 class="card-title">${txt(item.title, ctx.lang)}</h3>
          <p class="card-text">${txt(item.text, ctx.lang)}</p>
        </article>`;
}

export function stats(ctx, { cards = false } = {}) {
  const { shared } = ctx.t;
  return `
      <ul class="stats${cards ? " stats--cards" : ""}" role="list">
        ${shared.stats
          .map(
            (s) => `<li class="stat">
          <p class="stat-value">${num(s.value)}</p>
          <p class="stat-label">${esc(s.label)}</p>
          ${cards ? `<p class="stat-text">${txt(s.text, ctx.lang)}</p>` : ""}
        </li>`
          )
          .join("")}
      </ul>`;
}

export function sectorTags(ctx) {
  const { shared } = ctx.t;
  return `
      <div class="tags-row">
        <span class="tags-label">${esc(shared.sectorsLabel)}</span>
        <ul class="tags" role="list">${shared.sectorTags.map((s) => `<li class="tag">${esc(s)}</li>`).join("")}</ul>
      </div>`;
}

export function numbersBand(ctx, head) {
  return `
  <section class="section section--dark" aria-labelledby="numbers-title">
    <div class="container">
      ${sectionHead(ctx, { ...head, id: "numbers-title" })}
      ${stats(ctx, { cards: true })}
      ${sectorTags(ctx)}
    </div>
  </section>`;
}

export function approach(ctx, { id = "approach" } = {}) {
  const a = ctx.t.shared.approach;
  return `
  <section class="section section--dark" id="${id}" aria-labelledby="${id}-title">
    ${waves("waves--corner")}
    <div class="container">
      ${sectionHead(ctx, { overline: a.overline, title: a.title, lead: a.lead, id: `${id}-title` })}
      <ol class="steps" role="list">
        ${a.steps
          .map(
            (s, i) => `<li class="step">
          <span class="step-num">${num(pad2(i))}</span>
          <h3 class="step-title">${esc(s.title)}</h3>
          <p class="step-text">${txt(s.text, ctx.lang)}</p>
        </li>`
          )
          .join("")}
      </ol>
    </div>
  </section>`;
}

export function cardGrid(ctx, block, { id, surface = "", cols = 3, plain = false } = {}) {
  return `
  <section class="section${surface ? ` section--${surface}` : ""}" id="${id}" aria-labelledby="${id}-title">
    <div class="container">
      ${sectionHead(ctx, { overline: block.overline, title: block.title, lead: block.lead, id: `${id}-title` })}
      <div class="grid grid--${cols}">
        ${block.items.map((it) => iconCard(ctx, it, { plain })).join("")}
      </div>
    </div>
  </section>`;
}

export function models(ctx) {
  const m = ctx.t.shared.models;
  return `
  <section class="section" id="models" aria-labelledby="models-title">
    <div class="container">
      ${sectionHead(ctx, { overline: m.overline, title: m.title, lead: m.lead, id: "models-title" })}
      <div class="grid grid--4">
        ${m.items
          .map(
            (it, i) => `
        <article class="card model${i === 0 ? " card--dark" : ""}">
          <span class="badge">${icon(it.icon)}</span>
          <h3 class="card-title">${esc(it.title)}</h3>
          <p class="card-text">${txt(it.text, ctx.lang)}</p>
          <p class="model-fit"><strong>${esc(ctx.t.ui.bestFor)}</strong> ${esc(it.fit)}</p>
        </article>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

export function logoTile(ctx, c, { hidden = false } = {}) {
  const alt = hidden ? "" : esc(c[ctx.lang]);
  const bg = /^#[0-9a-fA-F]{3,8}$/.test(c.bg) ? c.bg : "";
  return `<li class="logo${bg ? " logo--filled" : ""}"${bg ? ` style="--logo-bg:${bg}"` : ""}><img src="${esc(ctx.media(c.logo))}" alt="${alt}" loading="lazy" decoding="async"></li>`;
}

export function marquee(ctx, label) {
  const list = ctx.config.clients;
  return `
  <section class="clients-strip" aria-labelledby="clients-strip-title">
    <div class="container">
      <h2 class="strip-label" id="clients-strip-title">${esc(label)}</h2>
    </div>
    <div class="marquee" data-marquee>
      <ul class="marquee-track" role="list">
        ${list.map((c) => logoTile(ctx, c)).join("")}
      </ul>
      <ul class="marquee-track" role="list" aria-hidden="true">
        ${list.map((c) => logoTile(ctx, c, { hidden: true })).join("")}
      </ul>
    </div>
  </section>`;
}

export function faq(ctx, items, { title, id = "faq" }) {
  return `
  <section class="section" id="${id}" aria-labelledby="${id}-title">
    <div class="container faq-wrap">
      ${sectionHead(ctx, { overline: "FAQ", title, id: `${id}-title` })}
      <div class="faq">
        ${items
          .map(
            (f) => `
        <details class="faq-item">
          <summary><span>${txt(f.q, ctx.lang)}</span>${icon("plus", "faq-icon")}</summary>
          <div class="faq-answer"><p>${txt(f.a, ctx.lang)}</p></div>
        </details>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

export function ctaBand(ctx) {
  const { t } = ctx;
  const wa = contactMethods(ctx).find((m) => m.key === "whatsapp");
  return `
  <section class="cta-band" aria-labelledby="cta-title">
    ${waves("waves--cta")}
    <div class="container cta-inner">
      <div>
        <h2 class="cta-title" id="cta-title">${esc(t.cta.title)} <span class="accent">${esc(t.cta.accent)}</span></h2>
        <p class="cta-text">${txt(t.cta.text, ctx.lang)}</p>
      </div>
      <div class="actions">
        <a class="btn btn--primary btn--lg" href="${ctx.link("contact")}">${esc(t.ui.bookCta)}${icon("arrow-right", "icon-dir")}</a>
        ${wa.href ? `<a class="btn btn--ghost btn--lg" href="${esc(wa.href)}" rel="noopener" data-contact="whatsapp">${brandIcon("whatsapp")}${esc(t.ui.whatsapp)}</a>` : ""}
      </div>
    </div>
  </section>`;
}

export function contactInfo(ctx) {
  const { t } = ctx;
  const rows = contactMethods(ctx)
    .map((m) => {
      const value = m.href
        ? `<a href="${esc(m.href)}" dir="ltr" data-contact="${m.event}"${m.key === "whatsapp" ? ' rel="noopener"' : ""}>${esc(m.value)}</a>`
        : `<span class="placeholder">${esc(t.contact.placeholders[m.key])}</span>`;
      return `<li class="info-row"><span class="info-icon">${m.icon}</span><span><small>${esc(t.contact.labels[m.key])}</small>${value}</span></li>`;
    })
    .join("");
  return `<ul class="info-list" role="list">${rows}<li class="info-row"><span class="info-icon">${icon("map-pin")}</span><span><small>${esc(t.contact.labels.location)}</small>${esc(t.contact.location)}</span></li></ul>`;
}

export function nextSteps(ctx) {
  const s = ctx.t.contact.steps;
  return `
        <div class="next-steps">
          <h3 class="block-title">${esc(s.title)}</h3>
          <ol class="mini-steps" role="list">
            ${s.items
              .map((it, i) => `<li><span class="mini-num">${num(pad2(i))}</span><div><strong>${esc(it.title)}</strong><p>${txt(it.text, ctx.lang)}</p></div></li>`)
              .join("")}
          </ol>
        </div>`;
}

export function contactForm(ctx, { id = "contact-form" } = {}) {
  const f = ctx.t.form;
  const req = `<span class="req" aria-hidden="true">*</span>`;
  const field = (name, label, control, { required = false, hint = "" } = {}) => `
        <div class="field">
          <label for="${id}-${name}">${esc(label)}${required ? ` ${req}` : ""}</label>
          ${control}
          ${hint}
          <p class="field-error" id="${id}-${name}-error" hidden></p>
        </div>`;
  const input = (name, type, attrs) => `<input id="${id}-${name}" name="${name}" type="${type}" aria-describedby="${id}-${name}-error" ${attrs}>`;
  const select = (name, options, required) =>
    `<select id="${id}-${name}" name="${name}" aria-describedby="${id}-${name}-error"${required ? " required" : ""}><option value="">${esc(f.select)}</option>${options.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`;
  return `
      <form class="form" id="${id}" novalidate data-form
        data-msg-required="${esc(f.errors.required)}" data-msg-email="${esc(f.errors.email)}" data-msg-mobile="${esc(f.errors.mobile)}"
        data-msg-consent="${esc(f.errors.consent)}" data-msg-summary="${esc(f.errors.summary)}"
        data-msg-success="${esc(f.success)}" data-msg-mailto="${esc(f.mailto)}" data-msg-failed="${esc(f.failed)}"
        data-msg-not-connected="${esc(f.notConnected)}" data-msg-sending="${esc(f.sending)}" data-subject="${esc(f.subject)}">
        <h3 class="block-title">${esc(f.title)}</h3>
        <p class="form-intro">${esc(f.intro)}</p>
        <div class="form-grid">
          ${field("name", f.name, input("name", "text", `autocomplete="name" placeholder="${esc(f.namePh)}" required`), { required: true })}
          ${field("mobile", f.mobile, input("mobile", "tel", `autocomplete="tel" inputmode="tel" dir="ltr" placeholder="${esc(f.mobilePh)}" required data-saudi-mobile`), { required: true })}
          ${field("email", f.email, input("email", "email", `autocomplete="email" dir="ltr" placeholder="${esc(f.emailPh)}" required`), { required: true })}
          ${field("company", f.company, input("company", "text", `autocomplete="organization" placeholder="${esc(f.companyPh)}"`))}
          ${field("service", f.service, select("service", f.serviceOptions, true), { required: true })}
          ${field("budget", f.budget, select("budget", f.budgetOptions, false))}
        </div>
        ${field("message", f.message, `<textarea id="${id}-message" name="message" rows="5" aria-describedby="${id}-message-error" placeholder="${esc(f.messagePh)}" required></textarea>`, { required: true })}
        <div class="hp" aria-hidden="true"><label for="${id}-website">Website</label><input id="${id}-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="field field--check">
          <label class="check"><input id="${id}-consent" name="consent" type="checkbox" required aria-describedby="${id}-consent-error"><span>${esc(f.consent)} <a href="${ctx.link("privacy")}">${esc(f.consentLink)}</a>. ${req}</span></label>
          <p class="field-error" id="${id}-consent-error" hidden></p>
        </div>
        <div class="form-status" role="status" aria-live="polite" hidden></div>
        <button class="btn btn--primary btn--lg" type="submit">${esc(f.submit)}${icon("send", "icon-dir")}</button>
      </form>`;
}

export function articleCard(ctx, a, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return `
        <article class="post-card" data-category="${a.service}" data-search="${esc(`${a.title} ${a.excerpt}`.toLowerCase())}">
          <a class="post-link" href="${ctx.link(`article:${a.slug}`)}">
            <div class="post-cover${a.cover ? " post-cover--image" : ""}" aria-hidden="true">${a.cover ? `<img src="${esc(ctx.media(a.cover))}" alt="" loading="lazy" decoding="async">` : `${waves("waves--cover")}<span class="post-cover-icon">${icon(a.icon)}</span>`}</div>
            <div class="post-body">
              <p class="pill">${esc(a.category)}</p>
              <${h} class="post-title">${txt(a.title, ctx.lang)}</${h}>
              <p class="post-excerpt">${txt(a.excerpt, ctx.lang)}</p>
              <p class="post-meta">${icon("calendar")}<time datetime="${a.date}">${esc(formatDate(a.date, ctx.t.dateLocale))}</time><span aria-hidden="true">·</span>${icon("clock")}<span>${esc(ctx.t.ui.readTime(a.minutes))}</span></p>
            </div>
          </a>
        </article>`;
}

export function resultsPanel(ctx, s) {
  const r = s.results;
  return `
  <section class="section section--dark" id="results" aria-labelledby="results-title">
    <div class="container">
      ${sectionHead(ctx, { overline: s.overline, title: r.title, lead: r.lead, id: "results-title" })}
      <div class="results">
        <div class="panel">
          <h3 class="block-title">${esc(r.outputsTitle)}</h3>
          <ul class="checklist" role="list">${r.outputs.map((o) => `<li>${icon("check-circle")}<span>${txt(o, ctx.lang)}</span></li>`).join("")}</ul>
        </div>
        <div>
          <h3 class="block-title">${esc(r.metricsTitle)}</h3>
          <ul class="metrics" role="list">${r.metrics.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
  </section>`;
}

export function serviceRows(ctx) {
  return `
      <ol class="service-rows" role="list">
        ${ctx.services
          .map(
            (s, i) => `
        <li class="service-row">
          <a href="${ctx.link(`service:${s.slug}`)}">
            <span class="row-num">${num(pad2(i))}</span>
            <span class="row-main">
              <span class="row-title">${esc(s.title)}</span>
              <span class="row-text">${txt(s.short, ctx.lang)}</span>
            </span>
            <span class="row-tags">${s.points.slice(0, 4).map((p) => `<span class="tag">${esc(p)}</span>`).join("")}</span>
            <span class="row-arrow">${icon("arrow-right", "icon-dir")}</span>
          </a>
        </li>`
          )
          .join("")}
      </ol>`;
}

export function serviceCards(ctx, { exclude = null, headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return ctx.services
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.slug !== exclude)
    .map(
      ({ s, i }) => `
        <article class="card service-card">
          <div class="card-top"><span class="badge">${icon(s.icon)}</span><span class="card-num">${num(pad2(i))}</span></div>
          <${h} class="card-title">${esc(s.title)}</${h}>
          <p class="card-text">${txt(s.short, ctx.lang)}</p>
          <ul class="checklist checklist--sm" role="list">${s.points.map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`).join("")}</ul>
          <a class="text-link" href="${ctx.link(`service:${s.slug}`)}">${esc(ctx.t.ui.details)}<span class="sr-only"> — ${esc(s.title)}</span>${icon("arrow-right", "icon-dir")}</a>
        </article>`
    )
    .join("");
}
