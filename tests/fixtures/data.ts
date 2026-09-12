// テスト用フィクスチャ。src/data/index.ts と同じ形の exports を、
// tests/fixtures/**/*.json（旧ダミーデータ）から組む。
// テストでは vi.mock('../src/data', () => import('./fixtures/data')) で差し替える。
import type { ZodType } from 'zod';
import {
  characterSchema,
  comboSchema,
  moveSchema,
  routeSchema,
  situationSchema,
} from '../../src/data/schema';
import type { Character, Combo, Move, Route, Situation, Step } from '../../src/data/schema';

export type { Character } from '../../src/data/schema';
export type * from '../../src/data/schema';

function load<T>(entries: Record<string, unknown>, schema: ZodType<T>, collection: string): T[] {
  const out: T[] = [];
  for (const [path, raw] of Object.entries(entries)) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) throw new Error(`fixture 検証エラー [${collection}] ${path}`);
    out.push(parsed.data);
  }
  return out;
}

// 文字キャラは src/content にあるのでそちらから
export const characters = load<Character>(
  import.meta.glob('../../src/content/characters/manon/*.json', { eager: true, import: 'default' }),
  characterSchema,
  'characters',
);
export const situations = load<Situation>(
  import.meta.glob('./situations/manon/*.json', { eager: true, import: 'default' }),
  situationSchema,
  'situations',
);
export const routes = load<Route>(
  import.meta.glob('./routes/manon/*.json', { eager: true, import: 'default' }),
  routeSchema,
  'routes',
);
export const combos = load<Combo>(
  import.meta.glob('./combos/manon/*.json', { eager: true, import: 'default' }),
  comboSchema,
  'combos',
);
export const moves = load<Move>(
  import.meta.glob('./moves/manon/*.json', { eager: true, import: 'default' }),
  moveSchema,
  'moves',
);

export const characterById = new Map<string, Character>(characters.map((c) => [c.id, c]));
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
// src/data/index.ts の stepModernCommand と同じ優先順位（R01: 2026-09-12 レビュー）。
// fixture 側に別実装を持たせているため、本体を直すだけでは fixture 経由のテストが
// 回帰を検出できない（R12 で指摘）。両方を同時に直す。
export function stepModernCommand(step: Step): string | undefined {
  if (step.commandModern) return step.commandModern;
  if (step.moveKey) {
    const m = moveByKey.get(step.moveKey);
    if (m) {
      if (m.inputModern) return m.inputModern;
      if (m.inputModernPrecise) return m.inputModernPrecise;
    }
  }
  return undefined;
}
