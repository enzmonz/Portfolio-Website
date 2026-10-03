/**
 * Aim trainer game modes. Every rule that differs between modes lives here,
 * so tuning a mode never means touching the engine.
 */

export type ModeId = 'classic' | 'precision' | 'speed';

export interface ModeConfig {
  id: ModeId;
  label: string;
  /** Session length in milliseconds. */
  durationMs: number;
  /** Target radius in CSS px at the reference arena size (scaled slightly with the arena). */
  targetRadius: number;
  /** How long a target stays up. `null` = until it is hit. Expired targets count as misses. */
  lifetimeMs: number | null;
  /** Compact spec for the mode selector, e.g. "Small targets". */
  spec: string;
  /** One-line rule shown under the selector. */
  description: string;
}

export const MODES: Readonly<Record<ModeId, ModeConfig>> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    durationMs: 30_000,
    targetRadius: 28,
    lifetimeMs: null,
    spec: 'Standard targets',
    description: 'Hit as many targets as you can in 30 seconds.',
  },
  precision: {
    id: 'precision',
    label: 'Precision',
    durationMs: 30_000,
    targetRadius: 15,
    lifetimeMs: null,
    spec: 'Small targets',
    description: 'Smaller targets for 30 seconds. Accuracy matters more than speed.',
  },
  speed: {
    id: 'speed',
    label: 'Speed',
    durationMs: 30_000,
    targetRadius: 26,
    lifetimeMs: 850,
    spec: '0.85s lifetime',
    description: 'Each target disappears after 0.85 seconds. Expired targets count as misses.',
  },
};

export const MODE_ORDER: readonly ModeId[] = ['classic', 'precision', 'speed'];

export const DEFAULT_MODE: ModeId = 'classic';

export function isModeId(value: unknown): value is ModeId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MODES, value);
}

/** "Classic · 30s" */
export function modeTag(mode: ModeConfig): string {
  return `${mode.label} · ${Math.round(mode.durationMs / 1000)}s`;
}
