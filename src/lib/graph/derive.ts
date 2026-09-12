import {
  combos,
  getCombo,
  getRoute,
  getSituation,
  moves,
  routes,
  situations,
  stepModernCommand,
} from '../../data';
import type { Combo, Move, Route, Situation, Step } from '../../data/types';

/** 状況ノードから出ていくパーツ */
export function outgoingRoutes(situationId: string): Route[] {
  return routes.filter((r) => r.from === situationId);
}

/** 状況ノードへ入ってくるパーツ */
export function incomingRoutes(situationId: string): Route[] {
  return routes.filter((r) => r.to === situationId);
}

/** このパーツを routeChain に含むコンボ */
export function combosUsingRoute(routeId: string): Combo[] {
  return combos.filter((c) => c.routeChain.includes(routeId));
}

/**
 * コンボ本線がモダン操作でも通しで実行できるか（本線の全パーツが `controlType: 'both'`）。
 * 「一部の手にモダン入力がある」とは別概念。一覧バッジ・フィルタ・詳細トグルは全てこれを使う。
 */
export function comboSupportsModern(combo: Combo): boolean {
  if (combo.routeChain.length === 0) return false;
  return combo.routeChain.map(getRoute).every((r) => r.controlType === 'both');
}

/**
 * コンボの始動技（RV-06）。先頭パーツの最初の「技」step から解決する。
 * 先頭が操作 step（前ステップ等）なら次の技を見る。
 */
export function comboStarterMove(combo: Combo): { moveKey?: string; label: string } | null {
  if (combo.routeChain.length === 0) return null;
  const first = getRoute(combo.routeChain[0]);
  const step = first.steps.find((s) => s.moveKey) ?? first.steps.find((s) => !s.action);
  if (!step) return null;
  return { moveKey: step.moveKey, label: step.move };
}

/** この状況ノードを経路上に含むコンボ */
export function combosThroughSituation(situationId: string): Combo[] {
  return combos.filter((c) => {
    if (c.startFrom === situationId || c.endAt === situationId) return true;
    return c.routeChain.some((rid) => {
      const r = getRoute(rid);
      return r.from === situationId || r.to === situationId;
    });
  });
}

export interface FlatStep extends Step {
  routeId: string;
  routeLabel: string;
  /** このパーツの先頭 step か（パーツ境界マーカー用） */
  boundary: boolean;
}

export interface FlatCombo {
  combo: Combo;
  steps: FlatStep[];
  /** 通過する状況ノード id（startFrom → ... → endAt） */
  nodePath: string[];
  totalDamage: number;
  totalDrive: number;
  totalSuper: number;
  maxSaLevel: 1 | 2 | 3 | null;
  /** 本線をモダン操作で通しで実行できるか（= comboSupportsModern）。一覧バッジ／フィルタ用 */
  supportsModern: boolean;
}

/** コンボを 1 本の手順へ平坦化し、合計値を算出する */
export function flattenCombo(comboOrSlug: Combo | string): FlatCombo {
  const combo = typeof comboOrSlug === 'string' ? getCombo(comboOrSlug) : comboOrSlug;
  const chain = combo.routeChain.map(getRoute);

  const steps: FlatStep[] = [];
  const nodePath: string[] = [combo.startFrom];
  let totalDamage = 0;
  let totalDrive = 0;
  let totalSuper = 0;
  let maxSaLevel: 1 | 2 | 3 | null = null;

  for (const r of chain) {
    r.steps.forEach((st, i) => {
      const commandModern = stepModernCommand(st);
      steps.push({ ...st, commandModern, routeId: r.id, routeLabel: r.label, boundary: i === 0 });
    });
    totalDamage += r.damage;
    totalDrive += r.resources.driveCost;
    totalSuper += r.resources.superCost;
    if (r.resources.saLevel && (maxSaLevel === null || r.resources.saLevel > maxSaLevel)) {
      maxSaLevel = r.resources.saLevel;
    }
    nodePath.push(r.to);
  }

  return {
    combo,
    steps,
    nodePath,
    totalDamage: combo.damageOverride ?? totalDamage,
    totalDrive: combo.driveCostOverride ?? totalDrive,
    totalSuper,
    maxSaLevel,
    supportsModern: comboSupportsModern(combo),
  };
}

export interface DataSet {
  situations: Situation[];
  routes: Route[];
  combos: Combo[];
  moves: Move[];
}

/** 引数省略時は本番（現状ダミー）データを使う */
function resolveDataSet(data?: Partial<DataSet>): DataSet {
  return {
    situations: data?.situations ?? situations,
    routes: data?.routes ?? routes,
    combos: data?.combos ?? combos,
    moves: data?.moves ?? moves,
  };
}

function pushDuplicates(ids: string[], kind: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`${kind}: ID 重複「${id}」`);
    seen.add(id);
  }
}

