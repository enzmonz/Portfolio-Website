/**
 * Wires the aim trainer markup (AimTrainer.astro) to the engine and renderer:
 * mode selection, personal bests, the rAF loop, HUD, overlays, keyboard
 * shortcuts and lifecycle (pause on blur/hidden tab, cleanup on pagehide).
 */
import { AimEngine, type Phase, type SessionResult } from './engine';
import { ArenaRenderer, crosshairCursor, readPalette } from './render';
import { DEFAULT_MODE, MODES, isModeId, modeTag, type ModeId } from './modes';
import {
  MIN_HITS_FOR_RATE_PB,
  formatAccuracy,
  formatMs,
  formatPBParts,
  readPB,
  readSavedMode,
  recordSession,
  resetPB,
  saveMode,
  type RecordOutcome,
} from './storage';

/** Same condition as the CSS that swaps the arena for the desktop notice. */
export const UNSUPPORTED_QUERY = '(pointer: coarse), (max-width: 767.98px)';

const COUNTDOWN_STEP = 650;
const COUNTDOWN_STEPS = 3;
const REDUCED_COUNTDOWN = 700;

const STATUS: Record<Phase, { text: string; tone: string }> = {
  idle: { text: 'Ready', tone: 'neutral' },
  countdown: { text: 'Get ready', tone: 'info' },
  playing: { text: 'Live', tone: 'accent' },
  paused: { text: 'Paused', tone: 'warn' },
  ended: { text: 'Complete', tone: 'neutral' },
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function must<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Aim trainer: missing ${selector}`);
  return el;
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && !['radio', 'checkbox', 'button', 'submit', 'reset', 'range'].includes(target.type);
}

/** Mounts the game into `root` and returns a cleanup function (idempotent). */
export function mountAimTrainer(root: HTMLElement): () => void {
  const intro = must<HTMLElement>(root, '[data-aim-intro]');
  const arena = must<HTMLElement>(root, '[data-aim-arena]');
  const stage = must<HTMLElement>(root, '[data-aim-stage]');
  const canvas = must<HTMLCanvasElement>(root, '[data-aim-canvas]');
  const live = must<HTMLElement>(root, '[data-aim-live]');
  const fieldset = must<HTMLFieldSetElement>(root, '[data-aim-modes]');
  const modeInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="aim-mode"]'));
  const modeDesc = must<HTMLElement>(root, '[data-aim-mode-desc]');
  const modeTags = Array.from(root.querySelectorAll<HTMLElement>('[data-aim-mode-tag]'));
  const status = must<HTMLElement>(root, '[data-aim-status]');
  const startButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-aim-start]'));
  const introStart = must<HTMLButtonElement>(intro, '[data-aim-start]');
  const pauseButton = must<HTMLButtonElement>(root, '[data-aim-pause]');
  const pauseLabel = must<HTMLElement>(pauseButton, '[data-label]');
  const resumeButton = must<HTMLButtonElement>(root, '[data-aim-resume]');
  const againButton = must<HTMLButtonElement>(root, '[data-aim-again]');
  const restartButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-aim-restart]'));
  const exitButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-aim-exit]'));
  const countEl = must<HTMLElement>(root, '[data-aim-count]');

  const pbSlots = {
    score: must<HTMLElement>(root, '[data-pb="score"]'),
    accuracy: must<HTMLElement>(root, '[data-pb="accuracy"]'),
    reaction: must<HTMLElement>(root, '[data-pb="reaction"]'),
  };
  const pbReset = must<HTMLButtonElement>(root, '[data-aim-pb-reset]');
  const pbResetLabel = must<HTMLElement>(pbReset, '[data-label]');

  const hud = {
    score: must<HTMLElement>(root, '[data-hud="score"]'),
    time: must<HTMLElement>(root, '[data-hud="time"]'),
    accuracy: must<HTMLElement>(root, '[data-hud="accuracy"]'),
    hits: must<HTMLElement>(root, '[data-hud="hits"]'),
    misses: must<HTMLElement>(root, '[data-hud="misses"]'),
    avg: must<HTMLElement>(root, '[data-hud="avg"]'),
    progress: must<HTMLElement>(root, '[data-hud="progress"]'),
  };

  const end = {
    score: must<HTMLElement>(root, '[data-end="score"]'),
    accuracy: must<HTMLElement>(root, '[data-end="accuracy"]'),
    avg: must<HTMLElement>(root, '[data-end="avg"]'),
    best: must<HTMLElement>(root, '[data-end="best"]'),
    hitsMisses: must<HTMLElement>(root, '[data-end="hits-misses"]'),
    badge: must<HTMLElement>(root, '[data-end-badge]'),
    note: must<HTMLElement>(root, '[data-end-note]'),
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const unsupported = window.matchMedia(UNSUPPORTED_QUERY);
  const ac = new AbortController();
  const { signal } = ac;

  let mode: ModeId = readSavedMode() ?? DEFAULT_MODE;
  let palette = readPalette(stage, hud.score);
  const engine = new AimEngine(MODES[mode], reduceMotion.matches);
  const renderer = new ArenaRenderer(canvas, palette);

  let raf = 0;
  let lastNow = 0;
  let keysOn = false;
  let destroyed = false;
  let resetTimer = 0;
  let announceTimer = 0;
  let lastCount = '';
  let size = { w: 0, h: 0 };

  /* ---------------------------------------------------------------- */
  /* Small helpers                                                     */
  /* ---------------------------------------------------------------- */

  const announce = (message: string) => {
    window.clearTimeout(announceTimer);
    live.textContent = '';
    announceTimer = window.setTimeout(() => {
      live.textContent = message;
    }, 60);
  };

  const scrollBehavior = (): ScrollBehavior => (reduceMotion.matches ? 'auto' : 'smooth');

  /** Move focus to `fallback` if the focused element is inside something now hidden. */
  const rescueFocus = (fallback: HTMLElement) => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active)) return;
    if (active.closest('[data-aim-overlay]') || active.closest('[disabled]') || (active as HTMLButtonElement).disabled) {
      fallback.focus({ preventScroll: true });
    }
  };

  /* ---------------------------------------------------------------- */
  /* Mode + personal best                                              */
  /* ---------------------------------------------------------------- */

  const renderPB = () => {
    const best = readPB(mode);
    const parts = formatPBParts(best);
    pbSlots.score.textContent = parts.score;
    pbSlots.accuracy.textContent = parts.accuracy;
    pbSlots.reaction.textContent = parts.reaction;
    pbReset.hidden = !best;
    pbReset.setAttribute('aria-label', `Reset ${MODES[mode].label} personal best`);
    root.dataset.hasPb = best ? 'true' : 'false';
  };

  const disarmReset = () => {
    window.clearTimeout(resetTimer);
    resetTimer = 0;
    delete pbReset.dataset.armed;
    pbResetLabel.textContent = 'Reset';
  };

  const applyMode = (id: ModeId) => {
    mode = id;
    const cfg = MODES[id];
    for (const input of modeInputs) input.checked = input.value === id;
    for (const tag of modeTags) tag.textContent = modeTag(cfg);
    modeDesc.textContent = cfg.description;
    disarmReset();
    renderPB();
    if (engine.phase === 'ended') toIdle();
    if (engine.phase === 'idle') {
      engine.mode = cfg;
      updateHud(true);
      setCanvasLabel();
    }
  };

  /* ---------------------------------------------------------------- */
  /* HUD                                                               */
  /* ---------------------------------------------------------------- */

  const cache = { hits: -1, misses: -1, tenths: -1, acc: -2, avg: -2, prog: -1, low: false };

  function updateHud(force = false) {
    const e = engine;
    if (force || e.hits !== cache.hits) {
      cache.hits = e.hits;
      hud.score.textContent = String(e.hits).padStart(3, '0');
      hud.hits.textContent = String(e.hits);
    }
    if (force || e.misses !== cache.misses) {
      cache.misses = e.misses;
      hud.misses.textContent = String(e.misses);
    }
    const tenths = Math.ceil(e.timeLeft / 100);
    if (force || tenths !== cache.tenths) {
      cache.tenths = tenths;
      hud.time.textContent = (tenths / 10).toFixed(1);
    }
    const acc = e.accuracy === null ? -1 : Math.round(e.accuracy * 100);
    if (force || acc !== cache.acc) {
      cache.acc = acc;
      hud.accuracy.textContent = acc < 0 ? '--%' : `${acc}%`;
    }
    const avg = e.avgReaction === null ? -1 : Math.round(e.avgReaction);
    if (force || avg !== cache.avg) {
      cache.avg = avg;
      hud.avg.textContent = avg < 0 ? '—' : `${avg}ms`;
    }
    const prog = Math.round((e.timeLeft / e.mode.durationMs) * 500);
    if (force || prog !== cache.prog) {
      cache.prog = prog;
      hud.progress.style.transform = `scaleX(${prog / 500})`;
    }
    const low = e.phase === 'playing' && e.timeLeft <= 5000;
    if (force || low !== cache.low) {
      cache.low = low;
      stage.toggleAttribute('data-low', low);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Phase → UI                                                        */
  /* ---------------------------------------------------------------- */

  function setCanvasLabel(result?: SessionResult) {
    const label = MODES[mode].label;
    const text: Record<Phase, string> = {
      idle: `Aim trainer arena, ${label} mode. Press Start to begin.`,
      countdown: `Aim trainer arena, ${label} mode. Session starting.`,
      playing: `Aim trainer arena, ${label} mode. Session in progress: click each target as it appears.`,
      paused: `Aim trainer arena, ${label} mode. Paused.`,
      ended: result
        ? `Aim trainer arena. Session complete: score ${result.score}, accuracy ${formatAccuracy(result.accuracy)}.`
        : 'Aim trainer arena. Session complete.',
    };
    canvas.setAttribute('aria-label', text[engine.phase]);
  }

  function setPhase(result?: SessionResult) {
    const phase = engine.phase;
    stage.dataset.phase = phase;
    root.dataset.phase = phase;
    const running = phase === 'countdown' || phase === 'playing' || phase === 'paused';
    fieldset.disabled = running;
    for (const b of startButtons) b.disabled = running;
    pauseButton.disabled = !running;
    pauseLabel.textContent = phase === 'paused' ? 'Resume' : 'Pause';
    pauseButton.dataset.state = phase === 'paused' ? 'resume' : 'pause';
    for (const b of restartButtons) b.disabled = phase === 'idle';
    for (const b of exitButtons) b.disabled = phase === 'idle';
    status.textContent = STATUS[phase].text;
    status.dataset.tone = STATUS[phase].tone;
    setCanvasLabel(result);
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                              */
  /* ---------------------------------------------------------------- */

  function frame(now: number) {
    raf = 0;
    const dt = Math.max(0, now - lastNow);
    lastNow = now;
    const event = engine.update(dt);
    if (event === 'go') onGo();
    else if (event === 'ended') onEnded();
    if (engine.phase === 'countdown') updateCountdown();
    renderer.draw(engine);
    updateHud();
    if (engine.animating && !destroyed) raf = requestAnimationFrame(frame);
  }

  function runLoop() {
    if (raf || destroyed) return;
    lastNow = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function redraw() {
    if (!raf) renderer.draw(engine);
  }

  /* ---------------------------------------------------------------- */
  /* Countdown                                                         */
  /* ---------------------------------------------------------------- */

  function updateCountdown() {
    const text = engine.reducedMotion
      ? 'Ready'
      : String(Math.max(1, Math.ceil(engine.countdownLeft / COUNTDOWN_STEP)));
    if (text === lastCount) return;
    lastCount = text;
    countEl.textContent = text;
    countEl.dataset.word = engine.reducedMotion ? 'true' : 'false';
    if (!engine.reducedMotion && typeof countEl.animate === 'function') {
      countEl.animate(
        [
          { transform: 'scale(1.35)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'scale(0.96)', opacity: 0.85 },
        ],
        { duration: COUNTDOWN_STEP, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    }
  }

  /* ---------------------------------------------------------------- */
  /* Session control                                                   */
  /* ---------------------------------------------------------------- */

  function bringArenaIntoView() {
    const rect = arena.getBoundingClientRect();
    const top = 84;
    if (rect.top >= top && rect.bottom <= window.innerHeight - 8) return;
    const slack = Math.max(top, (window.innerHeight - rect.height) / 2);
    window.scrollTo({ top: window.scrollY + rect.top - slack, behavior: scrollBehavior() });
  }

  function attachKeys() {
    if (keysOn) return;
    keysOn = true;
    document.addEventListener('keydown', onKey);
  }

  function detachKeys() {
    if (!keysOn) return;
    keysOn = false;
    document.removeEventListener('keydown', onKey);
  }

  function start() {
    if (destroyed || unsupported.matches) return;
    disarmReset();
    stopLoop();
    engine.reducedMotion = reduceMotion.matches;
    lastCount = '';
    engine.start(MODES[mode], engine.reducedMotion ? REDUCED_COUNTDOWN : COUNTDOWN_STEP * COUNTDOWN_STEPS);
    setPhase();
    updateCountdown();
    updateHud(true);
    attachKeys();
    bringArenaIntoView();
    arena.focus({ preventScroll: true });
    announce(`${MODES[mode].label} session starting. Escape pauses, R restarts.`);
    runLoop();
  }

  function onGo() {
    setPhase();
  }

  function onEnded() {
    const result = engine.result();
    const outcome = recordSession(result);
    fillEndScreen(result, outcome);
    setPhase(result);
    renderPB();
    againButton.focus({ preventScroll: true });
    const pb = outcome.any ? ' New personal best.' : '';
    announce(
      `Session complete. Score ${result.score}. Accuracy ${formatAccuracy(result.accuracy)}. ` +
        `Average reaction ${formatMs(result.avgReaction)}. Best reaction ${formatMs(result.bestReaction)}. ` +
        `${plural(result.hits, 'hit')}, ${plural(result.misses, 'miss', 'misses')}.${pb}`,
    );
  }

  function fillEndScreen(result: SessionResult, outcome: RecordOutcome) {
    end.score.textContent = String(result.score);
    end.accuracy.textContent = formatAccuracy(result.accuracy);
    end.avg.textContent = formatMs(result.avgReaction);
    end.best.textContent = formatMs(result.bestReaction);
    end.hitsMisses.textContent = `${result.hits} / ${result.misses}`;
    end.badge.hidden = !outcome.any;
    root.querySelectorAll<HTMLElement>('[data-end-pb]').forEach((el) => {
      const key = el.dataset.endPb as 'score' | 'accuracy' | 'reaction';
      el.hidden = !outcome[key];
    });
    end.note.hidden = result.hits >= MIN_HITS_FOR_RATE_PB;
  }

  function pause(fromKeyboard = false) {
    if (!engine.pause()) return;
    stopLoop();
    renderer.draw(engine);
    setPhase();
    announce('Paused.');
    if (fromKeyboard) resumeButton.focus({ preventScroll: true });
  }

  function resume() {
    if (!engine.resume()) return;
    setPhase();
    rescueFocus(arena);
    announce('Resumed.');
    runLoop();
  }

  function toIdle() {
    stopLoop();
    detachKeys();
    engine.exit();
    engine.mode = MODES[mode];
    setPhase();
    updateHud(true);
    renderer.draw(engine);
  }

  function exit() {
    toIdle();
    intro.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    introStart.focus({ preventScroll: true });
    announce('Session closed.');
  }

  /* ---------------------------------------------------------------- */
  /* Events                                                            */
  /* ---------------------------------------------------------------- */

  function onKey(event: KeyboardEvent) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTextEntry(event.target)) return;
    const phase = engine.phase;
    if (event.key === 'Escape') {
      if (phase === 'countdown' || phase === 'playing') {
        event.preventDefault();
        pause(true);
      } else if (phase === 'paused') {
        event.preventDefault();
        resume();
      }
    } else if ((event.key === 'r' || event.key === 'R') && !event.repeat && phase !== 'idle') {
      event.preventDefault();
      start();
    }
  }

  for (const input of modeInputs) {
    input.addEventListener(
      'change',
      () => {
        if (input.checked && isModeId(input.value)) {
          saveMode(input.value);
          applyMode(input.value);
        }
      },
      { signal },
    );
  }

  for (const b of startButtons) b.addEventListener('click', start, { signal });
  againButton.addEventListener('click', start, { signal });
  for (const b of restartButtons) b.addEventListener('click', start, { signal });
  for (const b of exitButtons) b.addEventListener('click', exit, { signal });
  resumeButton.addEventListener('click', resume, { signal });
  pauseButton.addEventListener(
    'click',
    () => {
      if (engine.phase === 'paused') resume();
      else pause(false);
    },
    { signal },
  );

  pbReset.addEventListener(
    'click',
    () => {
      const label = MODES[mode].label;
      if (!pbReset.dataset.armed) {
        pbReset.dataset.armed = '';
        pbResetLabel.textContent = 'Confirm reset';
        announce(`Press again to reset the ${label} personal best.`);
        resetTimer = window.setTimeout(disarmReset, 4000);
        return;
      }
      disarmReset();
      resetPB(mode);
      renderPB();
      const checked = modeInputs.find((i) => i.checked);
      checked?.focus();
      announce(`${label} personal best cleared.`);
    },
    { signal },
  );

  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || engine.phase !== 'playing') return;
      event.preventDefault();
      engine.shoot(event.offsetX, event.offsetY, performance.now() - lastNow);
    },
    { signal },
  );
  canvas.addEventListener('contextmenu', (event) => engine.active && event.preventDefault(), { signal });

  document.addEventListener('visibilitychange', () => document.hidden && pause(false), { signal });
  window.addEventListener('blur', () => pause(false), { signal });
  unsupported.addEventListener('change', () => unsupported.matches && pause(false), { signal });

  /* Size: CSS px from the observer, backing store scaled by devicePixelRatio. */
  const applySize = () => {
    if (size.w < 1 || size.h < 1) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    renderer.resize(size.w, size.h, dpr);
    engine.setSize(size.w, size.h);
    redraw();
  };
  const ro = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1]?.contentRect;
    if (!box) return;
    size = { w: box.width, h: box.height };
    applySize();
  });
  ro.observe(canvas);

  let dprQuery: MediaQueryList | null = null;
  const watchDpr = () => {
    dprQuery?.removeEventListener('change', onDprChange);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener('change', onDprChange, { signal });
  };
  function onDprChange() {
    applySize();
    watchDpr();
  }
  watchDpr();

  /* Theme: re-read colours when <html data-theme> changes. */
  const refreshTheme = () => {
    if (destroyed) return;
    palette = readPalette(stage, hud.score);
    renderer.setPalette(palette);
    canvas.style.cursor = crosshairCursor(palette);
    redraw();
  };
  const mo = new MutationObserver(refreshTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.fonts?.ready.then(refreshTheme).catch(() => {});

  /* Initial state */
  canvas.style.cursor = crosshairCursor(palette);
  applyMode(mode);
  setPhase();
  updateHud(true);
  root.dataset.ready = 'true';

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopLoop();
    detachKeys();
    ac.abort();
    ro.disconnect();
    mo.disconnect();
    window.clearTimeout(resetTimer);
    window.clearTimeout(announceTimer);
    engine.exit();
  };
}
