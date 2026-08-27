# m0uss1 — Portfolio

Portfolio website for **Mohammed Ali Moussi** (m0uss1) — Designer, Video Editor & Developer from Tunisia.

Built with **pure HTML/CSS/JS** — no frameworks, no build step. Ready to deploy on **GitHub Pages**.

## Pages
- **`index.html`** — Full portfolio (hero, about, work gallery, showreel, links section)
- **`links.html`** — Link-in-bio style social hub (like link.me)

## Features
- 🌐 Language switcher: **English / Français / Tunisian (تونسي)** — persisted in `localStorage`
- 🌓 **Dark / Light** mode toggle — persisted in `localStorage`
- 📱 **Mobile-first** responsive design
- 🎞 Cinematic editing-suite aesthetic with custom cursor + film grain
- 🖼 Filterable work gallery (Thumbnails / Logos & Banners / Video / Code) with lightbox

## How to customize

### 1. Your logo
Replace **`assets/logo.png`** with your profile picture.

### 2. Add your real work
Put your design files in **`assets/images/`**, then in `index.html` update the gallery cards:
```html
<img src="assets/images/your-file.png" alt="Your work" />
```
The `data-category` controls which filter it appears under:
- `thumbnails` → Thumbnails
- `branding` → Logos & Banners
- `video` → Video
- `code` → Code

### 3. Add your showreel
Drop your video in **`assets/videos/showreel.mp4`**, then in `index.html` replace the showreel placeholder with:
```html
<video class="showreel-video" src="assets/videos/showreel.mp4" controls autoplay muted loop></video>
```

### 4. Update your socials
In **`links.html`**, edit the link targets:
- YouTube: `https://youtube.com/@elmoussi`
- Instagram: `https://instagram.com/m0uss1`
- Discord: handle `m0uss1`
- Email: `ilovemoussi@gmail.com`

To change any text, edit the translations in **`js/i18n.js`**.

## Deploy to GitHub Pages
1. Create a repo named **`<your-username>.github.io`** (or `m0uss1.github.io`).
2. Upload these files at the repo root.
3. Go to **Settings → Pages → Source** → select branch `main` / root.
4. Your site is live at `https://<your-username>.github.io`.

## File structure
```
portfolio/
├── index.html        # Full portfolio
├── links.html        # Link-in-bio hub
├── css/style.css     # Styles + dark/light themes
├── js/
│   ├── i18n.js       # EN / FR / TN translations
│   ├── main.js       # theme, language, effects
│   ├── gallery.js    # filter + lightbox
│   └── links.js      # links page interactions
└── assets/
    ├── logo.png
    ├── images/       # work placeholders
    └── videos/       # showreel
```

© m0uss1 — Made with ♥