/** routeChain が連続しているか検証（route[i].to === route[i+1].from） */
export function validateComboChain(combo: Combo, routeById?: Map<string, Route>): string[] {
  const errors: string[] = [];
  const lookup = routeById ?? new Map(routes.map((r) => [r.id, r]));
  if (combo.routeChain.length === 0) {
    errors.push(`${combo.slug}: routeChain が空`);
    return errors;
  }
  const chain = combo.routeChain.map((id) => lookup.get(id));
  if (chain.some((r) => !r)) {
    combo.routeChain
      .filter((id) => !lookup.has(id))
      .forEach((id) => errors.push(`${combo.slug}: routeChain のパーツ「${id}」が存在しない`));
    return errors;
  }
  const rs = chain as Route[];
  if (rs[0].from !== combo.startFrom) {
    errors.push(`${combo.slug}: startFrom(${combo.startFrom}) が先頭パーツの from(${rs[0].from}) と不一致`);
  }
  if (rs[rs.length - 1].to !== combo.endAt) {
    errors.push(`${combo.slug}: endAt(${combo.endAt}) が末尾パーツの to と不一致`);
  }
  for (let i = 0; i < rs.length - 1; i++) {
    if (rs[i].to !== rs[i + 1].from) {
      errors.push(
        `${combo.slug}: パーツ ${rs[i].id}.to(${rs[i].to}) と ${rs[i + 1].id}.from(${rs[i + 1].from}) が不連続`,
      );
    }
  }
  return errors;
}

/**
 * データ全体の整合性チェック。壊れたデータを返す（ビルド時の失敗ゲートに使う）。
 * `data` を渡すとその集合を検証する（テスト・下書き検証用）。
 */
export function validateAll(data?: Partial<DataSet>): string[] {
  const ds = resolveDataSet(data);
  const errors: string[] = [];

  // ID 重複（Map 化で上書きされる前に検出）
  pushDuplicates(ds.situations.map((s) => s.id), 'situation', errors);
  pushDuplicates(ds.routes.map((r) => r.id), 'route', errors);
  pushDuplicates(ds.combos.map((c) => c.slug), 'combo', errors);
  pushDuplicates(ds.moves.map((m) => m.key), 'move', errors);

  const sitIds = new Set(ds.situations.map((s) => s.id));
  const sitByIdLocal = new Map(ds.situations.map((s) => [s.id, s]));
  const routeById = new Map(ds.routes.map((r) => [r.id, r]));
  const moveKeys = new Set(ds.moves.map((m) => m.key));
  const moveByKeyLocal = new Map(ds.moves.map((m) => [m.key, m]));

  for (const r of ds.routes) {
    if (!sitIds.has(r.from)) errors.push(`route ${r.id}: from(${r.from}) が存在しない`);
    if (!sitIds.has(r.to)) errors.push(`route ${r.id}: to(${r.to}) が存在しない`);
    if (r.steps.length === 0) errors.push(`route ${r.id}: steps が空`);
    const fromSit = sitByIdLocal.get(r.from);
    if (fromSit && fromSit.character !== r.character) {
      errors.push(`route ${r.id}: from(${r.from}) の character(${fromSit.character}) が route(${r.character}) と不一致`);
    }
    const toSit = sitByIdLocal.get(r.to);
    if (toSit && toSit.character !== r.character) {
      errors.push(`route ${r.id}: to(${r.to}) の character(${toSit.character}) が route(${r.character}) と不一致`);
    }
    for (const st of r.steps) {
      if (st.moveKey && !moveKeys.has(st.moveKey)) {
        errors.push(`route ${r.id}: step の moveKey(${st.moveKey}) が技辞典に存在しない`);
      }
      // RV-02: 'both' 宣言なのに、この手のモダン入力が未確認（辞典 inputModern:null かつ手動指定なし）
      if (r.controlType === 'both' && !st.action && st.moveKey && !st.commandModern) {
        const mv = moveByKeyLocal.get(st.moveKey);
        if (mv && mv.inputModern === null && !mv.inputModernPrecise) {
          errors.push(
            `route ${r.id}: controlType:'both' だが step「${st.move}」のモダン入力が未確認（技辞典 inputModern が null）`,
          );
        }
      }
    }
  }

  for (const c of ds.combos) {
    errors.push(...validateComboChain(c, routeById));
    for (const rid of c.routeChain) {
      const r = routeById.get(rid);
      if (r && r.character !== c.character) {
        errors.push(
          `combo ${c.slug}: パーツ ${rid} の character(${r.character}) が combo(${c.character}) と不一致`,
        );
      }
    }
  }

  // 孤立ノード（接続パーツなし）
  const connected = new Set<string>();
  for (const r of ds.routes) {
    connected.add(r.from);
    connected.add(r.to);
  }
  for (const s of ds.situations) {
    if (!connected.has(s.id)) errors.push(`situation ${s.id}: 孤立ノード（接続パーツなし）`);
  }

  return errors;
}

export { getSituation, getRoute, getCombo };
export type { Situation, Route, Combo };
