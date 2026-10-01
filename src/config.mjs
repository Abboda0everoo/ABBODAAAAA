// Site-wide settings shared by the Arabic and English pages.
// Fill in the contact details below — anything left empty is shown as a
// bracketed placeholder on the page (as in the company profile deck).

export default {
  // Public URL of the site, without a trailing slash (e.g. "https://ampliq.sa").
  // When set, the build adds canonical/hreflang URLs, absolute Open Graph
  // image URLs, and a sitemap.xml.
  siteUrl: "",

  contact: {
    // e.g. "hello@ampliq.sa" — also enables the contact form (opens the
    // visitor's email app with the message pre-filled).
    email: "",
    // e.g. "+966 5X XXX XXXX"
    phone: "",
    // e.g. "www.ampliq.sa"
    website: "",
  },

  year: 2026,

  // Client logos, in the order shown in the company profile (reading order).
  // `bg` is used for logos that come with their own background colour.
  clients: [
    { file: "l15", ar: "الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)", en: "Saudi Data & AI Authority (SDAIA)" },
    { file: "l01", ar: "وزارة الموارد البشرية والتنمية الاجتماعية", en: "Ministry of Human Resources and Social Development" },
    { file: "l09", ar: "معهد الإدارة العامة", en: "Institute of Public Administration (IPA)" },
    { file: "l03", ar: "قناة العربية", en: "Al Arabiya News Channel" },
    { file: "l16", ar: "جامعة الملك خالد", en: "King Khalid University" },
    { file: "l02", ar: "جامعة جدة", en: "University of Jeddah" },
    { file: "l00", ar: "كليات عنيزة", en: "Onaizah Colleges" },
    { file: "l14", ar: "أكاديمية تطوير القيادات الإدارية (عدل)", en: "Academy for Developing Administrative Leaders (ADAL)" },
    { file: "l04", ar: "مركز الأعمال – معهد الإدارة العامة", en: "Business Center – IPA" },
    { file: "l13", ar: "إثرائي – معهد الإدارة العامة", en: "Ethrai – IPA" },
    { file: "l06", ar: "كي تايم", en: "KEYTIME" },
    { file: "l11", ar: "التاروتي", en: "Altarouti" },
    { file: "l12", ar: "مجمع توليب الطبي", en: "Tulip Medical Complex" },
    { file: "l10", ar: "فلو", en: "FLOW" },
    { file: "l05", ar: "شعار عميل", en: "Client logo", bg: "#261F53" },
    { file: "l08", ar: "التسوق الذكي", en: "Smart Shopping", bg: "#00B3B0" },
    { file: "l07", ar: "شعار عميل", en: "Client logo", bg: "#152C24" },
  ],
};
