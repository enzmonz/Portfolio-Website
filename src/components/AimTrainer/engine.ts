/**
 * Aim trainer game logic: phases, clocks, spawning, hit-testing, stats and the
 * short-lived visual effects. No DOM access; the controller feeds it frame
 * deltas and pointer positions (CSS px), and the renderer reads its state.
 */
import type { ModeConfig, ModeId } from './modes';

export type Phase = 'idle' | 'countdown' | 'playing' | 'paused' | 'ended';

export interface SessionResult {
  mode: ModeId;
  /** Score = targets hit. */
  score: number;
  hits: number;
  misses: number;
  /** 0–1, or null when nothing was clicked and nothing expired. */
  accuracy: number | null;
  /** Mean spawn→hit time in ms, or null with no hits. */
  avgReaction: number | null;
  bestReaction: number | null;
}

/** Space kept clear for the HUD (CSS px). Targets never spawn under it. */
export const HUD_INSET = { top: 78, bottom: 54, side: 26 } as const;

/** Extra room around a target for its glow, so it never touches the HUD. */
const GLOW_PAD = 10;
/** Clicking within this many px outside the outer ring still counts. */
const HIT_SLOP = 1.5;

export interface Target {
  x: number;
  y: number;
  r: number;
  live: boolean;
  /** Game time (ms of active play) when it appeared: the reaction-time origin. */
  bornAt: number;
  /** Effect-clock age in ms, drives the pop-in. */
  age: number;
}

export interface Particle {
  live: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  life: number;
  /** Draw in the ink colour instead of the accent. */
  ink: boolean;
}

export interface Floater {
  live: boolean;
  x: number;
  y: number;
  /** "+1" */
  lead: string;
  /** " · 212ms" */
  tail: string;
  /** Measured text widths, filled in lazily by the renderer (-1 = not measured). */
  leadW: number;
  tailW: number;
  age: number;
  life: number;
}

export interface Marker {
  live: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
}

export interface Ghost {
  live: boolean;
  x: number;
  y: number;
  r: number;
  age: number;
  life: number;
  expired: boolean;
}

function pool<T>(size: number, make: () => T): T[] {
  return Array.from({ length: size }, make);
}

function anyLive(items: readonly { live: boolean }[]): boolean {
  for (const item of items) if (item.live) return true;
  return false;
}

function claim<T extends { live: boolean; age: number }>(items: T[]): T {
  // Reuse a free slot, else recycle the oldest one.
  let oldest = items[0];
  for (const item of items) {
    if (!item.live) return item;
    if (item.age > oldest.age) oldest = item;
  }
  return oldest;
}

export class AimEngine {
  phase: Phase = 'idle';
  mode: ModeConfig;
  reducedMotion: boolean;

  width = 0;
  height = 0;
  /** Target size multiplier from the arena size. */
  scale = 1;

  /** Milliseconds of active play this session (frozen while paused). */
  elapsed = 0;
  countdownTotal = 0;
  countdownLeft = 0;

  hits = 0;
  misses = 0;
  reactionSum = 0;
  bestReaction: number | null = null;

  readonly target: Target = { x: 0, y: 0, r: 0, live: false, bornAt: 0, age: 0 };
  readonly particles: Particle[] = pool(120, () => ({
    live: false, x: 0, y: 0, vx: 0, vy: 0, size: 3, age: 0, life: 1, ink: false,
  }));
  readonly floaters: Floater[] = pool(6, () => ({
    live: false, x: 0, y: 0, lead: '', tail: '', leadW: -1, tailW: -1, age: 0, life: 1,
  }));
  readonly markers: Marker[] = pool(14, () => ({ live: false, x: 0, y: 0, age: 0, life: 1 }));
  readonly ghosts: Ghost[] = pool(4, () => ({ live: false, x: 0, y: 0, r: 0, age: 0, life: 1, expired: false }));

  private resumeTo: 'countdown' | 'playing' = 'playing';
  private lastX = Number.NaN;
  private lastY = Number.NaN;
  private readonly random: () => number;

  constructor(mode: ModeConfig, reducedMotion: boolean, random: () => number = Math.random) {
    this.mode = mode;
    this.reducedMotion = reducedMotion;
    this.random = random;
  }

  /* ---------------------------------------------------------------- */
  /* Derived values                                                    */
  /* ---------------------------------------------------------------- */

  get radius(): number {
    return Math.round(this.mode.targetRadius * this.scale * 10) / 10;
  }

  get timeLeft(): number {
    return Math.max(0, this.mode.durationMs - this.elapsed);
  }

  get accuracy(): number | null {
    const shots = this.hits + this.misses;
    return shots ? this.hits / shots : null;
  }

  get avgReaction(): number | null {
    return this.hits ? this.reactionSum / this.hits : null;
  }

