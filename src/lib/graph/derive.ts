import {
  combos,
  getCombo,
  getRoute,
  getSituation,
  moveByKey,
  routes,
  situations,
  stepModernCommand,
} from '../../data';
import type { Combo, Route, Situation, Step } from '../../data/types';

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

/** コンボ本線がモダン操作でも実行できるか（全パーツが 'both'） */
export function comboSupportsModern(combo: Combo): boolean {
  return combo.routeChain.map(getRoute).every((r) => r.controlType === 'both');
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
  usesModern: boolean;
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
  let usesModern = false;

  for (const r of chain) {
    r.steps.forEach((st, i) => {
      const commandModern = stepModernCommand(st);
      steps.push({ ...st, commandModern, routeId: r.id, routeLabel: r.label, boundary: i === 0 });
      if (commandModern) usesModern = true;
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
    usesModern,
  };
}

/** routeChain が連続しているか検証（route[i].to === route[i+1].from） */
export function validateComboChain(combo: Combo): string[] {
  const errors: string[] = [];
  const chain = combo.routeChain.map(getRoute);
  if (chain.length === 0) {
    errors.push(`${combo.slug}: routeChain が空`);
    return errors;
  }
  if (chain[0].from !== combo.startFrom) {
    errors.push(`${combo.slug}: startFrom(${combo.startFrom}) が先頭パーツの from(${chain[0].from}) と不一致`);
  }
  if (chain[chain.length - 1].to !== combo.endAt) {
    errors.push(`${combo.slug}: endAt(${combo.endAt}) が末尾パーツの to と不一致`);
  }
  for (let i = 0; i < chain.length - 1; i++) {
    if (chain[i].to !== chain[i + 1].from) {
      errors.push(
        `${combo.slug}: パーツ ${chain[i].id}.to(${chain[i].to}) と ${chain[i + 1].id}.from(${chain[i + 1].from}) が不連続`,
      );
    }
  }
  return errors;
}

/** データ全体の整合性チェック（Phase 1 はコンソール警告に使う） */
export function validateAll(): string[] {
  const errors: string[] = [];
  const ids = new Set(situations.map((s) => s.id));
  for (const r of routes) {
    if (!ids.has(r.from)) errors.push(`route ${r.id}: from(${r.from}) が存在しない`);
    if (!ids.has(r.to)) errors.push(`route ${r.id}: to(${r.to}) が存在しない`);
    for (const st of r.steps) {
      if (st.moveKey && !moveByKey.has(st.moveKey)) {
        errors.push(`route ${r.id}: step の moveKey(${st.moveKey}) が技辞典に存在しない`);
      }
    }
  }
  for (const c of combos) errors.push(...validateComboChain(c));
  // 孤立ノード
  for (const s of situations) {
    if (outgoingRoutes(s.id).length === 0 && incomingRoutes(s.id).length === 0) {
      errors.push(`situation ${s.id}: 孤立ノード（接続パーツなし）`);
    }
  }
  return errors;
}

export { getSituation, getRoute, getCombo };
export type { Situation, Route, Combo };
