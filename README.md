# m0uss1 — Portfolio

Portfolio website for **Mohammed Ali Moussi** (m0uss1) — Designer, Video Editor & Developer from Tunisia.

Built with **pure HTML/CSS/JS + the Tailwind Play CDN** — no frameworks, no build step. Ready to deploy on **GitHub Pages**.

## Pages
- **`index.html`** — Full portfolio (hero, about, services, process, work gallery, testimonials, showreel, links section)
- **`gallery.html`** — Full, searchable Pinterest-style page of all work (category chips + live search + masonry layout, deep-linkable via `?cat=&q=`)
- **`links.html`** — Mobile-first profile card: moody hero, avatar, socials, portfolio link, email pill

## Features
- 🌐 Styled language dropdown: **English / Français / Tunisian (تونسي)** — persisted in `localStorage`, translations live in `data/i18n.json` (embedded fallback in `js/i18n.js`)
- 🌓 **Dark / Light** mode toggle — persisted in `localStorage`
- 🪖 **Boot-sequence preloader** ("BOOTING..." → "m0uss1 SYSTEMS ONLINE")
- 🫁 **Breathing hero background** (slow idle zoom) + roaming surveillance scan bar
- 📱 **Mobile-first** responsive design
- 🎞 Cinematic editing-suite aesthetic with custom surveillance-tracker cursor + CRT overlay
- 📊 Skills shown as animated **donut pie charts**
- 🖼 **Data-driven work gallery** (`data/gallery.json`): each item has type, per-language title/description, media (`image` / `gif` / `youtube`), aspect ratio, year, tags and a featured flag. Hover reveals a camera-HUD (corner ticks + timestamp). Click opens a lightbox with prev/next + keyboard navigation; YouTube items play in an embedded iframe
- 🔍 **gallery.html** — search (title/desc/tags), category chips with per-category counts, masonry (CSS columns) and an empty state
- 🍬 **Frosted buttons** (translucent + blurred + glowing edge) for all CTAs — no solid red buttons
- ✨ **Mouse-tracking glow edge** + glint swipe on service/process/testimonial cards
- 🏷 Tools **marquee ticker** between sections — pauses on hover
- 📈 Scroll progress bar + back-to-top button
- 💬 Testimonials strip
- 🚥 On-brand favicon + Open Graph meta tags for sharing
- 🧊 ⚠️ Needs internet at runtime for the **Tailwind CDN** (and YouTube thumbnails) — swap to a compiled build for offline hosting

## Local admin (private, never pushed)

A password-free, local-only dashboard to manage every item and translation.

```bash
python3 admin/server.py        # -> http://localhost:8000/admin/index.html
```

The **`admin/`** folder is `.gitignore`d and required nothing but Python 3's standard library.

### Tabs
- **Items** — Pinterest-style editor: add / duplicate / delete / reorder items; set type, aspect ratio (`1:1`, `3:2`, `2:3`, `4:3`, `16:9`, `9:16`, `1:2`, `2:1`, `free`), year, featured flag and tags; upload a real file (saved to `assets/uploads/`) or paste a URL for `image`/`gif`; for `youtube` paste the video ID (embed + poster are automatic)
- **Translations** — table of every key × EN / FR / TN (grouped by prefix), add/delete keys, Save
- **Preview** — live iframe of the portfolio

### API (served by `admin/server.py` only)
- `GET /api/gallery` · `POST /api/gallery` (writes `data/gallery.json`)
- `POST /api/i18n` (writes `data/i18n.json`)
- `POST /api/upload` · `GET /api/uploads`
- `POST /api/backup` · `GET /api/backup` · `GET /api/backup?restore=<name>`

## How to customize

### 1. Your logo
Replace **`assets/logo.ico`** and **`assets/logo.webp`** with your profile picture.

### 2. Add your real work (fastest way: use the admin)
Put your design files in **`assets/images/`** (or let the admin upload into `assets/uploads/`), then add an entry to `data/gallery.json`:

```json
{
  "id": "w8",
  "type": "thumbnails",
  "year": "2026",
  "featured": false,
  "ratio": "16:9",
  "media": {"kind": "image", "src": "assets/images/your-file.png"},
  "title": {"en": "...", "fr": "...", "tn": "..."},
  "desc":  {"en": "...", "fr": "...", "tn": "..."},
  "tags": ["minecraft", "logo"]
}
```

For a YouTube item: `"media": {"kind": "youtube", "videoId": "aqz-KE-bpKQ"}`.

Item types can be anything; add a matching label key like `work.filter.<type>` to `data/i18n.json` (the category chips build themselves from the data).

### 3. Change any text
Edit the translations in **`data/i18n.json`** (or use the admin tab). The embedded copy in `js/i18n.js` is the offline fallback.

### 4. Update your socials
In **`links.html`**, edit the link targets:
- YouTube: `https://youtube.com/@elmoussi`
- Instagram: `https://instagram.com/m0uss1`

## Deploy to GitHub Pages
1. Create a repo named `<your-username>.github.io` (or `m0uss1.github.io`).
2. Upload the files at the repo root (**`admin/` is gitignored — never push it**).
3. Go to **Settings → Pages → Source** → select branch `main` / root.
4. Your site is live at `https://<your-username>.github.io`.

## File structure
```
portfolio/
├── index.html        # Full portfolio (Tailwind)
├── gallery.html      # Searchable masonry gallery
├── links.html        # Link-in-bio hub
├── css/site.css      # Theme vars + effects (Tailwind complements it)
├── js/
│   ├── i18n.js       # EN / FR / TN fallback dict + loads data/i18n.json
│   ├── main.js       # theme, language, effects
│   └── gallery.js    # data-driven gallery renderer + lightbox
├── data/
│   ├── gallery.json  # work items
│   └── i18n.json     # translations (managed via admin)
├── admin/            # LOCAL ONLY — python server + UI (gitignored)
└── assets/
    ├── logo.ico / logo.webp
    ├── images/       # work files + hero-bg.webp
    └── uploads/      # files uploaded via the admin
```

© m0uss1 — Made with ♥