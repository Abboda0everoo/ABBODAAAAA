// Loads the CMS-editable content (src/content/**/*.json) into the shape the
// templates use. Every JSON file with two languages is stored as
// { "ar": {...}, "en": {...} } — the layout Decap CMS writes.

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Marked } from "marked";

const DIR = "src/content";
export const LANGS = ["ar", "en"];

const LANG_META = {
  ar: { lang: "ar", dir: "rtl", locale: "ar_SA", dateLocale: "ar-u-nu-latn-ca-gregory", brand: "Ampliq" },
  en: { lang: "en", dir: "ltr", locale: "en_US", dateLocale: "en-GB", brand: "Ampliq" },
};

const READ_TIME = {
  ar: (n) => (n <= 2 ? (n === 1 ? "دقيقة قراءة" : "دقيقتا قراءة") : n <= 10 ? `${n} دقائق قراءة` : `${n} دقيقة قراءة`),
  en: (n) => `${n} min read`,
};

const warnings = [];
export const contentWarnings = () => warnings;

const readJson = async (path) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    throw new Error(`Can't read ${path}: ${err.message}`);
  }
};

// Persian look-alike letters (ی ک) slip in from some keyboards; normalize them
// in Arabic text instead of failing the build.
function normalizeArabic(value, path = "") {
  if (typeof value === "string") {
    if (/[یکۀ]/.test(value)) warnings.push(`Replaced Persian letters with Arabic ones in ${path}`);
    return value.replace(/ی/g, "ي").replace(/ک/g, "ك").replace(/ۀ/g, "ة");
  }
  if (Array.isArray(value)) return value.map((v, i) => normalizeArabic(v, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeArabic(v, `${path}.${k}`)]));
  return value;
}

// English text left empty in the dashboard falls back to the Arabic text, so
// a half-translated edit never breaks the build (it is reported instead).
function fillMissing(en, ar, path, missing) {
  const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
  if (empty(en)) {
    if (!empty(ar)) missing.push(path);
    return ar;
  }
  if (Array.isArray(en) && Array.isArray(ar)) return en.map((v, i) => fillMissing(v, ar[i], `${path}[${i}]`, missing));
  if (en && typeof en === "object" && ar && typeof ar === "object" && !Array.isArray(en)) {
    const out = { ...en };
    for (const k of Object.keys(ar)) out[k] = fillMissing(en[k], ar[k], `${path}.${k}`, missing);
    return out;
  }
  return en;
}

const pick = (data, lang, file) => {
  if (!data?.ar) throw new Error(`${file}: missing the Arabic version`);
  const ar = normalizeArabic(data.ar, file);
  if (lang === "ar") return ar;
  const missing = [];
  const en = fillMissing(data.en, ar, file, missing);
  if (missing.length) warnings.push(`English text missing (Arabic shown instead): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` and ${missing.length - 5} more` : ""}`);
  return en;
};

