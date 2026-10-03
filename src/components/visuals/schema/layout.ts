/**
 * Geometry for the entity relationship diagram.
 *
 * Positions are hand-tuned per layout (so connectors never cross and every
 * label has room), while entity heights, connector paths, cardinality marks
 * and label positions are computed from the schema data. If the schema gains
 * an entity or relation that a layout doesn't place, `buildDiagram` returns
 * null and the component falls back to its list rendering.
 */
import type { Project, SchemaEntity } from '@/data/projects';

export type Schema = NonNullable<Project['schema']>;
type Side = 'top' | 'right' | 'bottom' | 'left';

interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Slot {
  x: number;
  y: number;
  /** Which edge of the box `y` refers to. */
  anchor?: 'top' | 'center' | 'bottom';
}

interface Port {
  side: Side;
  /** Offset along the side, from its center. */
  offset?: number;
}

interface Route {
  from: Port;
  to: Port;
  /** Where the label sits relative to the segment that carries it. */
  label: 'above' | 'below' | 'right';
}

interface LayoutDef {
  pad: number;
  slots: Record<string, Slot>;
  /** Keyed by `${from}>${to}` using entity names. */
  routes: Record<string, Route>;
}

/* ------------------------------------------------------------------ */
/* Metrics (viewBox units)                                             */
/* ------------------------------------------------------------------ */

export const M = {
  w: 160,
  head: 30,
  row: 22,
  padTop: 4,
  padBottom: 6,
  radius: 8,
  nameSize: 13,
  keySize: 11.5,
  badgeSize: 7.75,
  labelSize: 10.5,
} as const;

export const entityHeight = (keys: number) => M.head + M.padTop + M.row * Math.max(keys, 1) + M.padBottom;

/** Center line of key row `i` relative to the box top. */
export const rowCenter = (i: number) => M.head + M.padTop + M.row * i + M.row / 2;

/* ------------------------------------------------------------------ */
/* Layouts                                                             */
/* ------------------------------------------------------------------ */

/**
 * `tall`: three columns, four rows. Used by the card variant and by the
 * full variant at medium widths.
 *
 *   Patient            Doctor
 *          Appointment
 *   Billing  Consultation
 *   Laboratory         Prescription
 */
const tall: LayoutDef = {
  pad: 14,
  slots: {
    Patient: { x: 0, y: 0 },
    Doctor: { x: 424, y: 0 },
    Appointment: { x: 212, y: 98 },
    Billing: { x: 0, y: 244 },
    Consultation: { x: 212, y: 244 },
    Laboratory: { x: 0, y: 364 },
    Prescription: { x: 424, y: 364 },
  },
  routes: {
    'Patient>Appointment': { from: { side: 'right' }, to: { side: 'top', offset: -20 }, label: 'above' },
    'Doctor>Appointment': { from: { side: 'left' }, to: { side: 'top', offset: 20 }, label: 'above' },
    'Appointment>Consultation': { from: { side: 'bottom' }, to: { side: 'top' }, label: 'right' },
    'Appointment>Billing': { from: { side: 'left' }, to: { side: 'top' }, label: 'above' },
    'Consultation>Laboratory': { from: { side: 'bottom', offset: -20 }, to: { side: 'right' }, label: 'above' },
    'Consultation>Prescription': { from: { side: 'bottom', offset: 20 }, to: { side: 'left' }, label: 'above' },
  },
};

/**
 * `wide`: four columns, three rows — a left-to-right reading of a visit.
 *
 *   Patient    Billing                   Laboratory
 *         Appointment ── Consultation
 *   Doctor                               Prescription
 */
const wide: LayoutDef = {
  pad: 14,
  slots: {
    Patient: { x: 0, y: 0 },
    Doctor: { x: 0, y: 360, anchor: 'bottom' },
    Billing: { x: 216, y: 0 },
    Appointment: { x: 216, y: 180, anchor: 'center' },
    Consultation: { x: 508, y: 180, anchor: 'center' },
    Laboratory: { x: 724, y: 0 },
    Prescription: { x: 724, y: 360, anchor: 'bottom' },
  },
  routes: {
    'Patient>Appointment': { from: { side: 'bottom' }, to: { side: 'left', offset: -20 }, label: 'above' },
    'Doctor>Appointment': { from: { side: 'top' }, to: { side: 'left', offset: 20 }, label: 'below' },
    'Appointment>Consultation': { from: { side: 'right' }, to: { side: 'left' }, label: 'above' },
    'Appointment>Billing': { from: { side: 'top' }, to: { side: 'bottom' }, label: 'right' },
    'Consultation>Laboratory': { from: { side: 'right', offset: -20 }, to: { side: 'bottom' }, label: 'above' },
    'Consultation>Prescription': { from: { side: 'right', offset: 20 }, to: { side: 'top' }, label: 'below' },
  },
};

export const layouts = { tall, wide } as const;
export type LayoutName = keyof typeof layouts;

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** "1 — N" → ["1", "N"]. */
export function cardinalityEnds(cardinality: string): [string, string] {
  const [a = '', b = ''] = cardinality.split(/\s*[—–-]+\s*/);
  return [a.trim().toUpperCase(), b.trim().toUpperCase()];
}

/** "1 — N" → "1—N". */
export const compactCardinality = (cardinality: string) => cardinalityEnds(cardinality).join('—');

const isMany = (end: string) => ['N', 'M', '*', 'MANY'].includes(end);

