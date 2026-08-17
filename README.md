# Readplay website

readplay.app — the company page for Readplay AS. 3steps.no sells the product;
this page says who builds it and what else they make. Single viewport, static
[Astro](https://astro.build) output, no UI framework.

## Commands

```bash
npm install
npm run dev         # dev server on http://localhost:4321
npm run build       # static output to dist/
npm run preview     # serve the built dist/ with Astro
npm run cf:preview  # build, then serve dist/ through workerd (as production does)
npm run deploy      # build, then deploy to Cloudflare Workers
```

Hosting is Cloudflare Workers Static Assets (`wrangler.jsonc`) — an assets-only
Worker with no script: `dist/` is served from the edge, unmatched paths get
`404.html`. The custom-domain route is commented out on purpose; uncommenting
it repoints readplay.app's DNS away from the current Vercel deployment.

## Structure

```
public/
  assets/logo.webp              # the R mark, black on transparent
  favicon.ico, apple-touch-icon.png, og.png
  fonts/GeistPixel-Circle.woff2 # display-font fallback behind BubbledotICG-FinePos
src/
  data/site.ts                  # every string and destination on the page
  layouts/Layout.astro          # head: meta, OG tags, Inter + BubbledotICG-FinePos + Font Awesome
  components/
    BackgroundField.astro       # canvas element for the tracking field
    SiteHeader.astro  Hero.astro  ProductRow.astro  MobileMenu.astro
  pages/index.astro
  scripts/
    field.js                    # drifting nodes, links between neighbours, passes
    main.js                     # mobile menu, field bootstrap
  styles/global.css             # tokens, layout, animations, breakpoints
```

**All copy lives in `src/data/site.ts`** — nav, headline, subhead, CTA, the
three products and the legal line. Change it there, not in the components.

Two placeholders in that file: `company.orgNumber` is empty (the legal line
omits the segment until it's set), and `trustAvatars` uses Font Awesome
silhouettes — give each entry a `src` instead of an `icon` to swap in real
coach portraits.

Brand assets are generated from `Readplay icon.png`; regenerate them if the
mark changes.

Deploys as plain static files — `npm run build`, then serve `dist/`.
