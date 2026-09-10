// データの読み込みと索引。
// レコードは src/content/{collection}/manon/*.json（1 レコード 1 ファイル）。
// import.meta.glob（Vite）で同期読み込みし、Zod で検証してから Map を組む。
// この境界で「非同期取得」を吸収し、下流の導出関数は同期のまま。
import type { ZodType } from 'zod';
import {
  characterSchema,
  comboSchema,
  moveSchema,
  routeSchema,
  situationSchema,
} from './schema';
import type { Character, Combo, Move, Route, Situation, Step } from './schema';

export type { Character } from './schema';
export type * from './schema';

function load<T>(entries: Record<string, unknown>, schema: ZodType<T>, collection: string): T[] {
  const out: T[] = [];
  for (const [path, raw] of Object.entries(entries)) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `    ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      throw new Error(`スキーマ検証エラー [${collection}] ${path}\n${detail}`);
    }
    out.push(parsed.data);
  }
  return out;
}

export const characters = load<Character>(
  import.meta.glob('../content/characters/manon/*.json', { eager: true, import: 'default' }),
  characterSchema,
  'characters',
);
export const situations = load<Situation>(
  import.meta.glob('../content/situations/manon/*.json', { eager: true, import: 'default' }),
  situationSchema,
  'situations',
);
export const routes = load<Route>(
  import.meta.glob('../content/routes/manon/*.json', { eager: true, import: 'default' }),
  routeSchema,
  'routes',
);
export const combos = load<Combo>(
  import.meta.glob('../content/combos/manon/*.json', { eager: true, import: 'default' }),
  comboSchema,
  'combos',
);
export const moves = load<Move>(
  import.meta.glob('../content/moves/manon/*.json', { eager: true, import: 'default' }),
  moveSchema,
  'moves',
);

// ── 索引 ────────────────────────────────────────
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
