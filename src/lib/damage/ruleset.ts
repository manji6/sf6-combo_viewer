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
//  - ジャストパリィ後の反撃（0.5 倍）、DI ガード壁やられ（0.8 倍）
//  - 端数処理は「率を都度 floor → 最後にダメージを floor」以外の方式も候補にある
//
// 判明済みだが実装していない既知の制限（技の仕様であって計算式のバグではない）:
//  - 強ロン・ポワンは本来2ヒットする技だが、技辞典の damage(800) は2ヒット分。
//    空中の相手に当てると1ヒットしか入らないため、実際のダメージは表の残存率を
//    掛けた上でさらに半分になる（manon-jump-jhk-odfouette と
//    manon-jump-jhk-hoseigiri の、構造的に全く同じ位置にある強ロン・ポワンが
//    どちらも実測200＝半分＋即時補正込みの値で一致することを確認）。
//  - 弱ロン・ポワンを SA3 へキャンセルする場合も1段目しか出ない（同上）。実測21
//    ダメージは技辞典の damage(900) や本来2ヒット分だと考えても説明がつかない
//    小ささで、900 という値自体が正しいかも要確認（manon-mid-5mp-lethal-sa3）。
//    技辞典が単一の damage しか持たないため、この「状況によるヒット数の変化」は
//    今回モデル化していない。同様の多段技も同じ制限を受ける可能性がある。
//
// 2026-09-13 オーナーが公式サイトの補正値説明ページの文言を確認・共有してくれた。
// 用語の対応（本ファイルの実装との対応関係）:
//   始動補正 = 「コンボの初段にヒットさせた際に加算される補正」
//     → parseStarterScalingPercent。この技自身の値は変えず、以降のヒットの
//     段を1つ前進させる（自分自身には掛からない）。
//   コンボ補正 = 「コンボの2段目以降にヒットさせた際に加算される補正」
//     → 段階テーブル（stageScalingPercent）そのものに加えて、manon-tanlie 等の
//     「コンボ補正◯%」表記も同じ性質の補正だと判明した（parseComboCorrectionPercent）。
//     始動補正と同じく、この技自身には掛からず、以降のヒットの段を前進させる。
//     始動補正との違いは「コンボの最初のヒットである必要がない」こと
//     （manon-punish-5hp-pc-ranversement のタン・リエ＝2段目で確認）。
//   即時補正 = 「コンボの2段目以降にヒットさせた際、その技自体に加算される補正」
//     → parseImmediateScalingPercent。コンボ補正と違い、この技自身にも掛かり、
//     かつ以降にも持続する（グランフェッテで確認）。「加算」の中身は技によって
//     形が違う（グランフェッテは％の減算だったが、SA3 のロン・ポワンキャンセルは
//     固定ダメージの加算だった。calculate.ts の SA3_CANCEL_BONUS_* を参照）。
//   乗算補正 = 「コンボに組み込んだ際に、それ以降のコンボ補正値に乗算される補正値」
//     → driveRushMultiplier（DR の 0.85 倍）がこれに当たると考えられる
//
// パニッシュカウンター（PC）は、当該ヒットの基礎ダメージに ×1.2 のボーナスが
// 掛かることを強K・強P・ドライブインパクトの3例（いずれも合計値が完全一致）で
// 確認した（calculate.ts の PC_DAMAGE_MULTIPLIER）。判定は step.command に
// notation の PC メタトークンが含まれるかで行う。
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

const COMBO_CORRECTION_RE = /コンボ補正(\d+)%/;

/**
 * Move.comboScaling の「コンボ補正◯%」を読み取る（無ければ undefined）。
 * 2026-09-13 オーナー実測との答え合わせで確認: 始動補正と同じ「段を1つ前進」
 * だが、始動技である必要がない（2段目以降でも発動する）。この技自身の値には
 * 掛からず、以降のヒットにだけ効く（manon-tanlie を2段目で使うコンボで、
 * 3段目以降がすべて1段前進した値になることを確認。tanlie 自身は前進なし）。
 */
export function parseComboCorrectionPercent(comboScaling: string | null | undefined): number | undefined {
  if (!comboScaling) return undefined;
  const m = comboScaling.match(COMBO_CORRECTION_RE);
  return m ? Number(m[1]) : undefined;
}
