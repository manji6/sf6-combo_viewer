// ダメージ計算の結果型（DC-2）。
// 「計算できた」は入力モデルで計算が完了した、という意味であり、ゲーム内で検証済みという
// 意味ではない。実測との一致状態は呼び出し側（監査スクリプト等）で別に扱う。
// 参照: docs/DAMAGE-CALCULATION-DESIGN.md §5.5

export type CalculationIssueCode =
  | 'missing_base_damage' // 技辞典に damage が無い（null）
  | 'unresolved_move' // moveKey が技辞典に見つからない
  | 'no_hits'; // 実際に当たった技が 1 つも無い

export interface CalculationIssue {
  code: CalculationIssueCode;
  message: string;
  stepIndex?: number;
  moveKey?: string;
}

/** 1 ヒット分の内訳。合計が食い違った時に最初にズレたヒットを追えるようにする */
export interface HitBreakdown {
  stepIndex: number;
  routeId: string;
  moveKey?: string;
  move: string;
  /** このヒット時点での「段」（1 始まり。補正切りで 1 に戻る） */
  stage: number;
  /** 段（stageScalingPercent テーブル）に対応する残存率（%） */
  stagePercent: number;
  /**
   * 即時補正・DR係数・SA最低保証まで適用した後の残存率（%、floor 前）。
   * 適用順は stage% → 即時補正 → DR係数 → SA最低保証（保証は DR 後の下限として
   * 扱う。保証成立後にさらに DR を掛けない）。
   */
  guaranteedPercent: number;
  /** guaranteedPercent を floor した最終残存率（%） */
  finalPercent: number;
  baseDamage: number;
  damage: number;
  /** このヒットに効いたルール（監査用のメモ） */
  appliedRules: string[];
}

export interface CalculationResult {
  status: 'calculated' | 'incomplete';
  rulesetId: string;
  totalDamage: number;
  hits: HitBreakdown[];
  /** status:'incomplete' の理由。calculated でも参考情報として残ることがある */
  issues: CalculationIssue[];
}
