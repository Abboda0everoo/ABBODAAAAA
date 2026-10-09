// Small helpers shared by the templates and the build.

import { posix } from "node:path";
import { icons, brands } from "./icons.mjs";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Content text: escaped, with **bold** support. On Arabic pages the Latin
// brand name is marked as English so it renders in Montserrat.
export const txt = (s, lang) => {
  let out = esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  if (lang === "ar") out = out.replace(/Ampliq/g, '<span lang="en">Ampliq</span>');
  return out;
};

// Latin fragments (overlines, numbers) inside an Arabic page keep LTR order.
export const latin = (s, lang) => (lang === "ar" ? `<span lang="en" dir="ltr">${esc(s)}</span>` : esc(s));
export const num = (s) => `<span class="num" dir="ltr">${esc(s)}</span>`;

export const icon = (name, cls = "") => {
  if (!icons[name]) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
};

export const brandIcon = (name, cls = "") => {
  if (!brands[name]) throw new Error(`Unknown brand icon: ${name}`);
  return `<svg class="icon icon--brand${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${brands[name]}"/></svg>`;
};

// Site paths are folders ("", "about/", "en/blog/x/"). Links between pages are
// relative, so the site works from any folder or sub-path.
const dirOf = (p) => (p === "" ? "." : p.replace(/\/$/, ""));
export const relLink = (from, to) => {
  const r = posix.relative(dirOf(from), dirOf(to));
  return r === "" ? "./" : `${r}/`;
};
export const relFile = (from, file) => posix.relative(dirOf(from), file);

export const formatDate = (iso, locale) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