  /** True while a session exists (anything but idle). */
  get active(): boolean {
    return this.phase !== 'idle';
  }

  result(): SessionResult {
    return {
      mode: this.mode.id,
      score: this.hits,
      hits: this.hits,
      misses: this.misses,
      accuracy: this.accuracy,
      avgReaction: this.avgReaction,
      bestReaction: this.bestReaction,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Arena                                                             */
  /* ---------------------------------------------------------------- */

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const ref = Math.min(width, height * 1.6);
    this.scale = Math.min(1.12, Math.max(0.8, ref / 1000));
    const t = this.target;
    if (t.live) {
      t.r = this.radius;
      const b = this.bounds(t.r);
      t.x = Math.min(b.maxX, Math.max(b.minX, t.x));
      t.y = Math.min(b.maxY, Math.max(b.minY, t.y));
    }
  }

  private bounds(r: number) {
    const pad = r + GLOW_PAD;
    let minX = HUD_INSET.side + pad;
    let maxX = this.width - HUD_INSET.side - pad;
    let minY = HUD_INSET.top + pad;
    let maxY = this.height - HUD_INSET.bottom - pad;
    if (maxX < minX) minX = maxX = this.width / 2;
    if (maxY < minY) minY = maxY = this.height / 2;
    return { minX, maxX, minY, maxY };
  }

  /* ---------------------------------------------------------------- */
  /* Session control                                                   */
  /* ---------------------------------------------------------------- */

  /** Reset stats and begin a session, optionally after a countdown. */
  start(mode: ModeConfig, countdownMs: number): void {
    this.mode = mode;
    this.elapsed = 0;
    this.hits = 0;
    this.misses = 0;
    this.reactionSum = 0;
    this.bestReaction = null;
    this.target.live = false;
    this.lastX = this.lastY = Number.NaN;
    this.clearEffects();
    this.countdownTotal = this.countdownLeft = Math.max(0, countdownMs);
    if (this.countdownLeft > 0) this.phase = 'countdown';
    else this.go();
  }

  pause(): boolean {
    if (this.phase !== 'playing' && this.phase !== 'countdown') return false;
    this.resumeTo = this.phase;
    this.phase = 'paused';
    return true;
  }

  resume(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = this.resumeTo;
    return true;
  }

  /** Back to the idle (intro) state. */
  exit(): void {
    this.phase = 'idle';
    this.elapsed = 0;
    this.countdownLeft = 0;
    this.target.live = false;
    this.clearEffects();
  }

  private go(): void {
    this.phase = 'playing';
    this.countdownLeft = 0;
    this.spawn();
  }

  private end(): void {
    this.elapsed = this.mode.durationMs;
    this.phase = 'ended';
    if (this.target.live) {
      this.addGhost(this.target.x, this.target.y, this.target.r, true);
      this.target.live = false;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Frame update                                                      */
  /* ---------------------------------------------------------------- */

  /**
   * Advance by `dt` ms of real time. Returns 'go' when the countdown finishes
   * and 'ended' when the session time runs out.
   */
  update(dt: number): 'go' | 'ended' | null {
    if (this.phase === 'paused' || this.phase === 'idle') return null;
    // Effects use a capped step so a long frame never teleports particles.
    this.stepEffects(Math.min(dt, 64));

    if (this.phase === 'countdown') {
      this.countdownLeft -= dt;
      if (this.countdownLeft <= 0) {
        this.go();
        return 'go';
      }
      return null;
    }

    if (this.phase !== 'playing') return null;

    // Session clock uses real elapsed time so it stays exact at any refresh rate.
    this.elapsed += dt;
    if (this.elapsed >= this.mode.durationMs) {
      this.end();
      return 'ended';
    }

    const t = this.target;
    if (t.live) {
      t.age += Math.min(dt, 64);
      const life = this.mode.lifetimeMs;
      if (life !== null && this.elapsed - t.bornAt >= life) {
        this.misses += 1;
        this.addGhost(t.x, t.y, t.r, true);
        this.addMarker(t.x, t.y);
        t.live = false;
        this.spawn();
      }
    }
    return null;
  }

  /** Whether anything still needs animation frames. */
  get animating(): boolean {
    if (this.phase === 'countdown' || this.phase === 'playing') return true;
    if (this.phase === 'paused' || this.phase === 'idle') return false;
    return this.hasEffects();
  }

  /* ---------------------------------------------------------------- */
  /* Input                                                             */
  /* ---------------------------------------------------------------- */

  /**
   * Register a click at (x, y) in CSS px. `late` is how many ms after the last
   * frame the click happened, for a precise reaction time.
   */
  shoot(x: number, y: number, late: number): 'hit' | 'miss' | null {
    if (this.phase !== 'playing') return null;
    const now = this.elapsed + Math.max(0, late);
    if (now >= this.mode.durationMs) return null;

    const t = this.target;
    const life = this.mode.lifetimeMs;
    const alive = t.live && (life === null || now - t.bornAt < life);
    const dx = x - t.x;
    const dy = y - t.y;
    const reach = t.r + HIT_SLOP;

    if (alive && dx * dx + dy * dy <= reach * reach) {
      const reaction = Math.max(0, now - t.bornAt);
      this.hits += 1;
      this.reactionSum += reaction;
      if (this.bestReaction === null || reaction < this.bestReaction) this.bestReaction = reaction;
      this.addGhost(t.x, t.y, t.r, false);
      this.burst(t.x, t.y, t.r);
      this.addFloater(t.x, t.y - t.r - 10, Math.round(reaction));
      t.live = false;
      this.spawn(now);
      return 'hit';
    }

    this.misses += 1;
    this.addMarker(x, y);
    return 'miss';
  }

  /* ---------------------------------------------------------------- */
  /* Spawning                                                          */
  /* ---------------------------------------------------------------- */

  private spawn(at = this.elapsed): void {
    const r = this.radius;
    const b = this.bounds(r);
    const hasLast = !Number.isNaN(this.lastX);
    // Far enough from the previous target that every spawn needs a real flick.
    const minDist = Math.min(300, Math.max(r * 4, Math.min(this.width, this.height) * 0.26));

    let bestX = (b.minX + b.maxX) / 2;
    let bestY = (b.minY + b.maxY) / 2;
    let bestD = -1;
    for (let i = 0; i < 28; i++) {
      const x = b.minX + this.random() * (b.maxX - b.minX);
      const y = b.minY + this.random() * (b.maxY - b.minY);
      const d = hasLast ? Math.hypot(x - this.lastX, y - this.lastY) : Infinity;
      if (d > bestD) {
        bestD = d;
        bestX = x;
        bestY = y;
      }
      if (d >= minDist) break;
    }

    const t = this.target;
    t.x = bestX;
    t.y = bestY;
    t.r = r;
    t.bornAt = at;
    t.age = this.reducedMotion ? 1000 : 0;
    t.live = true;
    this.lastX = bestX;
    this.lastY = bestY;
  }

  /* ---------------------------------------------------------------- */
  /* Effects                                                           */
  /* ---------------------------------------------------------------- */

  private clearEffects(): void {
    for (const p of this.particles) p.live = false;
    for (const f of this.floaters) f.live = false;
    for (const m of this.markers) m.live = false;
    for (const g of this.ghosts) g.live = false;
  }

  hasEffects(): boolean {
    return anyLive(this.particles) || anyLive(this.floaters) || anyLive(this.markers) || anyLive(this.ghosts);
  }

  private stepEffects(dt: number): void {
    const drag = Math.pow(0.9965, dt);
    for (const p of this.particles) {
      if (!p.live) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.live = false;
        continue;
      }
      p.vx *= drag;
      p.vy = p.vy * drag + 0.00042 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const f of this.floaters) if (f.live && (f.age += dt) >= f.life) f.live = false;
    for (const m of this.markers) if (m.live && (m.age += dt) >= m.life) m.live = false;
    for (const g of this.ghosts) if (g.live && (g.age += dt) >= g.life) g.live = false;
  }

  private burst(x: number, y: number, r: number): void {
    if (this.reducedMotion) return;
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p = claim(this.particles);
      const angle = (i / count) * Math.PI * 2 + this.random() * 0.45;
      const speed = 0.11 + this.random() * 0.22;
      p.live = true;
      p.x = x + Math.cos(angle) * r * 0.45;
      p.y = y + Math.sin(angle) * r * 0.45;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.05;
      p.size = this.random() < 0.35 ? 4 : 3;
      p.age = 0;
      p.life = 360 + this.random() * 220;
      p.ink = i % 4 === 0;
    }
  }

  private addFloater(x: number, y: number, reaction: number): void {
    const f = claim(this.floaters);
    f.live = true;
    f.x = x;
    f.y = y;
    f.lead = '+1';
    f.tail = ` · ${reaction}ms`;
    f.leadW = f.tailW = -1;
    f.age = 0;
    f.life = 760;
  }

  private addMarker(x: number, y: number): void {
    const m = claim(this.markers);
    m.live = true;
    m.x = x;
    m.y = y;
    m.age = 0;
    m.life = 650;
  }

  private addGhost(x: number, y: number, r: number, expired: boolean): void {
    if (this.reducedMotion && !expired) return;
    const g = claim(this.ghosts);
    g.live = true;
    g.x = x;
    g.y = y;
    g.r = r;
    g.age = 0;
    g.life = expired ? 240 : 300;
    g.expired = expired;
  }
}
