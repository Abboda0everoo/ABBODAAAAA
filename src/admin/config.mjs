// Decap CMS configuration for the dashboard at /admin/.
// The build writes it to dist/admin/config.yml (as JSON, which is valid YAML).
// Most form fields are derived from the content files themselves, so adding a
// text to a JSON file makes it editable without touching this file.

import { readFileSync, readdirSync } from "node:fs";
import { icons } from "../icons.mjs";

const CONTENT = "src/content";
const REPO = "Abboda0everoo/ABBODAAAAA";
const BRANCH = "main";

const read = (f) => JSON.parse(readFileSync(`${CONTENT}/${f}`, "utf8"));

// Arabic labels for content keys (fallback: the key itself).
const LABELS = {
  meta: "بيانات محركات البحث", hero: "الواجهة الرئيسية للصفحة", title: "العنوان", description: "الوصف",
  overline: "العنوان الصغير (بالإنجليزية)", lead: "النص التمهيدي", text: "النص", label: "التسمية", link: "نص الرابط",
  items: "العناصر", icon: "الأيقونة", rotator: "الكلمات المتبدّلة", rotatorPrefix: "ما قبل الكلمات المتبدّلة",
  clients: "العملاء", services: "الخدمات", about: "من نحن", blog: "المدونة", start: "ابدأ معنا", all: "رابط عرض الكل",
  story: "قصتنا", paragraphs: "الفقرات", pillars: "الركائز", vision: "الرؤية", visionTitle: "عنوان الرؤية",
  mission: "الرسالة", missionTitle: "عنوان الرسالة", name: "الاسم", parts: "الأجزاء", term: "المصطلح",
  values: "القيم", en: "الاسم بالإنجليزية", numbers: "الأرقام", leadership: "القيادة", people: "الأشخاص",
  photo: "الصورة", role: "المنصب", bio: "نبذة", logos: "الشعارات", filterLabel: "تسمية التصفية",
  searchLabel: "تسمية البحث", searchPh: "نص خانة البحث", empty: "رسالة عدم وجود نتائج", infoTitle: "عنوان معلومات التواصل",
  updated: "تاريخ آخر تحديث", body: "المحتوى", slug: "الرابط (بالإنجليزية)", order: "الترتيب", short: "وصف مختصر",
  points: "النقاط", overview: "نظرة عامة", offer: "ماذا نقدّم", results: "النتائج", outputsTitle: "عنوان المخرجات",
  outputs: "المخرجات", metricsTitle: "عنوان المؤشرات", metrics: "المؤشرات", faq: "الأسئلة الشائعة", q: "السؤال", a: "الإجابة",
  stats: "الإحصائيات", value: "القيمة", sectorsLabel: "تسمية القطاعات", sectorTags: "وسوم القطاعات", approach: "منهجية العمل",
  steps: "الخطوات", why: "لماذا نحن", challenges: "التحديات", models: "نماذج التعاقد", fit: "مناسب لـ", sectors: "القطاعات",
  ui: "نصوص الواجهة", nav: "القائمة الرئيسية", key: "المعرّف (لا تغيّره)", footer: "التذييل", cta: "دعوة التواصل",
  accent: "الجزء المميّز", contact: "التواصل", location: "الموقع", labels: "التسميات", placeholders: "النصوص البديلة",
  form: "نموذج التواصل", errors: "رسائل الأخطاء", notFound: "صفحة غير موجودة (404)", home: "الرئيسية",
  serviceOptions: "خيارات الخدمة", budgetOptions: "خيارات الميزانية",
};
const label = (k) => LABELS[k] || k;
const SINGULAR = {
  items: "عنصر", people: "شخص", faq: "سؤال", steps: "خطوة", paragraphs: "فقرة", points: "نقطة", stats: "رقم", pillars: "ركيزة",
  parts: "جزء", rotator: "كلمة", outputs: "مخرج", metrics: "مؤشر", sectorTags: "وسم", nav: "رابط", serviceOptions: "خيار", budgetOptions: "خيار",
};

// Keys whose values are images or icons, wherever they appear.
const IMAGE_KEYS = new Set(["photo", "logo", "cover"]);
const iconOptions = Object.keys(icons).sort();

const isLong = (values) => values.some((v) => typeof v === "string" && (v.length > 70 || v.includes("\n")));

