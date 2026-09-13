// SF6 ダメージ補正ルール（クラシック操作・監査用）。
//
// 2026-09-13 時点でクラシック操作の計算ロジックは、オーナーが対戦画面で確認した
// 実測値との答え合わせを繰り返して確定済み（21コンボ中17件が完全一致、残りも
// 既知の制限で説明できている）。仕組みの言語化は docs/DAMAGE-CALCULATION-MECHANISM.md
// を参照。当初の調査メモ（community記事の候補値）は docs/archive/
// DAMAGE-CALCULATION-DESIGN.md / DAMAGE-CALCULATION-RESEARCH-2026-09-12.md に
// 移動済み（実装前の調査時点の記録として保存、値の根拠は既にこのファイルと
// MECHANISM.md の実測確認に置き換わっている）。
// 値を直す時はこのファイルだけを直せばよいようにする（scripts/damage-audit.ts）。
//
// 未確定・未実装（既知の欠落。積極的に「それらしい値」で埋めていない）:
//  - ジャストパリィ後の反撃（0.5 倍）、DI ガード壁やられ（0.8 倍）
//  - 端数処理は「率を都度 floor → 最後にダメージを floor」以外の方式も候補にある
//
// 2026-09-13 モダン簡易入力の補正（オーナーの依頼で調査・実装）:
//  ネット上の複数の解説記事で「モダン操作の SP ボタンで出す必殺技は、コマンド入力
//  （クラシック的な操作）で出した場合の 80%（×0.8）のダメージになる。モダン操作中でも
//  コマンド入力（Move.inputModernPrecise）で出せば据え置き」という一致した説明を確認した。
//  公式フレームデータ自体にも根拠がある: マノンの弱/中/強/OD マネージュ・ドレ、
//  弱/OD ランヴェルセの「■クラシック操作」「■モダン操作時」の並記ダメージが、
//  Lv1基準でいずれも厳密に ×0.8（例: 弱マネージュ・ドレ 2000→1600、弱ランヴェルセ
//  1350→1080、OD ランヴェルセ 1500→1200）になっていることを確認済み。
//  スーパーアーツの最低保証（30/40/50%）はこの 0.8 倍が掛かった後でも保証として
//  機能する（＝クラシックの DR 乗算補正と全く同じ位置・順序で効くと考えられる）。
//  適用対象は「SPボタンの簡易入力という、コマンド入力と別の代替手段が実在する技」
//  （technical にはモダン専用の入力方法を持つ special/super）のみで、通常技・投げ・
//  ドライブインパクトのように入力方法自体が変わらない技には掛からない（判定は
//  calculate.ts の usesModernSimplifiedInput() を参照）。
//  技辞典側で Move.inputModern が未確認（null）のままの技（マノン/ブランカの
//  SA1〜3 含む）は、モダン計算では「不明」として結果を incomplete にする
//  （0.8 倍が掛かるかどうか不確かな値を確定計算として返さない）。
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
  /**
   * モダン操作の SP ボタン簡易入力で special/super を出した時に、そのヒットの
   * 残存率へ掛かる係数（DR 係数と同じ位置・順序で乗算、重ね掛けはしない）。
   * コマンド入力（inputModernPrecise）を使った場合は掛からない。
   */
  modernSimplifiedInputMultiplier: number;
  /** 丸め: 各ヒットのダメージ確定前に「残存率（%）」を floor するか */
  roundScalingPercent: boolean;
  /** 丸め: 最終ダメージ（率適用後）を floor するか */
  roundFinalDamage: boolean;
}

export const CANDIDATE_RULESET_2026_09: DamageRuleset = {
  id: 'candidate-2026-09',
  source:
    '2026-09-13 オーナーの実測値（対戦画面）との答え合わせで確定（docs/DAMAGE-CALCULATION-MECHANISM.md）。' +
    '当初はネット検証記事の候補値から出発したが（経緯は docs/archive/DAMAGE-CALCULATION-RESEARCH-2026-09-12.md）、' +
    '現在の値は実測確認済み。定数名・id は初期実装時のまま維持（互換のため未リネーム）。',
  stageScalingPercent: [100, 100, 80, 70, 60, 50, 40, 30, 20, 10],
  driveRushMultiplier: 0.85,
  modernSimplifiedInputMultiplier: 0.8,
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

/**
 * この技が、コマンド入力とは別に「モダン操作の SP ボタン簡易入力」という
 * 代替手段を持つか（＝モダンダメージ減衰の対象になりうるか）を、Move の
 * inputModern / inputClassic だけから判定する。
 *
 * 判定: inputModern が inputClassic と異なる文字列を持つ場合のみ true。
 * 単に「モダンでも同じボタンで出せる」だけ（OD版の PP 同時押し等、
 * クラシックと入力自体が変わらない）の技は対象外
 * （例: blanka-electric-od は inputModern も "214PP" で inputClassic と同一）。
 */
export function moveHasModernShortcutInput(move: {
  inputClassic: string;
  inputModern: string | null;
}): boolean {
  return move.inputModern != null && move.inputModern !== move.inputClassic;
}

/**
 * モダン計算の対象カテゴリか（通常技・投げ・ドライブインパクト等は対象外）。
 * 「投げ」でもマネージュ・ドレ等のコマンド投げは技辞典上 category:'special' のため対象になる。
 */
export function isModernPenaltyEligibleCategory(category: string): boolean {
  return category === 'special' || category === 'super';
}
