# Readplay Slides

A slide design system built from the same code as readplay.app, so decks and
the site cannot drift apart.

```
build.mjs      the source of truth — one SLIDES list, two outputs
dist/          9 self-contained cards, uploaded to Claude Design
demo.html      the same slides assembled into a navigable demo deck
```

Run `node brand/slides/build.mjs` after any change. It regenerates both outputs.

`dist/` is generated and gitignored — build before resyncing to Claude Design.
`demo.html` is generated too, but committed, since it is the published artifact.

## Where it already lives

| What | Where |
|---|---|
| Design system | Claude Design project **Readplay Slides**, `5a74e74a-ed6b-4b83-a740-39be6c945447` |
| Demo deck | https://claude.ai/code/artifact/2d7d51cd-8af8-4d76-8475-1c1247851889 |
| Flat backgrounds | `brand/presentation/*.png` (1920×1080 and 3840×2160, title and content density) |

## Making a new deck

**Ask Claude Code, in this repo.** "Build a deck about X using the slide
system." It adds entries to the `SLIDES` array in `build.mjs`, reruns the
build, and publishes `demo.html` as an artifact you can open or share. Best
when the deck should be repeatable or version-controlled.

**Ask Claude on claude.ai, pointing at the design system.** "Use the Readplay
Slides design system — make me a 6-slide update deck." The cards define what
on-brand means, so it comes back using these layouts. Best for a one-off deck
that doesn't need to live in the repo.

**PowerPoint, Google Slides or Keynote.** Use the PNGs in
`brand/presentation/` as slide-layout backgrounds. Title density for openers
and dividers, content density for anything with body copy.

## The layouts

Title · Section divider · Three-up · Content · Stat · Closing, plus three
foundation cards (Colours, Type, Background field).

## How it is put together

- **The field** is read straight from `src/scripts/field.js` at build time, not
  copied. Change the site's background, rerun the build, resync — the deck
  follows.
- **Density is pinned**, unlike the site: 64 nodes for title slides, 34 for
  content. The site scales node count by viewport area, which is right for a
  browser and wrong for one fixed composition seen at card size, on a laptop
  and on a projector.
- **Sizes are `vw` fractions of a 1920px stage**, so a slide renders identically
  at any width.
- **Everything is inlined** — tokens, CSS, the display font as a base64 data
  URI. Claude Design renders cards sandboxed, so no external hosts and no
  sibling-file references.
- **The display face is Geist Pixel Circle** (OFL), not the Bubbledot the site
  loads from a third-party CDN. If that licence question resolves, the two
  converge.
- **Non-ASCII glyphs are HTML entities** (`&mdash;`, `&rarr;`). The deck has no
  charset declaration of its own and must not depend on the host supplying one.

## Resyncing the design system

After rebuilding, the cards in `dist/` need pushing to the Claude Design
project — ask Claude Code to resync them. It writes only the changed cards; it
never wholesale-replaces the project.