// Builds a Decap field from sample values (the same key across list items).
function fieldFor(key, samples, i18n, depth = 0) {
  const base = { name: key, label: label(key), ...(SINGULAR[key] ? { label_singular: SINGULAR[key] } : {}), ...(i18n ? { i18n } : {}) };
  const present = samples.filter((v) => v !== undefined && v !== null);
  const first = present[0];

  if (key === "icon") return { ...base, widget: "select", options: iconOptions, required: false };
  if (IMAGE_KEYS.has(key)) return { ...base, widget: "image", required: false, choose_url: false };
  if (key === "body") return { ...base, widget: "markdown", buttons: ["bold", "italic", "link", "heading-two", "heading-three", "quote", "bulleted-list", "numbered-list"], editor_components: ["image"], sanitize_preview: true };
  if (key === "updated" || key === "date") return { ...base, widget: "datetime", format: "YYYY-MM-DD", date_format: "YYYY-MM-DD", time_format: false, picker_utc: true };
  if (typeof first === "number") return { ...base, widget: "number", value_type: "int" };
  if (typeof first === "boolean") return { ...base, widget: "boolean", required: false };
  if (Array.isArray(first)) {
    const items = present.flat();
    if (items.every((v) => typeof v === "string")) {
      return { ...base, widget: "list", field: { name: "item", label: label(key), widget: isLong(items) ? "text" : "string", ...(i18n ? { i18n } : {}) } };
    }
    return { ...base, widget: "list", collapsed: true, summary: summaryFor(items), fields: fieldsFor(items, i18n, depth + 1) };
  }
  // Page sections start folded; objects inside them open with their section.
  if (first && typeof first === "object") return { ...base, widget: "object", collapsed: depth === 0, fields: fieldsFor(present, i18n, depth + 1) };
  return { ...base, widget: isLong(present) ? "text" : "string", required: present.some((v) => v !== "") };
}

// Fields for a set of sample objects: the union of their keys, in order.
function fieldsFor(objects, i18n, depth = 0) {
  const keys = [];
  for (const o of objects) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
  return keys.map((k) => fieldFor(k, objects.map((o) => o[k]), i18n, depth));
}

const summaryFor = (items) => {
  const k = ["title", "name", "q", "label", "term", "value"].find((x) => items.some((o) => typeof o[x] === "string"));
  return k ? `{{fields.${k}}}` : undefined;
};

// Bilingual files: every field is translated; a few top-level ones are shared.
function bilingualFields(data, shared = []) {
  return fieldsFor([data.ar], true).map((f) => (shared.includes(f.name) ? { ...f, i18n: "duplicate" } : f));
}

const tweak = (fields, name, patch) => fields.map((f) => (f.name === name ? { ...f, ...patch } : f));

const SLUG_FIELD = {
  pattern: ["^[a-z0-9]+(-[a-z0-9]+)*$", "حروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: marketing-tips"],
  hint: "يظهر في رابط الصفحة. اكتبه بالإنجليزية ولا تغيّره بعد النشر.",
};

