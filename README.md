# Rano Europe - Shopify theme

OS 2.0 theme for [ranoeurope.com](https://ranoeurope.com), layout modelled on doreandrose.com.

**Live preview:** https://semdesnoo.github.io/rano-europe-theme/
**Shopify zip (always latest):** [Releases > latest > rano-europe-theme.zip](https://github.com/Semdesnoo/rano-europe-theme/releases/tag/latest)

## Workflow
1. Edit files on GitHub (pencil icon) or locally, commit to `main`.
2. GitHub Actions rebuilds the preview site and the Shopify zip (about 1 minute, see the *Actions* tab).
3. Happy with the preview? Download the zip from *Releases* and upload it in Shopify.

## Where to change what
| What | File |
|---|---|
| Homepage texts, images, videos, section order | `templates/index.json` |
| Product page tabs (care, shipping) | `templates/product.json` |
| About / Contact page | `templates/page.about.json`, `templates/page.contact.json` |
| Announcement bar, header | `sections/header-group.json` |
| Footer texts | `sections/footer.liquid` (schema defaults) |
| Colours, logo width, cart message | `config/settings_data.json` |
| Photos & videos | `assets/` (upload a file with the same name to replace it) |
| Styling | `assets/rano.css` |

Preview-only (not in the zip): `preview/` renders the theme with the real Rano products; product photos live in `preview/img/` because in Shopify they come from the store itself. Cart/checkout only work in Shopify.

Local preview: `npm install && npm run preview`, then serve `_site/` with any static server.

## Shopify install
Upload the zip (Online Store > Themes > Add theme > Upload zip), then:
- Pages: assign template `page.about` to *About us*, `page.contact` to *Contact*.
- Navigation: `main-menu` = Shop All, Bestsellers, About, Contact. Give *Shop All* sub-items with their own sub-items (e.g. By category / By colour / Highlights) to get the mega menu columns; the 4 images are set in the header section. Footer uses `main-menu` + `footer`.
- Settings > Markets / Languages: add countries and languages so the selector in the top bar shows them.
- Customer accounts (Settings > Customer accounts): turn on, then *Customize* > upload `assets/account-banner.png` as logo/banner and set the accent colour to #151514. Shopify hosts the sign-in / create-account page; `preview/account.html` shows how it looks.
- Check shipping/returns copy in `templates/product.json` against the real policy.
