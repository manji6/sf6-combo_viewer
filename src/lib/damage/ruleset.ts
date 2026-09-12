// SF6 ダメージ補正の候補ルール（DC-1 未確定・監査用）。
//
// ここに書く数値は docs/DAMAGE-CALCULATION-DESIGN.md と
// docs/DAMAGE-CALCULATION-RESEARCH-2026-09-12.md がネットの検証記事・公開計算機
// から拾った「候補値」であり、公式一次資料や実機での確認は済んでいない。
// オーナーの指示（2026-09-13）により、この候補ルールで実際にいくつかのコンボの
// ダメージを計算し、オーナーが実測値と突き合わせて精度を確認する運用で導入する
// （scripts/damage-audit.ts）。値を直す時はこのファイルだけを直せばよいようにする。
//
// 未確定・未実装（既知の欠落。積極的に「それらしい値」で埋めていない）:
//  - モダン簡易入力による補正（通常 0.8 倍、技によって継承・例外あり）
//  - SA3 の「立ち強P・ロン・ポワンからのキャンセル時のみ即時補正15%」等、技固有の
//    条件付き即時補正（対象技の識別ロジックが必要で、今回は見送り）
//  - ジャストパリィ後の反撃（0.5 倍）、DI ガード壁やられ（0.8 倍）
//  - 端数処理は「率を都度 floor → 最後にダメージを floor」以外の方式も候補にある
export interface DamageRuleset {
  id: string;
  /** 何を根拠にしたかの短い説明 */
  source: string;
  /**
   * 通常の補正進行（％）。段（stage、1始まり）→ 残存率。
   * 配列の最後の値を下限として、それ以降の段も同じ値を使う。
   * 候補: 100 → 100 → 80 → 70 → 60 → 50 → 40 → 30 → 20 → 10（10%が下限）
   */
  stageScalingPercent: number[];
  /** コンボ中の（生）ドライブラッシュ 1 回につき、以降のヒットに掛かる係数（重ね掛けしない） */
  driveRushMultiplier: number;
  /** 丸め: 各ヒットのダメージ確定前に「残存率（%）」を floor するか */
  roundScalingPercent: boolean;
  /** 丸め: 最終ダメージ（率適用後）を floor するか */
  roundFinalDamage: boolean;
}

export const CANDIDATE_RULESET_2026_09: DamageRuleset = {
  id: 'candidate-2026-09',
  source:
    'docs/DAMAGE-CALCULATION-RESEARCH-2026-09-12.md（ハメコ2023-07-01・はるか2023-08-26 等の検証記事の候補値）。公式一次資料未確認。',
  stageScalingPercent: [100, 100, 80, 70, 60, 50, 40, 30, 20, 10],
  driveRushMultiplier: 0.85,
  roundScalingPercent: true,
  roundFinalDamage: true,
};

/** stage（1始まり）に対応する残存率（%）を返す。範囲外は下限値を使う */
export function scalingPercentForStage(ruleset: DamageRuleset, stage: number): number {
  const table = ruleset.stageScalingPercent;
  const idx = Math.min(Math.max(stage, 1), table.length) - 1;
  return table[idx];
}

const MIN_GUARANTEE_RE = /最低保[障証](\d+)%/;

/** Move.comboScaling の自由記述から「最低保証◯%」を読み取る（無ければ undefined） */
export function parseMinGuaranteePercent(comboScaling: string | null | undefined): number | undefined {
  if (!comboScaling) return undefined;
  const m = comboScaling.match(MIN_GUARANTEE_RE);
  return m ? Number(m[1]) : undefined;
}
