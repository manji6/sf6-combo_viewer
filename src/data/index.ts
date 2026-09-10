import type { Character } from './characters';
import { characters } from './characters';
import { situations } from './dummy/situations';
import { routes } from './dummy/routes';
import { combos } from './dummy/combos';
import { moves } from './dummy/moves';
import type { Combo, Move, Route, Situation, Step } from './types';

export { characters, situations, routes, combos, moves };
export type { Character };
export type * from './types';

// ── 索引 ────────────────────────────────────────
export const situationById = new Map<string, Situation>(situations.map((s) => [s.id, s]));
export const routeById = new Map<string, Route>(routes.map((r) => [r.id, r]));
export const comboBySlug = new Map<string, Combo>(combos.map((c) => [c.slug, c]));
export const moveByKey = new Map<string, Move>(moves.map((m) => [m.key, m]));

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

export function getMove(key: string): Move {
  const m = moveByKey.get(key);
  if (!m) throw new Error(`未知の技: ${key}`);
  return m;
}

/**
 * step のモダン表記を解決する。
 * 優先度: 明示 commandModern > 技辞典 inputModern > undefined（Sequence 側で deriveModern にフォールバック）
 */
export function stepModernCommand(step: Step): string | undefined {
  if (step.commandModern) return step.commandModern;
  if (step.moveKey) {
    const m = moveByKey.get(step.moveKey);
    if (m && m.inputModern) return m.inputModern;
  }
  return undefined;
}
