import type { Character } from './characters';
import { characters } from './characters';
import { situations } from './dummy/situations';
import { routes } from './dummy/routes';
import { combos } from './dummy/combos';
import type { Combo, Route, Situation } from './types';

export { characters, situations, routes, combos };
export type { Character };
export type * from './types';

// ── 索引 ────────────────────────────────────────
export const situationById = new Map<string, Situation>(situations.map((s) => [s.id, s]));
export const routeById = new Map<string, Route>(routes.map((r) => [r.id, r]));
export const comboBySlug = new Map<string, Combo>(combos.map((c) => [c.slug, c]));

export function getSituation(id: string): Situation {
  const s = situationById.get(id);
  if (!s) throw new Error(`未知の状況ノード: ${id}`);
  return s;
}

export function getRoute(id: string): Route {
  const r = routeById.get(id);
  if (!r) throw new Error(`未知のパーツ: ${id}`);
  return r;
}

export function getCombo(slug: string): Combo {
  const c = comboBySlug.get(slug);
  if (!c) throw new Error(`未知のコンボ: ${slug}`);
  return c;
}
