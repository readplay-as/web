/**
 * Builds the "Readplay Slides" design system.
 *
 * One source list of slides produces two things:
 *   dist/**.html   — one self-contained card per slide, for Claude Design
 *   demo.html      — the same slides assembled into a navigable demo deck
 *
 * Claude Design renders cards sandboxed, so nothing may reference an external
 * host or a sibling file. The tokens, slide CSS, display font and background
 * field are therefore inlined at build time — the field read straight from the
 * live site's src/scripts/field.js. Change the site, rerun this, resync, and
 * the deck cannot drift from readplay.app.
 *
 *   node brand/slides/build.mjs
 */

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT = `${ROOT}brand/slides/dist/`;
const DEMO = `${ROOT}brand/slides/demo.html`;

const fieldSource = await readFile(`${ROOT}src/scripts/field.js`, "utf8");
const displayFont = await readFile(`${ROOT}public/fonts/GeistPixel-Circle.woff2`);

/* ------------------------------------------------------------------ *
 * Shared pieces
 * ------------------------------------------------------------------ */

// Sizes are vw fractions of a 1920px stage, so a slide renders identically in
// a design-system card, on a laptop, and projected.
const px = (n) => `${((n / 1920) * 100).toFixed(4)}vw`;

const TOKENS = `
:root {
  --bg: #000000;
  --text: #ffffff;
  --muted: #8e8e8e;
  --pill-dark: #28282a;
  --pill-border: rgba(255, 255, 255, 0.4);
  --pill-text: #c4c2c3;
  --font-sans: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  --font-display: "Geist Pixel Circle", monospace;
}`;

const FONT_FACE = `
@font-face {
  font-family: "Geist Pixel Circle";
  src: url("data:font/woff2;base64,${displayFont.toString("base64")}") format("woff2");
  font-weight: 400;
  font-display: block;
}`;

const SLIDE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); }
body {
  font-family: var(--font-sans);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.slide {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${px(112)} ${px(128)};
}

.slide--centered { align-items: center; text-align: center; }

.slide__field { position: absolute; inset: 0; width: 100%; height: 100%; }

/* keeps type legible over the densest part of the field */
.slide__veil {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center,
    rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%);
}

.slide__body { position: relative; z-index: 1; width: 100%; }
.slide--centered .slide__body { display: flex; flex-direction: column; align-items: center; }

.display {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  padding: ${px(12)} ${px(28)};
  border: 1px solid var(--pill-border);
  border-radius: 999px;
  background: var(--pill-dark);
  color: var(--pill-text);
  font-size: ${px(22)};
  font-weight: 500;
  letter-spacing: 0.01em;
}