// Markdown → HTML. h2 headings get ids for the table of contents; images and
// links that point at site files ("/assets/…") become relative at render time.
export function renderMarkdown(md) {
  const headings = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        if (depth === 2) {
          headings.push(text);
          return `<h2 id="section-${headings.length}">${text}</h2>\n`;
        }
        const level = Math.min(Math.max(depth, 3), 4); // pages own the only h1; keep h3/h4 below h2
        return `<h${level}>${text}</h${level}>\n`;
      },
    },
  });
  const html = marked.parse(md || "");
  const words = (md || "").replace(/[#*_>\-\[\]()`!]/g, " ").split(/\s+/).filter(Boolean).length;
  return { html, headings, minutes: Math.max(1, Math.round(words / 200)) };
}

export async function loadContent() {
  const settings = await readJson(`${DIR}/settings.json`);
  const clientsFile = await readJson(`${DIR}/clients.json`);
  const general = await readJson(`${DIR}/general.json`);
  const shared = await readJson(`${DIR}/shared.json`);
  const pageKeys = ["home", "about", "services", "clients", "blog", "contact", "privacy", "terms"];
  const pages = {};
  for (const k of pageKeys) pages[k] = await readJson(`${DIR}/pages/${k}.json`);

  const serviceFiles = (await readdir(`${DIR}/services`)).filter((f) => f.endsWith(".json")).sort();
  const services = [];
  for (const f of serviceFiles) {
    const data = await readJson(`${DIR}/services/${f}`);
    services.push({ slug: f.replace(/\.json$/, ""), data });
  }
  services.sort((a, b) => (a.data.ar?.order ?? 99) - (b.data.ar?.order ?? 99) || a.slug.localeCompare(b.slug));

  const blogFiles = existsSync(`${DIR}/blog`) ? (await readdir(`${DIR}/blog`)).filter((f) => f.endsWith(".json")).sort() : [];
  const posts = [];
  for (const f of blogFiles) {
    const data = await readJson(`${DIR}/blog/${f}`);
    const slug = f.replace(/\.json$/, "");
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`blog/${f}: the file name must use lowercase Latin letters, digits and dashes`);
    if (!data.ar?.title || !data.ar?.body) throw new Error(`blog/${f}: the Arabic title and body are required`);
    if (data.ar.draft) continue;
    posts.push({ slug, data });
  }
  const postDate = (p) => p.data.ar?.date || p.data.en?.date || "";
  posts.sort((a, b) => postDate(b).localeCompare(postDate(a)) || a.slug.localeCompare(b.slug));

  const content = {};
  for (const lang of LANGS) {
    const g = pick(general, lang, "general.json");
    const t = {
      ...LANG_META[lang],
      ui: { ...g.ui, readTime: READ_TIME[lang] },
      nav: g.nav,
      footer: g.footer,
      cta: g.cta,
      contact: g.contact,
      form: g.form,
      shared: pick(shared, lang, "shared.json"),
      services: services.map((s) => ({ ...pick(s.data, lang, `services/${s.slug}.json`), slug: s.slug })),
      pages: {},
    };
    for (const k of pageKeys) t.pages[k] = pick(pages[k], lang, `pages/${k}.json`);
    for (const k of ["privacy", "terms"]) t.pages[k] = { ...t.pages[k], ...renderMarkdown(t.pages[k].body) };
    t.pages.notFound = g.notFound;
    // An article without an English title and body is published in Arabic only.
    const inLang = (p) => lang === "ar" || Boolean(p.data.en?.title && p.data.en?.body);
    t.posts = posts.filter(inLang).map((p) => {
      const a = lang === "ar" ? normalizeArabic(p.data.ar, `blog/${p.slug}.json`) : p.data.en;
      const shared = p.data.ar;
      const service = t.services.find((s) => s.slug === (a.service || shared.service)) || t.services[0];
      return {
        slug: p.slug,
        service: service.slug,
        category: service.title,
        date: a.date || shared.date,
        icon: a.icon || shared.icon || service.icon,
        cover: a.cover || shared.cover || "",
        title: a.title,
        excerpt: a.excerpt,
        description: a.description || a.excerpt,
        ...renderMarkdown(a.body),
      };
    });
    content[lang] = t;
  }

  const config = {
    siteUrl: (process.env.SITE_URL || settings.siteUrl || (process.env.CONTEXT === "production" ? process.env.URL : "") || "").replace(/\/+$/, ""),
    contact: { email: settings.contact?.email || "", phone: settings.contact?.phone || "", whatsapp: settings.contact?.whatsapp || "" },
    form: { endpoint: settings.formEndpoint || "" },
    gtmId: settings.gtmId || "",
    year: new Date().getFullYear(),
    clients: (clientsFile.clients || []).map((c) => ({ ar: normalizeArabic(c.name_ar), en: c.name_en, logo: c.logo, bg: c.bg || "" })),
  };

  return { content, config };
}
