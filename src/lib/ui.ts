import type {
  OpponentState,
  Position,
  Risk,
  RouteKind,
  RouteProperties,
  Situation,
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

export interface ParsedAdvantage {
  /** 数値フレーム値（"+8" "±0" 等）。無ければ数値化できない自由記述 */
  frame?: string;
  /** フレームの計測条件（元テキストの数値の前にある語。例:「前ステ後」）。無指定なら呼び出し側で既定文言を補ってよい */
  basis?: string;
  /** 元テキストの括弧内注記（例:「連続ガード」） */
  note?: string;
  /** 数値化できない自由記述（例:「パニカン誘発」）。そのまま表示する */
  freeform?: string;
}

const FRAME_ADVANTAGE_RE = /^(.*?)\s*([+\-±]\d+)\s*(?:（([^）]*)）)?$/;

/**
 * situation.advantage の生テキストを解析する。
 * 「+8」「±0」のような数値フレームと、「パニカン誘発」等の自由記述を区別する。
 * 「メダル獲得 +1」のような報酬は数値の形を借りていても advantage に置かない運用にする
 * （schema の reward フィールドを使う。R03: 2026-09-12 レビュー）。
 */
export function parseAdvantage(advantage: string | undefined): ParsedAdvantage | undefined {
  if (!advantage) return undefined;
  const m = advantage.match(FRAME_ADVANTAGE_RE);
  if (!m) return { freeform: advantage };
  const [, prefix, value, note] = m;
  return { frame: value, basis: prefix.trim() || undefined, note: note?.trim() || undefined };
}

/** この situation.kind では、測定条件の明記がないフレーム値に「相手復帰まで」を既定で補ってよい */
const RECOVERY_BASIS_KINDS = new Set<SituationKind>(['knockdown', 'okiStart']);

/**
 * situation.advantage を画面表示用の 1 行に整形する。測定条件（basis）が元テキストに
 * 無いフレーム値は、kind が knockdown/okiStart の場合のみ「相手復帰まで」を補う。それ以外の
 * kind（neutral の ±0 など）は数値のみ表示し、未確認の前提を追加しない。
 * reward はここでは扱わない（situationRewardText を使う）。
 */
export function situationAdvantageText(
  situation: Pick<Situation, 'kind' | 'advantage'>,
): string | undefined {
  const adv = parseAdvantage(situation.advantage);
  if (!adv) return undefined;
  if (adv.freeform) return adv.freeform;
  const basis = adv.basis ?? (RECOVERY_BASIS_KINDS.has(situation.kind) ? '相手復帰まで' : undefined);
  const head = basis ? `${basis} ${adv.frame}` : adv.frame!;
  return adv.note ? `${head}（${adv.note}）` : head;
}

/** situation.reward の表示文字列（フレーム有利とは別枠で表示する） */
export function situationRewardText(situation: Pick<Situation, 'reward'>): string | undefined {
  return situation.reward;
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
