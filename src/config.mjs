// Site-wide settings shared by the Arabic and English sites.
// Anything left empty is either hidden or shown as a bracketed placeholder,
// so the site never links to a wrong address.

export default {
  // Public URL of the site, without a trailing slash (e.g. "https://ampliq.sa").
  // Turns on canonical + hreflang tags, absolute share-image URLs,
  // breadcrumb structured data, and the per-language sitemaps.
  siteUrl: "",

  contact: {
    email: "", // e.g. "hello@ampliq.sa"
    phone: "", // e.g. "+966 5X XXX XXXX"
    whatsapp: "", // international format, digits only, e.g. "9665XXXXXXXX" — shows the floating WhatsApp button
  },

  form: {
    // Where the contact form sends submissions: any endpoint that accepts a
    // JSON POST and answers 2xx (e.g. Formspree, Getform, your own API).
    // Without an endpoint, the form opens the visitor's email app addressed
    // to contact.email instead.
    endpoint: "",
  },

  // Google Tag Manager container (e.g. "GTM-XXXXXXX"). When set, a cookie
  // consent banner appears and GTM loads only after the visitor accepts.
  gtmId: "",

  year: 2026,

  // Client logos, in the reading order of the company profile.
  // `file` is the image in src/assets/img/clients/ (without .webp);
  // `bg` is used for logos that come with their own background colour.
  clients: [
    { file: "sdaia", ar: "الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)", en: "Saudi Data & AI Authority (SDAIA)" },
    { file: "hrsd", ar: "وزارة الموارد البشرية والتنمية الاجتماعية", en: "Ministry of Human Resources and Social Development" },
    { file: "ipa", ar: "معهد الإدارة العامة", en: "Institute of Public Administration (IPA)" },
    { file: "arabiya", ar: "قناة العربية", en: "Al Arabiya News Channel" },
    { file: "kku", ar: "جامعة الملك خالد", en: "King Khalid University" },
    { file: "uj", ar: "جامعة جدة", en: "University of Jeddah" },
    { file: "onaizah", ar: "كليات عنيزة", en: "Onaizah Colleges" },
    { file: "adal", ar: "أكاديمية تطوير القيادات الإدارية (عدل)", en: "Academy for Developing Administrative Leaders (ADAL)" },
    { file: "bc", ar: "مركز الأعمال – معهد الإدارة العامة", en: "Business Center – IPA" },
    { file: "ethrai", ar: "إثرائي – معهد الإدارة العامة", en: "Ethrai – IPA" },
    { file: "keytime", ar: "كي تايم", en: "KEYTIME" },
    { file: "tulip", ar: "مجمع توليب الطبي", en: "Tulip Medical Complex" },
    { file: "altarouti", ar: "التاروتي", en: "Altarouti" },
    { file: "flow", ar: "فلو", en: "FLOW" },
    { file: "msk", ar: "مسك", en: "Msk", bg: "#261F53" },
    { file: "smart", ar: "التسوق الذكي", en: "Smart Shopping", bg: "#00B3B0" },
    { file: "green", ar: "شعار عميل", en: "Client logo", bg: "#142B23" },
  ],
};
