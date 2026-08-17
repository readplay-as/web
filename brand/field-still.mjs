/**
 * Renders still frames of the readplay.app background field for use outside
 * the site — presentation backgrounds, covers, social images.
 *
 * Same idea as src/scripts/field.js (nodes, links between near neighbours),
 * but deterministic: a fixed seed per variant, so re-running produces the
 * identical image rather than a new random one.
 *
 *   node brand/field-still.mjs
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = new URL("./presentation/", import.meta.url).pathname;

/** Deterministic PRNG — same seed, same field, every run. */
function prng(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

const VARIANTS = [
  {
    // Title slides: field across the whole frame, centre still calm enough for a big line of type.
    name: "title",
    seed: 20260817,
    nodes: 74,
    linkDistance: 0.19,
    clearCentre: 0.3,
    dotOpacity: 0.72,
    lineOpacity: 0.3,
    veil: [0.5, 0.22, 0.04],
  },
  {
    // Content slides: sparser and dimmer, with a wide clear middle for body copy.
    name: "content",
    seed: 99012026,
    nodes: 46,
    linkDistance: 0.21,
    clearCentre: 0.42,
    dotOpacity: 0.52,
    lineOpacity: 0.2,
    veil: [0.78, 0.5, 0.12],
  },
];

const SIZES = [
  [1920, 1080],
  [3840, 2160],
];

function render({ width, height, variant }) {
  const rand = prng(variant.seed);
  const scale = Math.min(width, height);
  const max = variant.linkDistance * scale;

  const pts = [];
  for (let i = 0; i < variant.nodes; i++) {
    pts.push({
      x: rand() * width,
      y: rand() * height,
      r: (1.1 + rand() * 1.5) * (scale / 1080),
    });
  }

  let svg = "";
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d >= max) continue;
      const o = variant.lineOpacity * (1 - d / max);
      svg +=
        `<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}"` +
        ` x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}"` +
        ` stroke="#fff" stroke-opacity="${o.toFixed(3)}" stroke-width="${(scale / 1080).toFixed(2)}"/>`;
    }
  }
  for (const p of pts) {
    svg +=
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}"` +
      ` r="${p.r.toFixed(2)}" fill="#fff" fill-opacity="${variant.dotOpacity}"/>`;
  }

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <rect width="${width}" height="${height}" fill="#000"/>
       ${svg}
       <rect width="${width}" height="${height}" fill="url(#clear)"/>
       <defs>
         <radialGradient id="clear" cx="50%" cy="50%" r="72%">
           <stop offset="0%" stop-color="#000" stop-opacity="${variant.veil[0]}"/>
           <stop offset="${Math.round(variant.clearCentre * 100)}%" stop-color="#000" stop-opacity="${variant.veil[1]}"/>
           <stop offset="100%" stop-color="#000" stop-opacity="${variant.veil[2]}"/>
         </radialGradient>
       </defs>
     </svg>`
  );
}

await mkdir(OUT, { recursive: true });

for (const variant of VARIANTS) {
  for (const [width, height] of SIZES) {
    const file = `${OUT}readplay-field-${variant.name}-${width}x${height}.png`;
    await sharp(render({ width, height, variant })).png().toFile(file);
    console.log("wrote", file.split("/").slice(-1)[0]);
  }
}