export function cmsConfig({ siteUrl = "" } = {}) {
  const services = readdirSync(`${CONTENT}/services`).filter((f) => f.endsWith(".json")).map((f) => ({ slug: f.slice(0, -5), ...read(`services/${f}`) }));
  const sampleService = services[0];

  // ---- Blog ----
  const blog = {
    name: "blog",
    label: "المدونة",
    label_singular: "مقال",
    description: "اكتب المقال بالعربية ثم بالإنجليزية. المقال الذي لا يحتوي عنواناً ونصاً بالإنجليزية يُنشر بالعربية فقط.",
    folder: `${CONTENT}/blog`,
    format: "json",
    extension: "json",
    create: true,
    delete: true,
    slug: "{{fields.slug}}",
    identifier_field: "title",
    summary: "{{title}} — {{date}}",
    sortable_fields: ["date", "title"],
    i18n: true,
    editor: { preview: false },
    fields: [
      { name: "title", label: "عنوان المقال", widget: "string", i18n: true },
      { name: "slug", label: "رابط المقال (بالإنجليزية)", widget: "string", i18n: "duplicate", ...SLUG_FIELD },
      { name: "date", label: "تاريخ النشر", widget: "datetime", format: "YYYY-MM-DD", date_format: "YYYY-MM-DD", time_format: false, picker_utc: true, i18n: "duplicate" },
      {
        name: "service",
        label: "التصنيف (الخدمة)",
        widget: "select",
        options: services.map((s) => ({ label: s.ar.title, value: s.slug })),
        i18n: "duplicate",
      },
      { name: "cover", label: "صورة الغلاف", widget: "image", required: false, choose_url: false, i18n: "duplicate", hint: "اختيارية. المقاس المثالي 1200×630. بدونها يظهر غلاف الهوية مع الأيقونة." },
      { name: "excerpt", label: "ملخص قصير", widget: "text", i18n: true, hint: "يظهر في بطاقة المقال وفي أعلى الصفحة." },
      { name: "body", label: "نص المقال", widget: "markdown", i18n: true, buttons: ["bold", "italic", "link", "heading-two", "heading-three", "quote", "bulleted-list", "numbered-list"], editor_components: ["image"], sanitize_preview: true, hint: "العناوين الرئيسية (H2) تظهر في فهرس المقال." },
      { name: "description", label: "وصف محركات البحث", widget: "text", required: false, i18n: true, hint: "اختياري. إن تُرك فارغاً يُستخدم الملخص." },
      { name: "icon", label: "أيقونة الغلاف", widget: "select", options: iconOptions, required: false, i18n: "duplicate", hint: "تظهر عند عدم وجود صورة غلاف. الافتراضي: أيقونة الخدمة." },
      { name: "draft", label: "مسودة (لا تُنشر)", widget: "boolean", default: false, required: false, i18n: "duplicate" },
    ],
  };

  // ---- Services ----
  let serviceFields = bilingualFields(sampleService, ["slug", "order", "icon"]);
  serviceFields = tweak(serviceFields, "slug", { label: "رابط الخدمة (بالإنجليزية)", ...SLUG_FIELD });
  serviceFields = tweak(serviceFields, "order", { label: "الترتيب في القوائم", hint: "1 = الأولى" });
  serviceFields = tweak(serviceFields, "icon", { required: true });
  serviceFields = tweak(serviceFields, "title", { label: "اسم الخدمة" });
  const servicesCollection = {
    name: "services",
    label: "الخدمات",
    label_singular: "خدمة",
    description: "كل خدمة لها صفحة مستقلة على الموقع.",
    folder: `${CONTENT}/services`,
    format: "json",
    extension: "json",
    create: true,
    delete: false,
    slug: "{{fields.slug}}",
    identifier_field: "title",
    summary: "{{title}}",
    sortable_fields: ["order", "title"],
    i18n: true,
    editor: { preview: false },
    fields: serviceFields,
  };

  // ---- Pages ----
  const PAGES = [
    ["home", "الصفحة الرئيسية"],
    ["about", "من نحن"],
    ["services", "صفحة الخدمات"],
    ["clients", "صفحة العملاء"],
    ["blog", "صفحة المدونة"],
    ["contact", "تواصل معنا"],
    ["privacy", "سياسة الخصوصية"],
    ["terms", "شروط الاستخدام"],
  ];
  const pageFile = ([key, lbl]) => {
    let fields = bilingualFields(read(`pages/${key}.json`), ["updated"]);
    if (key === "about") {
      fields = fields.map((f) =>
        f.name !== "leadership"
          ? f
          : { ...f, fields: f.fields.map((g) => (g.name !== "people" ? g : { ...g, fields: g.fields.map((h) => (h.name === "photo" ? { ...h, media_folder: "/src/assets/img/team", public_folder: "/assets/img/team", hint: "صورة عمودية (720×1032 تقريباً). ارفعها في النسختين العربية والإنجليزية." } : h)) })) }
      );
    }
    return { name: key, label: lbl, file: `${CONTENT}/pages/${key}.json`, i18n: true, fields };
  };
  const pagesCollection = {
    name: "pages",
    label: "صفحات الموقع",
    label_singular: "صفحة",
    description: "نصوص الصفحات الثابتة.",
    i18n: true,
    editor: { preview: false },
    files: PAGES.map(pageFile),
  };

  // ---- Shared texts ----
  const textsCollection = {
    name: "texts",
    label: "النصوص المشتركة",
    description: "أقسام تتكرر في أكثر من صفحة، ونصوص القوائم والتذييل والنموذج.",
    i18n: true,
    editor: { preview: false },
    files: [
      { name: "shared", label: "الأقسام المشتركة (الأرقام، المنهجية، لماذا نحن…)", file: `${CONTENT}/shared.json`, i18n: true, fields: bilingualFields(read("shared.json")) },
      {
        name: "general",
        label: "القائمة والتذييل ونموذج التواصل",
        file: `${CONTENT}/general.json`,
        i18n: true,
        fields: bilingualFields(read("general.json")).map((f) => (f.name === "nav" ? { ...f, allow_add: false, allow_remove: false, allow_reorder: false } : f)),
      },
    ],
  };

  // ---- Settings ----
  const settingsCollection = {
    name: "settings",
    label: "الإعدادات",
    editor: { preview: false },
    files: [
      {
        name: "settings",
        label: "بيانات التواصل والربط",
        file: `${CONTENT}/settings.json`,
        fields: [
          {
            name: "contact",
            label: "بيانات التواصل",
            widget: "object",
            fields: [
              { name: "email", label: "البريد الإلكتروني", widget: "string", required: false, pattern: ["^$|^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", "بريد إلكتروني غير صحيح"] },
              { name: "phone", label: "الهاتف", widget: "string", required: false, hint: "بالصيغة الدولية، مثل: +966 50 000 0000" },
              { name: "whatsapp", label: "واتساب", widget: "string", required: false, hint: "رقم الجوال بالصيغة الدولية، مثل: +966500000000" },
            ],
          },
          { name: "siteUrl", label: "رابط الموقع", widget: "string", required: false, hint: "مثل: https://ampliq.sa — يُستخدم لروابط محركات البحث وخريطة الموقع.", pattern: ["^$|^https://[^\\s/]+$", "اكتب الرابط كاملاً بدون شرطة في النهاية، مثل: https://ampliq.sa"] },
          { name: "formEndpoint", label: "رابط استقبال نموذج التواصل", widget: "string", required: false, hint: "رابط خدمة مثل Formspree. بدونه يُرسل النموذج عبر البريد الإلكتروني." },
          { name: "gtmId", label: "معرّف Google Tag Manager", widget: "string", required: false, hint: "مثل: GTM-XXXXXXX", pattern: ["^$|^GTM-[A-Z0-9]+$", "يبدأ بـ GTM-"] },
        ],
      },
      {
        name: "clients",
        label: "شعارات العملاء",
        file: `${CONTENT}/clients.json`,
        fields: [
          {
            name: "clients",
            label: "العملاء",
            label_singular: "عميل",
            widget: "list",
            collapsed: true,
            summary: "{{fields.name_ar}}",
            fields: [
              { name: "name_ar", label: "الاسم بالعربية", widget: "string" },
              { name: "name_en", label: "الاسم بالإنجليزية", widget: "string" },
              { name: "logo", label: "الشعار", widget: "image", choose_url: false, media_folder: "/src/assets/img/clients", public_folder: "/assets/img/clients", hint: "يفضّل PNG أو WebP بخلفية شفافة." },
              { name: "bg", label: "لون الخلفية", widget: "color", required: false, allowInput: true, hint: "اتركه فارغاً للخلفية البيضاء. استخدمه للشعارات البيضاء." },
            ],
          },
        ],
      },
    ],
  };

  return {
    backend: { name: "github", repo: REPO, branch: BRANCH, commit_messages: { create: "إضافة {{collection}}: {{slug}}", update: "تحديث {{collection}}: {{slug}}", delete: "حذف {{collection}}: {{slug}}", uploadMedia: "رفع ملف: {{path}}", deleteMedia: "حذف ملف: {{path}}" } },
    // `npx decap-server` + http://localhost:…/admin/ edits the local files without logging in.
    local_backend: true,
    locale: "ar",
    publish_mode: "simple",
    media_folder: "src/assets/uploads",
    public_folder: "/assets/uploads",
    ...(siteUrl ? { site_url: siteUrl, display_url: siteUrl } : {}),
    logo_url: "/assets/img/brand/ampliq-wordmark-light.webp",
    slug: { encoding: "ascii", clean_accents: true, sanitize_replacement: "-" },
    i18n: { structure: "single_file", locales: ["ar", "en"], default_locale: "ar" },
    collections: [blog, servicesCollection, pagesCollection, textsCollection, settingsCollection],
  };
}
