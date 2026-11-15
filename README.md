# Rano Europe - Shopify theme

OS 2.0 theme for [ranoeurope.com](https://ranoeurope.com), layout modelled on doreandrose.com. Vanilla JS + one CSS file, no build step.

## Install

**Option A - GitHub integration (recommended):** Shopify admin → Online Store → Themes → Add theme → Connect from GitHub → pick this repo + `main`. Every push updates the theme.

**Option B - zip:** download this repo as zip (or zip the 7 theme folders) → Themes → Add theme → Upload zip.

Then:
- Pages: assign template `page.about` to *About us*, `page.contact` to *Contact*.
- Navigation: header uses menu `main-menu`, footer uses `main-menu` + `footer`.

## Notes
- Every image/video section has a bundled fallback in `assets/`; uploads in the theme editor override it.
- Check shipping/returns copy in `templates/product.json` against the real policy.