.mark { width: ${px(72)}; height: ${px(72)}; }
.mark svg { width: 100%; height: 100%; fill: #fff; }

.body-text {
  font-size: ${px(34)};
  line-height: 1.5;
  color: #d0d0d0;
  margin: 0;
  max-width: ${px(1100)};
}

/* --- per-layout --- */

.swatches { display: grid; grid-template-columns: repeat(5, 1fr); gap: ${px(28)}; }
.swatch__chip { height: ${px(150)}; border-radius: ${px(18)}; border: 1px solid rgba(255,255,255,0.14); }
.swatch__name { margin-top: ${px(16)}; font-size: ${px(24)}; font-weight: 500; }
.swatch__hex { font-size: ${px(20)}; color: var(--muted); font-variant-numeric: tabular-nums; }

.typerow { display: flex; align-items: baseline; gap: ${px(40)}; margin-bottom: ${px(40)}; }
.typerow__label { width: ${px(300)}; flex: none; font-size: ${px(22)}; color: var(--muted); }

.points { margin: ${px(56)} 0 0; padding: 0; list-style: none; }
.points li { position: relative; padding-left: ${px(44)}; margin-bottom: ${px(30)}; font-size: ${px(34)}; color: #d0d0d0; }
.points li::before { content: ""; position: absolute; left: 0; top: ${px(16)}; width: ${px(12)}; height: ${px(12)}; border-radius: 50%; background: #fff; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${px(40)}; margin-top: ${px(64)}; }
.stat__value { font-family: var(--font-display); font-size: ${px(110)}; line-height: 1; }
.stat__label { margin-top: ${px(20)}; font-size: ${px(26)}; color: var(--muted); }

.cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${px(48)}; margin-top: ${px(64)}; }
.col__name { font-size: ${px(40)}; font-weight: 500; letter-spacing: -0.02em; }
.col__desc { margin-top: ${px(18)}; font-size: ${px(26)}; line-height: 1.4; color: var(--muted); }
.col__status { margin-top: ${px(24)}; font-size: ${px(22)}; font-weight: 500; color: rgba(255,255,255,0.62); }`;

/** The R mark, as a path so no image file is needed. */
const MARK = `<svg viewBox="0 0 100 140" aria-hidden="true"><path d="M14 6h38c19 0 31 11 31 27 0 13-8 22-20 25l24 34H70L48 60H32v32H14V6Zm18 16v23h19c9 0 14-4 14-11s-5-12-14-12H32Z"/><rect x="14" y="112" width="72" height="16"/></svg>`;

/**
 * The site sizes node count by viewport area, which is right for a browser and
 * wrong for a slide: one fixed composition viewed at card size, on a laptop and
 * on a projector. Pinning the count keeps density identical at every scale.
 */
const DENSITY = { title: 64, content: 34 };

function fieldScript(nodes) {
  return fieldSource
    .replace("export function initField", "function initField")
    .replace(/const NODE_RANGE = \[\d+, \d+\];/, `const NODE_RANGE = [${nodes}, ${nodes}];`);
}

/**
 * Deck variant: several fields share one page, each with its own density, so
 * initField takes the node count per instance instead of reading a constant.
 */
function deckFieldScript() {
  return fieldSource
    .replace("export function initField", "function initField")
    .replace("function initField(canvas) {", "function initField(canvas, nodeCount) {")
    .replace(
      /const target = Math\.round\([\s\S]*?\);\n/,
      "const target = nodeCount || NODE_RANGE[0];\n"
    );
}

/* ------------------------------------------------------------------ *
 * The slides — one source, two outputs
 * ------------------------------------------------------------------ */

const SLIDES = [
  {
    id: "title",
    path: "layouts/title.html",
    group: "Slide layouts",
    name: "Title slide",
    density: "title",
    inDeck: true,
    body: `
      <div class="eyebrow" style="margin-bottom:${px(48)}">Readplay AS</div>
      <h1 class="display" style="font-size:${px(132)}">Read The Game<br>Play It Better</h1>
      <p class="body-text" style="margin-top:${px(44)}">
        Professional-grade analytics for every club &mdash; not just the ones with an
        analyst on staff.
      </p>`,
  },
  {
    id: "section",
    path: "layouts/section.html",
    group: "Slide layouts",
    name: "Section divider",
    density: "title",
    centered: true,
    inDeck: true,
    body: `
      <div class="eyebrow" style="margin-bottom:${px(40)}">The products</div>
      <h1 class="display" style="font-size:${px(150)}">Three of them</h1>`,
  },
  {
    id: "three-up",
    path: "layouts/three-up.html",
    group: "Slide layouts",
    name: "Three-up",
    density: "content",
    inDeck: true,
    body: `
      <h2 class="display" style="font-size:${px(64)}">What we make</h2>
      <div class="cols">
        ${[
          ["3steps", "Match analytics and team management", "3steps.no &nearr;"],
          ["3steps.news", "European handball news, every day", "3steps.news &nearr;"],
          ["Partnerportalen", "Clubs and their sponsors, one network", "Launching soon"],
        ]
          .map(
            ([name, desc, status]) => `<div class="col">
          <div class="col__name">${name}</div>
          <div class="col__desc">${desc}</div>
          <div class="col__status">${status}</div>
        </div>`
          )
          .join("\n        ")}
      </div>`,
  },
  {
    id: "content",
    path: "layouts/content.html",
    group: "Slide layouts",
    name: "Content slide",
    density: "content",
    inDeck: true,
    body: `
      <h2 class="display" style="font-size:${px(76)}">What we built</h2>
      <ul class="points">
        <li>Live match statistics, pushed as they happen</li>
        <li>Highlights cut from match events &mdash; no manual editing</li>
        <li>Season history that accumulates per player</li>
      </ul>`,
  },
  {
    id: "stats",
    path: "layouts/stats.html",
    group: "Slide layouts",
    name: "Stat slide",
    density: "content",
    inDeck: true,
    body: `
      <h2 class="display" style="font-size:${px(64)}">Where we are</h2>
      <div class="stats">
        <div><div class="stat__value">1s</div><div class="stat__label">Live stat updates</div></div>
        <div><div class="stat__value">0</div><div class="stat__label">Manual clip edits</div></div>
        <div><div class="stat__value">40+</div><div class="stat__label">Stats per match</div></div>
      </div>`,
  },
  {
    id: "closing",
    path: "layouts/closing.html",
    group: "Slide layouts",
    name: "Closing slide",
    density: "title",
    centered: true,
    inDeck: true,
    body: `
      <div class="mark" style="margin-bottom:${px(48)}">${MARK}</div>
      <h1 class="display" style="font-size:${px(110)}">Read The Game</h1>
      <p class="body-text" style="margin-top:${px(40)};text-align:center">
        readplay.app &middot; mkm@readplay.app
      </p>`,
  },
  {
    id: "colours",
    path: "foundations/colours.html",
    group: "Foundations",
    name: "Colours",
    density: "content",
    body: `
      <h2 class="display" style="font-size:${px(64)};margin-bottom:${px(56)}">Colours</h2>
      <div class="swatches">
        ${[
          ["Ink", "#000000"],
          ["Paper", "#FFFFFF"],
          ["Muted", "#8E8E8E"],
          ["Pill", "#28282A"],
          ["Pill text", "#C4C2C3"],
        ]
          .map(
            ([name, hex]) => `<div>
          <div class="swatch__chip" style="background:${hex}"></div>
          <div class="swatch__name">${name}</div>
          <div class="swatch__hex">${hex}</div>
        </div>`
          )
          .join("\n        ")}
      </div>`,
  },
  {
    id: "type",
    path: "foundations/type.html",
    group: "Foundations",
    name: "Type",
    density: "content",
    body: `
      <div class="typerow">
        <div class="typerow__label">Display / 96</div>
        <div class="display" style="font-size:${px(96)}">Read The Game</div>
      </div>
      <div class="typerow">
        <div class="typerow__label">Display / 64</div>
        <div class="display" style="font-size:${px(64)}">Section title</div>
      </div>
      <div class="typerow">
        <div class="typerow__label">Body / 34</div>
        <div class="body-text">Inter, regular. Everything that is not a headline.</div>
      </div>
      <div class="typerow">
        <div class="typerow__label">Caption / 22</div>
        <div style="font-size:${px(22)};color:var(--muted)">Labels, sources, footnotes.</div>
      </div>`,
  },
  {
    id: "field",
    path: "foundations/field.html",
    group: "Foundations",
    name: "Background field",
    density: "title",
    body: `
      <h2 class="display" style="font-size:${px(64)}">The field</h2>
      <p class="body-text" style="margin-top:${px(32)}">
        Nodes drift, links appear between near neighbours, and a pass travels one
        of them every few seconds. The same code that runs readplay.app &mdash; density
        is the only thing that changes between a title slide and a content slide.
      </p>`,
  },
];

const markup = (s, canvasId = "bgField") => `
<div class="slide${s.centered ? " slide--centered" : ""}">
  <canvas class="slide__field" id="${canvasId}" aria-hidden="true"></canvas>
  <div class="slide__veil"></div>
  <div class="slide__body">${s.body}
  </div>
</div>`;

/* ------------------------------------------------------------------ *
 * Output 1 — design-system cards
 * ------------------------------------------------------------------ */

await rm(OUT, { recursive: true, force: true });

for (const s of SLIDES) {
  const html = `<!-- @dsCard group="${s.group}" -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${s.name}</title>
<style>${FONT_FACE}${TOKENS}${SLIDE_CSS}</style>
</head>
<body>${markup(s)}
<script>${fieldScript(DENSITY[s.density])}
initField(document.getElementById('bgField'));
<\/script>
</body>
</html>
`;
  const target = `${OUT}${s.path}`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}
console.log(`${SLIDES.length} cards -> brand/slides/dist/`);

/* ------------------------------------------------------------------ *
 * Output 2 — the demo deck
 * ------------------------------------------------------------------ */

const deck = SLIDES.filter((s) => s.inDeck);

const DECK_CSS = `
body {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 3vh, 30px);
  padding: clamp(16px, 4vh, 40px) clamp(14px, 4vw, 48px);
  /* the page ground sits just off the slide's true black, so the slide reads
     as a surface rather than bleeding into the page */
  background: #0b0b0c;
}

.stage {
  position: relative;
  width: min(1240px, 100%);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px rgba(0,0,0,0.6);
}

/* inside the deck a slide is sized by the stage, not the page */
.stage .slide { font-size: initial; }
.deck-slide { display: none; }
.deck-slide.is-active { display: block; animation: slideIn 0.34s ease both; }

@keyframes slideIn { from { opacity: 0; } to { opacity: 1; } }

.controls {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 18px);
  width: min(1240px, 100%);
  font-family: var(--font-sans);
}

