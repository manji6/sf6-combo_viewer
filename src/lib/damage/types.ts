// ダメージ計算の結果型（DC-2）。
// 「計算できた」は入力モデルで計算が完了した、という意味であり、ゲーム内で検証済みという
// 意味ではない。実測との一致状態は呼び出し側（監査スクリプト等）で別に扱う。
// 参照: docs/DAMAGE-CALCULATION-MECHANISM.md（確定した計算ロジックの言語化）。
// 型設計時の検討経緯は docs/archive/DAMAGE-CALCULATION-DESIGN.md §5.5 に保存済み。

export type CalculationIssueCode =
  | 'missing_base_damage' // 技辞典に damage が無い（null）
  | 'unresolved_move' // moveKey が技辞典に見つからない
  | 'no_hits' // 実際に当たった技が 1 つも無い
  | 'missing_modern_input'; // controlType:'modern' で、モダン入力有無が技辞典で未確認（inputModern が null）

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
   * 即時補正・DR係数・モダン簡易入力補正・SA最低保証まで適用した後の残存率
   * （%、floor 前）。適用順は stage% → 即時補正 → DR係数 → モダン簡易入力補正
   * （controlType:'modern' の対象技のみ）→ SA最低保証（保証は DR/モダン補正後の
   * 下限として扱う。保証成立後にさらに掛け算しない）。
   */
  guaranteedPercent: number;
  /** guaranteedPercent を floor した最終残存率（%） */
  finalPercent: number;
  /** 技辞典の damage。パニッシュカウンターなら ×1.2 適用後の値 */
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
