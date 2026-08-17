/* ============================================================
   Background field — drifting nodes, links, and passes.

   Reads as positional sport data rather than generic texture: nodes move like
   players holding shape, links appear between near neighbours, and every so
   often a pass travels along one of them.
   ============================================================ */

const AREA_PER_NODE = 21000; // px² — density follows the viewport
const NODE_RANGE = [18, 64];
const LINK_DISTANCE = 0.2; // fraction of the smaller viewport axis
const SPEED = 0.014; // viewport fractions per second
const PASS_INTERVAL = [900, 2200]; // ms between passes
const PASS_DURATION = 620;

const rand = (min, max) => min + Math.random() * (max - min);

export function initField(canvas) {
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let scale = 1; // shorter axis, so movement reads the same on any aspect
  let frame = null;
  let last = 0;
  let nextPassAt = 0;

  const nodes = [];
  const passes = [];

  function addNode() {
    const angle = rand(0, Math.PI * 2);
    nodes.push({
      x: Math.random(),
      y: Math.random(),
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      r: rand(1.1, 2.4),
    });
  }

  function ensureNodes() {
    const target = Math.round(
      Math.max(
        NODE_RANGE[0],
        Math.min(NODE_RANGE[1], (width * height) / AREA_PER_NODE)
      )
    );
    while (nodes.length < target) addNode();
    if (nodes.length > target) nodes.length = target;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    scale = Math.min(width, height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ensureNodes();
  }

  function step(dt) {
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;

      // wrap with a margin so nodes fade in off-screen rather than popping
      if (n.x < -0.05) n.x = 1.05;
      if (n.x > 1.05) n.x = -0.05;
      if (n.y < -0.05) n.y = 1.05;
      if (n.y > 1.05) n.y = -0.05;
    }

    for (let i = passes.length - 1; i >= 0; i--) {
      passes[i].t += dt * 1000;
      if (passes[i].t >= PASS_DURATION) passes.splice(i, 1);
    }
  }

  function spawnPass(now) {
    const from = nodes[Math.floor(Math.random() * nodes.length)];
    const candidates = nodes.filter((n) => n !== from && linked(from, n));
    if (candidates.length) {
      passes.push({
        from,
        to: candidates[Math.floor(Math.random() * candidates.length)],
        t: 0,
      });
    }
    nextPassAt = now + rand(PASS_INTERVAL[0], PASS_INTERVAL[1]);
  }

  function linked(a, b) {
    const dx = (a.x - b.x) * width;
    const dy = (a.y - b.y) * height;
    return Math.hypot(dx, dy) < LINK_DISTANCE * scale;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const maxDist = LINK_DISTANCE * scale;

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ax = nodes[i].x * width;
        const ay = nodes[i].y * height;
        const bx = nodes[j].x * width;
        const by = nodes[j].y * height;
        const dist = Math.hypot(ax - bx, ay - by);
        if (dist >= maxDist) continue;

        ctx.strokeStyle = `rgba(255,255,255,${0.16 * (1 - dist / maxDist)})`;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(n.x * width, n.y * height, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const pass of passes) {
      const p = pass.t / PASS_DURATION;
      // ease-in-out so the ball leaves and arrives the way a pass does
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const x = (pass.from.x + (pass.to.x - pass.from.x) * e) * width;
      const y = (pass.from.y + (pass.to.y - pass.from.y) * e) * height;
      const fade = Math.sin(p * Math.PI);

      ctx.strokeStyle = `rgba(255,255,255,${0.3 * fade})`;
      ctx.beginPath();
      ctx.moveTo(pass.from.x * width, pass.from.y * height);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    step(dt);
    if (now >= nextPassAt) spawnPass(now);
    draw();

    frame = window.requestAnimationFrame(loop);
  }

  function start() {
    if (frame !== null || reduceMotion) return;
    last = window.performance.now();
    nextPassAt = last + rand(PASS_INTERVAL[0], PASS_INTERVAL[1]);
    frame = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (frame === null) return;
    window.cancelAnimationFrame(frame);
    frame = null;
  }

  resize();
  draw();

  window.addEventListener("resize", () => {
    resize();
    if (frame === null) draw();
  });

  // no reason to burn frames on a tab nobody is looking at
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  if (!reduceMotion) start();
}
