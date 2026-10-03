/**
 * Canvas renderer for the aim trainer. Colours come from the site's CSS
 * variables (read at runtime, re-read on theme change), so the arena follows
 * the dark/green and light/red themes without hard-coded values.
 *
 * Static layers (background grid, target sprite) are painted once into
 * offscreen canvases; a frame is one blit plus the live target and effects.
 */
import type { AimEngine } from './engine';

export interface Palette {
  bg: string;
  grid: string;
  gridMajor: string;
  vignette: string;
  ink: string;
  muted: string;
  accent: string;
  glow: string;
  /** Resolved font-family list of the pixel face. */
  font: string;
}

const TAU = Math.PI * 2;
const GRID = 40;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Theme colours: site tokens from <html>, arena-surface tokens from the stage
 * element (they are defined in the component's CSS per theme).
 */
export function readPalette(stage: HTMLElement, fontSource: HTMLElement): Palette {
  const root = getComputedStyle(document.documentElement);
  const local = getComputedStyle(stage);
  const pick = (style: CSSStyleDeclaration, name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    bg: pick(local, '--arena-bg', '#0c0c0e'),
    grid: pick(local, '--arena-grid', 'rgb(255 255 255 / 0.045)'),
    gridMajor: pick(local, '--arena-grid-major', 'rgb(255 255 255 / 0.12)'),
    vignette: pick(local, '--arena-vignette', 'rgb(0 0 0 / 0.4)'),
    ink: pick(root, '--text', '#ededef'),
    muted: pick(root, '--text-muted', '#a1a1aa'),
    accent: pick(root, '--pixel', '') || pick(root, '--accent', '#2ecc71'),
    glow: pick(root, '--accent-glow', 'rgb(46 204 113 / 0.45)'),
    font: getComputedStyle(fontSource).fontFamily || 'monospace',
  };
}

/** A pixel crosshair as a native cursor (no input lag), tinted with the theme accent. */
export function crosshairCursor(palette: Palette): string {
  const arms: Array<[number, number, number, number]> = [
    [15, 5, 2, 7],
    [15, 20, 2, 7],
    [5, 15, 7, 2],
    [20, 15, 7, 2],
    [15, 15, 2, 2],
  ];
  const outline = arms.map(([x, y, w, h]) => `<rect x='${x - 1}' y='${y - 1}' width='${w + 2}' height='${h + 2}'/>`).join('');
  const fill = arms.map(([x, y, w, h]) => `<rect x='${x}' y='${y}' width='${w}' height='${h}'/>`).join('');
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32' shape-rendering='crispEdges'>` +
    `<g fill='${palette.bg}' fill-opacity='0.9'>${outline}</g><g fill='${palette.accent}'>${fill}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, crosshair`;
}

export class ArenaRenderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly bg: HTMLCanvasElement;
  private readonly sprite: HTMLCanvasElement;
  private spriteR = 0;
  private spriteSize = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private palette: Palette;
  private font = '';
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, palette: Palette) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.bg = document.createElement('canvas');
    this.sprite = document.createElement('canvas');
    this.palette = palette;
    this.font = `500 13px ${palette.font}`;
  }

  resize(width: number, height: number, dpr: number): void {
    this.w = width;
    this.h = height;
    this.dpr = dpr;
    const pw = Math.max(1, Math.round(width * dpr));
    const ph = Math.max(1, Math.round(height * dpr));
    this.canvas.width = this.bg.width = pw;
    this.canvas.height = this.bg.height = ph;
    this.spriteR = 0;
    this.paintBackground();
  }

  setPalette(palette: Palette): void {
    this.palette = palette;
    this.font = `500 13px ${palette.font}`;
    this.spriteR = 0;
    this.paintBackground();
  }

  /* ---------------------------------------------------------------- */
  /* Static layers                                                     */
  /* ---------------------------------------------------------------- */

  private paintBackground(): void {
    const c = this.bg.getContext('2d');
    if (!c) return;
    const W = this.bg.width;
    const H = this.bg.height;
    const d = this.dpr;
    const p = this.palette;

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = p.bg;
    c.fillRect(0, 0, W, H);

    // Grid centred on the arena, 1 device px lines.
    const step = GRID * d;
    const cx = W / 2;
    const cy = H / 2;
    const ox = cx - Math.floor(cx / step) * step;
    const oy = cy - Math.floor(cy / step) * step;
    const lw = Math.max(1, Math.round(d));
    c.fillStyle = p.grid;
    for (let x = ox; x < W; x += step) c.fillRect(Math.round(x), 0, lw, H);
    for (let y = oy; y < H; y += step) c.fillRect(0, Math.round(y), W, lw);

    // Registration "+" marks on every 4th intersection.
    c.fillStyle = p.gridMajor;
    const arm = Math.round(4 * d);
    for (let x = ox; x < W; x += step) {
      if (Math.round((x - cx) / step) % 4 !== 0) continue;
      for (let y = oy; y < H; y += step) {
        if (Math.round((y - cy) / step) % 4 !== 0) continue;
        const px = Math.round(x);
        const py = Math.round(y);
        c.fillRect(px - arm, py, arm * 2 + lw, lw);
        c.fillRect(px, py - arm, lw, arm * 2 + lw);
      }
    }

    // Soft vignette toward the edges.
    const g = c.createRadialGradient(cx, cy, Math.min(W, H) * 0.25, cx, cy, Math.hypot(cx, cy));
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, p.vignette);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // Viewport corner brackets.
    c.setTransform(d, 0, 0, d, 0, 0);
    c.strokeStyle = p.muted;
    c.globalAlpha = 0.4;
    c.lineWidth = 1;
    const inset = 8.5;
    const len = 10;
    const w = this.w;
    const h = this.h;
    c.beginPath();
    c.moveTo(inset, inset + len);
    c.lineTo(inset, inset);
    c.lineTo(inset + len, inset);
    c.moveTo(w - inset - len, inset);
    c.lineTo(w - inset, inset);
    c.lineTo(w - inset, inset + len);
    c.moveTo(inset, h - inset - len);
    c.lineTo(inset, h - inset);
    c.lineTo(inset + len, h - inset);
    c.moveTo(w - inset - len, h - inset);
    c.lineTo(w - inset, h - inset);
    c.lineTo(w - inset, h - inset - len);
    c.stroke();
    c.globalAlpha = 1;
  }

  /** Target = soft glow + outer ring + inner ring + centre pixel + reticle ticks. */
  private ensureSprite(r: number): void {
    if (r === this.spriteR) return;
    const c = this.sprite.getContext('2d');
    if (!c) return;
    const p = this.palette;
    const d = this.dpr;
    const size = Math.ceil((r + r * 0.9 + 12) * 2);
    this.sprite.width = this.sprite.height = Math.ceil(size * d);
    this.spriteR = r;
    this.spriteSize = size;

    const m = size / 2;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, size, size);

    // Glow: an accent disc's shadow (shadowBlur is in device px).
    c.save();
    c.shadowColor = p.glow;
    c.shadowBlur = (r * 0.9 + 8) * d;
    c.fillStyle = p.accent;
    c.beginPath();
    c.arc(m, m, r - 1, 0, TAU);
    c.fill();
    c.restore();

    // Disc: arena colour with a faint accent tint, so the grid doesn't show through.
    c.beginPath();
    c.arc(m, m, r - 0.5, 0, TAU);
    c.fillStyle = p.bg;
    c.fill();
    c.globalAlpha = 0.14;
    c.fillStyle = p.accent;
    c.fill();
    c.globalAlpha = 1;

    c.strokeStyle = p.accent;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(m, m, r - 1, 0, TAU);
    c.stroke();

    c.lineWidth = r < 20 ? 1.5 : 2;
    c.beginPath();
    c.arc(m, m, r * 0.56, 0, TAU);
    c.stroke();

    c.fillStyle = p.accent;
    const s = Math.max(3, Math.round(r * 0.24));
    c.fillRect(m - s / 2, m - s / 2, s, s);

    c.globalAlpha = 0.75;
    const tick = Math.max(3, Math.round(r * 0.18));
    const off = r + 3;
    c.fillRect(m - 1, m - off - tick, 2, tick);
    c.fillRect(m - 1, m + off, 2, tick);
    c.fillRect(m - off - tick, m - 1, tick, 2);
    c.fillRect(m + off, m - 1, tick, 2);
    c.globalAlpha = 1;
  }

  /* ---------------------------------------------------------------- */
  /* Frame                                                             */
  /* ---------------------------------------------------------------- */

  private drawTarget(x: number, y: number, scale: number, alpha: number): void {
    const ctx = this.ctx;
    if (!ctx || alpha <= 0 || scale <= 0) return;
    const s = this.spriteSize * scale;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(this.sprite, x - s / 2, y - s / 2, s, s);
  }

  draw(engine: AimEngine): void {
    const ctx = this.ctx;
    if (!ctx || this.w <= 0) return;
    const p = this.palette;
    const reduced = engine.reducedMotion;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const t = engine.target;
    if (t.live) this.ensureSprite(t.r);
    else this.ensureSprite(engine.radius);

    // Targets on their way out: hit → shrink + shock ring; expired → fade.
    for (const g of engine.ghosts) {
      if (!g.live) continue;
      if (g.r !== this.spriteR) this.ensureSprite(g.r);
      const k = g.age / g.life;
      if (g.expired) {
        this.drawTarget(g.x, g.y, 1 - k * 0.2, (1 - k) * 0.5);
      } else {
        const e = easeOutQuart(k);
        this.drawTarget(g.x, g.y, 1 - e * 0.8, 1 - k);
        ctx.globalAlpha = (1 - k) * 0.55;
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r * (1 + e * 0.75), 0, TAU);
        ctx.stroke();
      }
    }

    // Live target with pop-in.
    if (t.live) {
      this.ensureSprite(t.r);
      const k = Math.min(1, t.age / 180);
      this.drawTarget(t.x, t.y, 0.5 + 0.5 * easeOutExpo(k), Math.min(1, k * 1.8));

      const life = engine.mode.lifetimeMs;
      if (life !== null) {
        const left = Math.max(0, 1 - (engine.elapsed - t.bornAt) / life);
        const rr = t.r + 11;
        ctx.lineWidth = 2;
        ctx.strokeStyle = p.accent;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(t.x, t.y, rr, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(t.x, t.y, rr, -Math.PI / 2, -Math.PI / 2 + TAU * left);
        ctx.stroke();
      }
    }

    // Miss markers: a small fading ×.
    ctx.strokeStyle = p.muted;
    ctx.lineWidth = 1.5;
    for (const m of engine.markers) {
      if (!m.live) continue;
      ctx.globalAlpha = 0.85 * (1 - m.age / m.life);
      ctx.beginPath();
      ctx.moveTo(m.x - 4, m.y - 4);
      ctx.lineTo(m.x + 4, m.y + 4);
      ctx.moveTo(m.x + 4, m.y - 4);
      ctx.lineTo(m.x - 4, m.y + 4);
      ctx.stroke();
    }

    // Square pixel particles, snapped to whole px.
    for (const q of engine.particles) {
      if (!q.live) continue;
      const k = q.age / q.life;
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = q.ink ? p.ink : p.accent;
      ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
    }

    // Floating "+1 · 212ms".
    ctx.font = this.font;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    for (const f of engine.floaters) {
      if (!f.live) continue;
      if (f.leadW < 0) {
        f.leadW = ctx.measureText(f.lead).width;
        f.tailW = ctx.measureText(f.tail).width;
      }
      const k = f.age / f.life;
      const rise = reduced ? 0 : easeOutQuart(k) * 20;
      const total = f.leadW + f.tailW;
      const x = Math.min(this.w - total - 10, Math.max(10, f.x - total / 2));
      const y = Math.max(16, f.y - rise);
      ctx.globalAlpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
      ctx.fillStyle = p.accent;
      ctx.fillText(f.lead, x, y);
      ctx.fillStyle = p.muted;
      ctx.fillText(f.tail, x + f.leadW, y);
    }

    ctx.globalAlpha = 1;
  }
}
