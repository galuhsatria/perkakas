export function makeDemoImage(): HTMLCanvasElement {
  const W = 1440;
  const H = 900;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const sans = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const BG = "#0A0A0A";

  // Helper to set letter spacing if supported
  const tracking = (v: string) => {
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v;
  };

  // ── background: black, soft glow at the top, dot grid that fades away
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 110, 0, W / 2, 110, 580);
  glow.addColorStop(0, "rgba(255,255,255,0.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (let y = 24; y < 660; y += 32) {
    for (let x = 24; x < W; x += 32) {
      const d = Math.hypot(x - W / 2, (y - 170) * 1.4);
      const a = 0.22 * Math.max(0, 1 - d / 650);
      if (a < 0.01) continue;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // ── nav
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 56, 20, 36, 36, 10);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = `800 20px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("P", 74, 45);
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 22px ${sans}`;
  ctx.fillText("Perkakas", 104, 46);

  ctx.font = `500 16px ${sans}`;
  ctx.fillStyle = "#A1A1AA";
  let nx = 548;
  ["Tools", "Pricing", "Docs", "Changelog"].forEach((label) => {
    ctx.fillText(label, nx, 44);
    nx += ctx.measureText(label).width + 38;
  });

  ctx.fillStyle = "#A1A1AA";
  ctx.font = `500 16px ${sans}`;
  ctx.fillText("Sign in", 1176, 44);
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 1260, 18, 124, 40, 20);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = `600 15px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("Get started", 1322, 43);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 75, W, 1);

  // ── hero
  // badge
  rr(ctx, 570, 118, 300, 36, 18);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(592, 136, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D4D4D8";
  ctx.font = `500 14px ${sans}`;
  ctx.textAlign = "left";
  ctx.fillText("24 new tools just landed", 608, 141);

  // headline
  ctx.textAlign = "center";
  tracking("-3px");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 84px ${sans}`;
  ctx.fillText("Every small tool", W / 2, 262);
  const hg = ctx.createLinearGradient(430, 0, 1010, 0);
  hg.addColorStop(0, "#FFFFFF");
  hg.addColorStop(1, "#6B7280");
  ctx.fillStyle = hg;
  ctx.fillText("you'll ever need.", W / 2, 350);
  tracking("0px");

  // sub
  ctx.fillStyle = "#A1A1AA";
  ctx.font = `400 20px ${sans}`;
  ctx.fillText("Pomodoro, QR codes, word counters and 21 more —", W / 2, 404);
  ctx.fillText("small tools that open fast and stay out of your way.", W / 2, 435);

  // buttons
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 528, 468, 210, 52, 26);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = `600 16px ${sans}`;
  ctx.fillText("Start for free  →", 633, 500);
  rr(ctx, 752, 468, 160, 52, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Browse tools", 832, 500);

  // ── feature cards (cut off by the bottom edge)
  const cards = [
    { title: "Pomodoro", desc: "Focus timer with gentle breaks." },
    { title: "QR Code", desc: "Generate and download in one click." },
    { title: "Word Count", desc: "Live counts while you type." },
  ];
  const cw = 380;
  const gap = 24;
  const x0 = (W - (cw * 3 + gap * 2)) / 2;
  const y0 = 590;

  cards.forEach((card, i) => {
    const x = x0 + i * (cw + gap);

    // card body
    rr(ctx, x, y0, cw, 420, 24);
    ctx.fillStyle = "#0F0F10";
    ctx.fill();
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // icon tile
    rr(ctx, x + 28, y0 + 28, 44, 44, 12);
    ctx.fillStyle = "#1A1A1A";
    ctx.fill();
    ctx.strokeStyle = "#2E2E2E";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const ix = x + 50;
    const iy = y0 + 50;
    if (i === 0) {
      ctx.beginPath();
      ctx.arc(ix, iy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ix, iy - 5);
      ctx.lineTo(ix, iy);
      ctx.lineTo(ix + 4, iy + 2);
      ctx.stroke();
    } else if (i === 1) {
      [
        [-9, -9],
        [3, -9],
        [-9, 3],
      ].forEach(([dx, dy]) => ctx.strokeRect(ix + dx, iy + dy, 6, 6));
      ctx.fillRect(ix + 3, iy + 3, 6, 6);
    } else {
      ctx.beginPath();
      ctx.moveTo(ix - 10, iy - 7);
      ctx.lineTo(ix + 10, iy - 7);
      ctx.moveTo(ix - 10, iy);
      ctx.lineTo(ix + 10, iy);
      ctx.moveTo(ix - 10, iy + 7);
      ctx.lineTo(ix + 3, iy + 7);
      ctx.stroke();
    }

    // text
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 24px ${sans}`;
    ctx.fillText(card.title, x + 28, y0 + 112);
    ctx.fillStyle = "#71717A";
    ctx.font = `400 16px ${sans}`;
    ctx.fillText(card.desc, x + 28, y0 + 140);

    // mini UI
    if (i === 0) {
      const cx = x + 92;
      const cy = y0 + 250;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#262626";
      ctx.beginPath();
      ctx.arc(cx, cy, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, cy, 54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.7);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = `700 26px ${mono}`;
      ctx.fillText("17:42", cx, cy + 9);
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 17px ${sans}`;
      ctx.fillText("Focus session", x + 176, y0 + 238);
      ctx.fillStyle = "#71717A";
      ctx.font = `400 15px ${sans}`;
      ctx.fillText("3 of 4 rounds done", x + 176, y0 + 264);
    } else if (i === 1) {
      const m = 10;
      const n = 13;
      const qx = x + 38;
      const qy = y0 + 186;
      ctx.fillStyle = "#FFFFFF";
      rr(ctx, qx - 12, qy - 12, n * m + 24, n * m + 24, 14);
      ctx.fill();
      ctx.fillStyle = BG;
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          const inFinder = (a < 7 && b < 7) || (a >= n - 7 && b < 7) || (a < 7 && b >= n - 7);
          if (inFinder) continue;
          if ((a * 7 + b * 11 + a * b) % 5 < 2) ctx.fillRect(qx + a * m, qy + b * m, m - 1.5, m - 1.5);
        }
      }
      [
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].forEach(([fa, fb]) => {
        const fx = qx + fa * m;
        const fy = qy + fb * m;
        ctx.fillStyle = BG;
        ctx.fillRect(fx, fy, 7 * m, 7 * m);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(fx + m, fy + m, 5 * m, 5 * m);
        ctx.fillStyle = BG;
        ctx.fillRect(fx + 2 * m, fy + 2 * m, 3 * m, 3 * m);
      });
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 17px ${sans}`;
      ctx.fillText("perkakas.app", x + 214, y0 + 236);
      ctx.fillStyle = "#71717A";
      ctx.font = `400 15px ${sans}`;
      ctx.fillText("PNG · SVG", x + 214, y0 + 262);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 56px ${sans}`;
      tracking("-2px");
      ctx.fillText("1,248", x + 28, y0 + 224);
      tracking("0px");
      ctx.fillStyle = "#71717A";
      ctx.font = `400 16px ${sans}`;
      ctx.fillText("words", x + 190, y0 + 224);
      [
        { f: 0.78, col: "#FFFFFF" },
        { f: 0.52, col: "#A1A1AA" },
        { f: 0.3, col: "#52525B" },
      ].forEach((bar, k) => {
        const by = y0 + 252 + k * 22;
        rr(ctx, x + 28, by, 324, 8, 4);
        ctx.fillStyle = "#1F1F1F";
        ctx.fill();
        rr(ctx, x + 28, by, 324 * bar.f, 8, 4);
        ctx.fillStyle = bar.col;
        ctx.fill();
      });
    }
  });

  // fade the cards into the bottom edge
  const fade = ctx.createLinearGradient(0, 740, 0, H);
  fade.addColorStop(0, "rgba(10,10,10,0)");
  fade.addColorStop(1, "rgba(10,10,10,0.92)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 740, W, H - 740);

  return c;
}

// Re-export rr function for use in demo
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}