/** "1 — N" → "one to many". */
export function cardinalityWords(cardinality: string): string {
  const word = (end: string) => (end === '1' ? 'one' : isMany(end) ? 'many' : end.toLowerCase());
  const [a, b] = cardinalityEnds(cardinality);
  return `${word(a)} to ${word(b)}`;
}

export const keyWords = (kind: 'PK' | 'FK') => (kind === 'PK' ? 'primary key' : 'foreign key');

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

export interface DiagramEntity {
  name: string;
  id: string;
  box: Box;
  keys: SchemaEntity['keys'];
}

export interface DiagramLink {
  from: string;
  to: string;
  fromId: string;
  toId: string;
  /** Connector path, drawn from `from` to `to`. */
  d: string;
  /** Cardinality marks (bars / crow's feet) at both ends. */
  marks: string;
  label: { x: number; y: number; anchor: 'start' | 'middle'; verb: string; card: string };
}

export interface Diagram {
  viewBox: string;
  width: number;
  height: number;
  entities: DiagramEntity[];
  links: DiagramLink[];
}

const NORMAL: Record<Side, Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const isHorizontal = (side: Side) => side === 'left' || side === 'right';
const r1 = (n: number) => Math.round(n * 10) / 10;

function portPoint(box: Box, port: Port): Point {
  const o = port.offset ?? 0;
  switch (port.side) {
    case 'top':
      return { x: box.x + box.w / 2 + o, y: box.y };
    case 'bottom':
      return { x: box.x + box.w / 2 + o, y: box.y + box.h };
    case 'left':
      return { x: box.x, y: box.y + box.h / 2 + o };
    case 'right':
      return { x: box.x + box.w, y: box.y + box.h / 2 + o };
  }
}

/** L-shaped path with one softened corner, or a straight line when aligned. */
function elbow(a: Point, b: Point, horizontalFirst: boolean, radius = 8): string {
  if (a.x === b.x || a.y === b.y) return `M${r1(a.x)} ${r1(a.y)}L${r1(b.x)} ${r1(b.y)}`;
  const corner = horizontalFirst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  const r = Math.min(radius, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2);
  const toward = (p: Point, q: Point, d: number): Point => {
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: p.x + ((q.x - p.x) / len) * d, y: p.y + ((q.y - p.y) / len) * d };
  };
  const c1 = toward(corner, a, r);
  const c2 = toward(corner, b, r);
  return [
    `M${r1(a.x)} ${r1(a.y)}`,
    `L${r1(c1.x)} ${r1(c1.y)}`,
    `Q${r1(corner.x)} ${r1(corner.y)} ${r1(c2.x)} ${r1(c2.y)}`,
    `L${r1(b.x)} ${r1(b.y)}`,
  ].join('');
}

/** Bar for "one", crow's foot for "many", drawn at point `p` on a box edge. */
function mark(p: Point, side: Side, end: string): string {
  const u = NORMAL[side];
  const v = { x: -u.y, y: u.x };
  const at = (along: number, across: number) => `${r1(p.x + u.x * along + v.x * across)} ${r1(p.y + u.y * along + v.y * across)}`;
  if (end === '1') return `M${at(8, -5)}L${at(8, 5)}`;
  if (isMany(end)) return `M${at(11, 0)}L${at(0, -6)}M${at(11, 0)}L${at(0, 6)}`;
  return '';
}

export function buildDiagram(schema: Schema, name: LayoutName): Diagram | null {
  const def = layouts[name];

  const entities: DiagramEntity[] = [];
  for (const entity of schema.entities) {
    const slot = def.slots[entity.name];
    if (!slot) return null;
    const h = entityHeight(entity.keys.length);
    const y = slot.anchor === 'center' ? slot.y - h / 2 : slot.anchor === 'bottom' ? slot.y - h : slot.y;
    entities.push({ name: entity.name, id: slug(entity.name), box: { x: slot.x, y, w: M.w, h }, keys: entity.keys });
  }
  const byName = new Map(entities.map((e) => [e.name, e]));

  const links: DiagramLink[] = [];
  for (const rel of schema.relations) {
    const route = def.routes[`${rel.from}>${rel.to}`];
    const from = byName.get(rel.from);
    const to = byName.get(rel.to);
    if (!route || !from || !to) return null;

    const a = portPoint(from.box, route.from);
    const b = portPoint(to.box, route.to);
    const horizontalFirst = isHorizontal(route.from.side);
    const [endA, endB] = cardinalityEnds(rel.cardinality);

    // The label rides on the horizontal run (or beside a vertical one).
    let label: DiagramLink['label'];
    const text = { verb: rel.label, card: compactCardinality(rel.cardinality) };
    if (route.label === 'right') {
      label = { x: r1(Math.max(a.x, b.x) + 9), y: r1((a.y + b.y) / 2 + 3.6), anchor: 'start', ...text };
    } else {
      const runY = horizontalFirst || a.y === b.y ? a.y : b.y;
      const y = route.label === 'above' ? runY - 7 : runY + 14;
      label = { x: r1((a.x + b.x) / 2), y: r1(y), anchor: 'middle', ...text };
    }

    links.push({
      from: rel.from,
      to: rel.to,
      fromId: from.id,
      toId: to.id,
      d: elbow(a, b, horizontalFirst),
      marks: [mark(a, route.from.side, endA), mark(b, route.to.side, endB)].join(''),
      label,
    });
  }

  const width = Math.max(...entities.map((e) => e.box.x + e.box.w));
  const height = Math.max(...entities.map((e) => e.box.y + e.box.h));
  const pad = def.pad;
  return {
    viewBox: `${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`,
    width: width + pad * 2,
    height: height + pad * 2,
    entities,
    links,
  };
}
