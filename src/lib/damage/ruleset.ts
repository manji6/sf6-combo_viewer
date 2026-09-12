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
//  - SA3 の「立ち強P・ロン・ポワンからのキャンセル時のみ即時補正15%」のような
//    「特定の技からキャンセルされた場合のみ」発動する条件付き即時補正
//    （calculate.ts は「この技自身が即時補正を持つか」しか見ておらず、
//    「直前の技が何か」は見ていない）
//  - ジャストパリィ後の反撃（0.5 倍）、DI ガード壁やられ（0.8 倍）
//  - パニッシュカウンターの基礎値ボーナス（強K で2例確認したが強P の1例と
//    整合せず、技固有の可能性が高いため保留）
//  - 端数処理は「率を都度 floor → 最後にダメージを floor」以外の方式も候補にある
//
// 判明済みだが実装していない既知の制限（技の仕様であって計算式のバグではない）:
//  - 強ロン・ポワンは本来2ヒットする技だが、技辞典の damage(800) は2ヒット分。
//    空中の相手に当てると1ヒットしか入らないため、実際のダメージは表の残存率を
//    掛けた上でさらに半分になる（manon-jump-jhk-odfouette で確認、オーナー説明）。
//    技辞典が単一の damage しか持たないため、この「状況によるヒット数の変化」は
//    今回モデル化していない。同様の多段技も同じ制限を受ける可能性がある。
//
// Move.comboScaling の「始動補正◯%」「即時補正◯%」は 2026-09-13 の実測答え合わせで
// 確認できたため実装済み（parseStarterScalingPercent / parseImmediateScalingPercent）。
// 「コンボ補正◯%」（manon-tanlie 等）は今回のデータでは上記と同じ扱いにすると
// 実測と食い違ったため、あえて何もしない（説明文のまま、計算には使わない）。
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

const STARTER_SCALING_RE = /始動補正(\d+)%/;
const IMMEDIATE_SCALING_RE = /即時補正(\d+)%/;

/**
 * Move.comboScaling の「始動補正◯%」を読み取る（無ければ undefined）。
 * 2026-09-13 オーナー実測との答え合わせで確認: この技を「コンボの最初のヒット」
 * として使うと、以降のヒットの段の進み方が 1 段前進する（弱P/弱K/2弱P/ドライブ
 * インパクト/OD必殺技の一部で確認）。現時点でデータ上の値はすべて 20% だが、
 * 実装は「段を1つ前進」に固定している（表の間隔が不均一なため、他の％値が
 * 出てきたら単純な変換式にはできない可能性がある。値が変わったら要見直し）。
 */
export function parseStarterScalingPercent(comboScaling: string | null | undefined): number | undefined {
  if (!comboScaling) return undefined;
  const m = comboScaling.match(STARTER_SCALING_RE);
  return m ? Number(m[1]) : undefined;
}

/**
 * Move.comboScaling の「即時補正◯%」を読み取る（無ければ undefined）。
 * 2026-09-13 オーナー実測との答え合わせで確認: この技がヒットした時点で、
 * その技自身とそれ以降の全ヒットの残存率から◯ポイントを差し引く（以降も
 * 持続する）。同じ技を複数回使うと重ね掛けされる（弱グランフェッテを2回
 * 使う画面端補正切りコンボで、2回目以降さらに10ポイント追加されることを確認）。
 * 適用順は「段の残存率 − 即時補正の累計 → DR係数 → floor」。
 */
export function parseImmediateScalingPercent(comboScaling: string | null | undefined): number | undefined {
  if (!comboScaling) return undefined;
  const m = comboScaling.match(IMMEDIATE_SCALING_RE);
  return m ? Number(m[1]) : undefined;
}
