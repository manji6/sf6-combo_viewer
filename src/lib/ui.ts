import type {
  OpponentState,
  Position,
  Risk,
  RouteKind,
  RouteProperties,
  SituationKind,
  Step,
  StepAction,
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
  okiStart: '起き攻め起点',
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
  okizeme: '起き攻め',
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

/** 技コマンドでない操作の表示。tag＝チップ左の1文字、label＝チップ本文 */
export const STEP_ACTION: Record<StepAction, { tag: string; label: string }> = {
  walk: { tag: '歩', label: '微歩き' },
  walk_back: { tag: '歩', label: '微後ろ歩き' },
  dash: { tag: '走', label: '前ステップ' },
  dash_back: { tag: '走', label: 'バックステップ' },
  whiff: { tag: '空', label: '空振り' },
  feint: { tag: '偽', label: 'フェイント' },
  wait: { tag: '見', label: '様子見' },
};

/** 操作チップの本文。whiff / feint は「<技名> <ラベル>」、それ以外は固定ラベル */
export function stepActionLabel(step: Step): string {
  if (!step.action) return step.move;
  const a = STEP_ACTION[step.action];
  return step.action === 'whiff' || step.action === 'feint' ? `${step.move} ${a.label}` : a.label;
}

export const WAKEUP_COVERAGE_LABEL: Record<'both' | 'quick' | 'back', string> = {
  both: '両対応',
  quick: 'その場受け身のみ',
  back: '後ろ受け身のみ',
};

/** バッジ用の短い表記 */
export const WAKEUP_COVERAGE_SHORT: Record<'both' | 'quick' | 'back', string> = {
  both: '両対応',
  quick: 'その場のみ',
  back: '後ろのみ',
};

/** RouteProperties.frameAdvantage を表示文字列にする。数値に "F" を付ける */
export function frameAdvLabel(
  fa: RouteProperties['frameAdvantage'],
  opts: { withNote?: boolean } = {},
): string | undefined {
  if (!fa) return undefined;
  const head = `${fa.frames}F`;
  return opts.withNote && fa.note ? `${head}（${fa.note}）` : head;
}

/** RouteProperties.wakeup を 1 行のテキストにまとめる（フロー枠・一覧向け） */
export function wakeupSummary(w: RouteProperties['wakeup']): string | undefined {
  if (!w) return undefined;
  const head = WAKEUP_COVERAGE_LABEL[w.coverage];
  if (w.note) return `${head}（${w.note}）`;
  const parts: string[] = [];
  if (w.quickRise) parts.push(`その場: ${w.quickRise}`);
  if (w.backTech) parts.push(`後ろ: ${w.backTech}`);
  return parts.length ? `${head}／${parts.join('・')}` : head;
}
