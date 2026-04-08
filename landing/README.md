# EdSchool Marketing Landing Page

Static, production-ready marketing landing page for EdSchool. No build step required.

## How to view

- **Local:** Open `index.html` in a browser, or serve the folder:
  - `npx serve .` (from this directory)
  - Or copy the `landing/` folder to your web server document root.
- **Deploy:** Upload the contents of `landing/` to your host (e.g. `edumapping.com/edschool/`). Ensure `index.html`, `styles.css`, and `script.js` are in the same directory.

## Structure

- `index.html` — All sections: nav, hero, stats, features (tabs), roles, parent spotlight, benefits, how it works, CTA, footer.
- `styles.css` — CSS variables, layout, responsive, animations.
- `script.js` — Nav scroll, mobile menu, smooth scroll, feature tabs, scroll-triggered fade-up, contact form mailto.

## Customisation

- **Colours/fonts:** Edit `:root` in `styles.css`.
- **Copy/links:** Edit `index.html` (CTAs, footer URL, contact email).
- **Contact form:** Submitting opens the default mail client with a pre-filled email. For a server-side form, replace the `submit` handler in `script.js` with an `fetch()` to your endpoint.
