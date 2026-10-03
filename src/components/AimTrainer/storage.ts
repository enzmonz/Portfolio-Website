/**
 * Personal bests, stored per mode in this browser's localStorage. Every access
 * is guarded: private windows or blocked storage just mean "no PB yet".
 */
import { MODE_ORDER, isModeId, type ModeId } from './modes';
import type { SessionResult } from './engine';

/** Accuracy and reaction records need at least this many hits to count. */
export const MIN_HITS_FOR_RATE_PB = 5;

const KEY_PREFIX = 'aim-trainer:pb:v1:';
const MODE_KEY = 'aim-trainer:mode';

export interface PersonalBest {
  /** Most targets hit in one session. */
  score: number;
  /** Best accuracy (0–1) from a session with enough hits, else null. */
  accuracy: number | null;
  /** Lowest average reaction time (ms) from a session with enough hits, else null. */
  reaction: number | null;
}

export interface RecordOutcome {
  best: PersonalBest;
  score: boolean;
  accuracy: boolean;
  reaction: boolean;
  /** Any of the three improved. */
  any: boolean;
}

function finite(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

export function readPB(mode: ModeId): PersonalBest | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + mode);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const score = finite(data.score, 0, 100_000);
    if (score === null) return null;
    return {
      score: Math.round(score),
      accuracy: finite(data.accuracy, 0, 1),
      reaction: finite(data.reaction, 1, 60_000),
    };
  } catch {
    return null;
  }
}

function writePB(mode: ModeId, best: PersonalBest): void {
  try {
    localStorage.setItem(KEY_PREFIX + mode, JSON.stringify(best));
  } catch {
    /* storage unavailable: the record lives only for this page view */
  }
}

/** Compare a finished session with the stored best and save any improvement. */
export function recordSession(result: SessionResult): RecordOutcome {
  const prev = readPB(result.mode);
  const qualifies = result.hits >= MIN_HITS_FOR_RATE_PB;

  const score = result.score > 0 && (!prev || result.score > prev.score);
  const accuracy =
    qualifies && result.accuracy !== null && (prev?.accuracy == null || result.accuracy > prev.accuracy);
  const reaction =
    qualifies && result.avgReaction !== null && (prev?.reaction == null || result.avgReaction < prev.reaction);

  const best: PersonalBest = {
    score: score ? result.score : (prev?.score ?? 0),
    accuracy: accuracy ? result.accuracy : (prev?.accuracy ?? null),
    reaction: reaction ? Math.round(result.avgReaction ?? 0) : (prev?.reaction ?? null),
  };
  const any = score || accuracy || reaction;
  if (any) writePB(result.mode, best);
  return { best, score, accuracy, reaction, any };
}

export function resetPB(mode: ModeId): void {
  try {
    localStorage.removeItem(KEY_PREFIX + mode);
  } catch {
    /* nothing to reset */
  }
}

/** First mode (in display order) that has a stored best, preferring `prefer`. */
export function firstStoredPB(prefer: ModeId = 'classic'): { mode: ModeId; best: PersonalBest } | null {
  for (const mode of [prefer, ...MODE_ORDER.filter((m) => m !== prefer)]) {
    const best = readPB(mode);
    if (best && best.score > 0) return { mode, best };
  }
  return null;
}

export function readSavedMode(): ModeId | null {
  try {
    const value = localStorage.getItem(MODE_KEY);
    return isModeId(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveMode(mode: ModeId): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* per-viewer convenience only */
  }
}

/* ------------------------------------------------------------------ */
/* Formatting (shared by the game page and the home teaser)            */
/* ------------------------------------------------------------------ */

export const DASH = '—';

export function formatAccuracy(value: number | null): string {
  return value === null ? DASH : `${Math.round(value * 100)}%`;
}

export function formatMs(value: number | null): string {
  return value === null ? DASH : `${Math.round(value)}ms`;
}

export function formatPBParts(best: PersonalBest | null): { score: string; accuracy: string; reaction: string } {
  return {
    score: best && best.score > 0 ? String(best.score) : DASH,
    accuracy: formatAccuracy(best?.accuracy ?? null),
    reaction: formatMs(best?.reaction ?? null),
  };
}
