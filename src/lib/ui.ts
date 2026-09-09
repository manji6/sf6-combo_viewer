import type {
  OpponentState,
  Position,
  Risk,
  RouteKind,
  SituationKind,
} from '../data/types';

export const POSITION_LABEL: Record<Position, string> = {
  midscreen: '中央',
  near_corner: '端付近',
  corner: '画面端',
  anywhere: '位置不問',
};

export const SITUATION_KIND_LABEL: Record<SituationKind, string> = {
  neutral: 'ニュートラル',
  hit: 'ヒット',
  juggle: '浮き',
  knockdown: 'ダウン',
  blockstring: 'ガード連携',
  okiStart: '置き攻け起点',
};

export const OPPONENT_STATE_LABEL: Record<OpponentState, string> = {
  neutral: '通常',
  standing_hit: '立ちヒット',
  crouch_hit: 'しゃがみヒット',
  juggle: '空中やられ',
  air: '空中',
  wall_splat: '壁貼り付け',
  knockdown_soft: 'ダウン（受け身可）',
  knockdown_hard: 'ダウン（強制）',
  blockstun: 'ガード硬直',
};

export const ROUTE_KIND_LABEL: Record<RouteKind, string> = {
  starter: '始動',
  combo_route: '中継',
  okizeme: '置き攻け',
  ender: '締め',
  conversion: 'リターン変換',
};

export const RISK_VAR: Record<Risk, string> = {
  低: 'var(--risk-low)',
  中: 'var(--risk-mid)',
  高: 'var(--risk-high)',
};

/** ★1〜5 を文字列で返す（塗り＋空） */
export function stars(n: number): { on: string; off: string } {
  const c = Math.max(0, Math.min(5, Math.round(n)));
  return { on: '★'.repeat(c), off: '★'.repeat(5 - c) };
}

export function driveLabel(cost: number): string {
  return cost > 0 ? `Dゲージ ${cost}` : 'ノーゲージ';
}

export function superLabel(cost: number, saLevel: 1 | 2 | 3 | null): string {
  if (cost <= 0) return 'SA不使用';
  return saLevel ? `SA${saLevel}（${cost}本）` : `SAゲージ ${cost}`;
}