.controls__name {
  flex: 1;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--muted);
}

.controls__count {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}
.nav:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }
.nav:disabled { opacity: 0.3; cursor: default; }
.nav:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

.dots { display: flex; gap: 7px; }
.dot {
  width: 7px; height: 7px; padding: 0;
  border: 0; border-radius: 50%;
  background: rgba(255,255,255,0.24);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}
.dot:hover { background: rgba(255,255,255,0.5); }
.dot.is-active { background: #fff; transform: scale(1.25); }
.dot:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

.hint {
  font-family: var(--font-sans);
  font-size: 11.5px;
  letter-spacing: 0.03em;
  color: rgba(255,255,255,0.3);
}

@media (prefers-reduced-motion: reduce) {
  .deck-slide.is-active { animation: none; }
  .nav, .dot { transition: none; }
}`;

const deckHtml = `<title>Readplay Slides</title>
<style>${FONT_FACE}${TOKENS}${SLIDE_CSS}${DECK_CSS}</style>

<div class="stage">
${deck
  .map(
    (s, i) =>
      `  <div class="deck-slide${i === 0 ? " is-active" : ""}" data-name="${s.name}">${markup(
        s,
        `field-${s.id}`
      )}
  </div>`
  )
  .join("\n")}
</div>

<div class="controls">
  <button class="nav" id="prev" aria-label="Previous slide" disabled>&larr;</button>
  <button class="nav" id="next" aria-label="Next slide">&rarr;</button>
  <div class="dots" id="dots" role="tablist" aria-label="Slides"></div>
  <div class="controls__name" id="slideName">${deck[0].name}</div>
  <div class="controls__count" id="count">01 / ${String(deck.length).padStart(2, "0")}</div>
</div>

<p class="hint">Arrow keys to move between slides</p>

<script>
${deckFieldScript()}

const slides = [...document.querySelectorAll('.deck-slide')];
const densities = ${JSON.stringify(deck.map((s) => DENSITY[s.density]))};
const started = new Set();
let index = 0;

const dots = document.getElementById('dots');
slides.forEach((slide, i) => {
  const dot = document.createElement('button');
  dot.className = 'dot' + (i === 0 ? ' is-active' : '');
  dot.setAttribute('role', 'tab');
  dot.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + slide.dataset.name);
  dot.addEventListener('click', () => show(i));
  dots.appendChild(dot);
});

/**
 * A hidden slide's canvas has no size, so its field is started the first time
 * the slide is shown — and every later visit dispatches a resize so the canvas
 * picks the stage's dimensions back up.
 */
function startField(i) {
  const canvas = slides[i].querySelector('canvas');
  if (!started.has(i)) {
    started.add(i);
    initField(canvas, densities[i]);
  }
  window.dispatchEvent(new Event('resize'));
}

function show(i) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((slide, n) => slide.classList.toggle('is-active', n === index));
  [...dots.children].forEach((dot, n) => dot.classList.toggle('is-active', n === index));
  document.getElementById('slideName').textContent = slides[index].dataset.name;
  document.getElementById('count').textContent =
    String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  document.getElementById('prev').disabled = index === 0;
  document.getElementById('next').disabled = index === slides.length - 1;
  startField(index);
}

document.getElementById('prev').addEventListener('click', () => show(index - 1));
document.getElementById('next').addEventListener('click', () => show(index + 1));
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(index + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(index - 1); }
  if (e.key === 'Home') show(0);
  if (e.key === 'End') show(slides.length - 1);
});

show(0);
<\/script>
`;

await writeFile(DEMO, deckHtml);
console.log(`${deck.length}-slide deck -> brand/slides/demo.html`);
