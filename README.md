# AMPLIQ | أمبليك — Company Website

Bilingual (Arabic / English) website for **AMPLIQ** — Marketing Intelligence & Technology.
Content comes from the *AMPLIQ Company Profile 2026*; the visual language follows the *AMPLIQ Design System v1.0*.

- **Arabic** (default, right-to-left): `dist/index.html`
- **English** (left-to-right): `dist/en/index.html`

The site is plain static HTML/CSS/JS. A zero-dependency Node script generates both language pages from one template, so the two versions always share the same layout.

## Quick start

```bash
npm run dev      # build + preview at http://localhost:4173
npm run build    # rebuild dist/ after editing anything in src/
```

Requires Node 18+. No `npm install` needed.

## Before going live

Open `src/config.mjs` and fill in:

| Setting | What it does |
|---|---|
| `contact.email` | Shown in the contact section and footer. **Also turns on the contact form**, which opens the visitor's email app with their message pre-filled. |
| `contact.phone` | Shown as a tap-to-call link. |
| `contact.website` | Shown in the contact section and footer. |
| `siteUrl` | e.g. `https://ampliq.sa`. Adds canonical/hreflang tags, absolute social-preview image URLs, and `sitemap.xml`. |

Until these are set, the page shows bracketed placeholders (e.g. `[البريد الإلكتروني]`), as in the company profile. Then run `npm run build`.

## Editing content

| File | Contents |
|---|---|
| `src/content/ar.mjs` | All Arabic text |
| `src/content/en.mjs` | All English text (same structure as Arabic) |
| `src/config.mjs` | Contact details, site URL, client logo list |

The build stops with a clear message if the Arabic and English files fall out of step (missing key, different number of items), so neither page silently loses content.

Two client logos have no confirmed name and use a generic alt text ("Client logo"): `l05` and `l07` in `src/config.mjs`. Add their names there.

## Project structure

```
build.mjs              # generates dist/ from src/
scripts/serve.mjs      # local preview server
src/
  config.mjs           # contact details, site URL, clients
  content/ar.mjs       # Arabic content
  content/en.mjs       # English content
  template.mjs         # page markup (shared by both languages)
  icons.mjs            # Feather icon set used by the design system
  styles/main.css      # design-system tokens + all styles
  scripts/main.js      # mobile menu, active nav, reveal-on-scroll, contact form
  assets/              # logos, photos, client logos, fonts, favicons
dist/                  # built site — deploy this folder
```

## Deploying

`dist/` is a complete static site. Upload it to any static host:

- **Netlify / Vercel / Cloudflare Pages:** build command `npm run build`, publish directory `dist`.
- **GitHub Pages:** publish the `dist` folder (e.g. with a Pages workflow).
- **Any web server:** copy the contents of `dist/` to the web root.

`dist/404.html` is used by most static hosts for unknown URLs.

## Design system notes

- **Colors:** Deep Navy `#0B1D33` is the ground, Navy Raised `#12284A` for cards on navy, Electric Teal `#00BFA5` for emphasis on navy only, Teal `#00897B` / `#007A6D` for teal on white, Warm Gold reserved for the logo.
- **Type:** Tajawal for Arabic, Satoshi for English, labels, and all numbers. Latin digits render in Satoshi even inside Arabic text.
- **Components:** cards with 12px radius, one dark "featured" card per row (the first in reading order), Feather line icons in teal, numbered steps with the first step filled.
- No gradients, no underlines under headings, no colored edge stripes; team photos in black & white.

## Credits

- Icons: [Feather Icons](https://feathericons.com) — MIT License
- Fonts: [Tajawal](https://fonts.google.com/specimen/Tajawal) (SIL Open Font License), [Satoshi](https://www.fontshare.com/fonts/satoshi) by Indian Type Foundry (ITF Free Font License)
