// コンボ全体を順に処理してダメージを計算する純粋関数（DC-3 MVP）。
// DOM・Astro・グローバル状態に依存しない。辞書（moveByKey 経由）とルールセットは
// 引数で注入できるようにしたいところだが、MVP では既存の src/data の索引をそのまま使う。
//
// 前提・既知の制限（ruleset.ts のコメントも参照）:
//  - moveKey を持つ step のみ「ヒット」として扱う。DR/DRC/CDR（moveKey 無し・
//    command が DR系）は非ヒット・以降 DR 係数を適用するだけの印。
//  - action（whiff/feint/walk 等）付きの step は非ヒット。whiff/feint は「補正切り」
//    として段（stage）を 1 にリセットする。
//  - 技辞典の damage は多段技でも 1 つの数値しか持たないため、多段の内訳計算はしない
//    （既存の手入力ダメージ運用と同じ粒度）。
//  - モダン簡易入力の補正、ジャストパリィ/DI、SA固有の条件付き即時補正、
//    パニッシュカウンターの基礎値ボーナスは未実装（オーナー確認待ち。下記コメント参照）。
//
// 2026-09-13 オーナー実測との答え合わせで確認できたこと:
//  - 弱攻撃（弱P/弱K/2弱P 等）始動のコンボは、段の進行が通常より 1 段進んだ状態
//    （stage=2 相当）から始まる。中P始動・強P始動・ドライブインパクト始動では
//    この前進は見られない。3件（弱P始動2件・弱K始動1件、いずれも合計値が完全一致）
//    で確認できたため lightStarterShift として実装する。
//  - 一方、以下は実測と食い違うか、確認件数が少なく未実装:
//    - パニッシュカウンター（PC）ヒットの基礎値ボーナス（強K PC の2例では
//      技辞典値×1.2 で一致したが、強P PC の1例では逆に悪化した。技ごとの
//      例外の可能性があり、確証が持てるまで実装しない）
//    - ドライブインパクト始動に弱攻撃と同じ前進があるように見える例（1件のみ、
//      別の例では悪化したため保留）
//    - 補正切り（タゲコンの浮かせ直し等、空振り/フェイントを伴わないケース）の
//      段リセットは、リセットする実装の方が実測から離れたため見送り
//    詳細は damage-audit の答え合わせ結果と会話ログを参照。
import { getRoute, moveByKey } from '../../data';
import type { Combo, Step } from '../../data/types';
import { parseCommand } from '../notation/parse';
import {
  CANDIDATE_RULESET_2026_09,
  parseMinGuaranteePercent,
  scalingPercentForStage,
  type DamageRuleset,
} from './ruleset';
import type { CalculationIssue, CalculationResult, HitBreakdown } from './types';

const DR_COMMAND_RE = /^(DR|DRC|CDR)$/;

/** step.command の先頭ボタンが弱（L）強度かどうか */
function isLightStrengthCommand(command: string): boolean {
  const token = parseCommand(command).find((t) => t.kind === 'button');
  return token?.kind === 'button' && token.strength === 'L';
}

/** チェーン全体から最初の「本当のヒット」の step を探す（DR・action 付きは飛ばす） */
function findFirstHitStep(steps: Step[][]): Step | undefined {
  for (const group of steps) {
    for (const step of group) {
      if (step.action) continue;
      if (!step.moveKey && DR_COMMAND_RE.test(step.command)) continue;
      if (step.moveKey) return step;
    }
  }
  return undefined;
}

export function calculateComboDamage(
  combo: Combo,
  ruleset: DamageRuleset = CANDIDATE_RULESET_2026_09,
): CalculationResult {
  const chain = combo.routeChain.map(getRoute);
  const hits: HitBreakdown[] = [];
  const issues: CalculationIssue[] = [];

  const firstHit = findFirstHitStep(chain.map((r) => r.steps));
  // 弱攻撃始動: 段の進行が 1 つ前進した状態（stage=2）から始まる（実測3件で確認）
  let stage = firstHit && isLightStrengthCommand(firstHit.command) ? 2 : 1;
  let drApplied = false;
  let stepIndex = 0;

  for (const route of chain) {
    for (const step of route.steps) {
      const idx = stepIndex++;

      if (!step.moveKey && DR_COMMAND_RE.test(step.command)) {
        drApplied = true;
        continue;
      }
      if (step.action) {
        // 補正切り: 空振り・フェイントでコンボを切ると、次のヒットは補正が乗らない
        if (step.action === 'whiff' || step.action === 'feint') stage = 1;
        continue;
      }
      if (!step.moveKey) continue;

      const move = moveByKey.get(step.moveKey);
      if (!move) {
        issues.push({
          code: 'unresolved_move',
          message: `moveKey(${step.moveKey}) が技辞典に見つからない`,
          stepIndex: idx,
          moveKey: step.moveKey,
        });
        continue;
      }
      if (move.damage == null) {
        issues.push({
          code: 'missing_base_damage',
          message: `技「${move.name}」の damage が未登録（null）`,
          stepIndex: idx,
          moveKey: step.moveKey,
        });
        continue;
      }

      const stagePercent = scalingPercentForStage(ruleset, stage);
      const appliedRules = [`stage${stage}=${stagePercent}%`];
      let percent = stagePercent;

      if (move.category === 'super') {
        const guarantee = parseMinGuaranteePercent(move.comboScaling);
        if (guarantee != null && guarantee > percent) {
          percent = guarantee;
          appliedRules.push(`SA最低保証${guarantee}%`);
        }
      }
      const guaranteedPercent = percent;

      if (drApplied) {
        percent *= ruleset.driveRushMultiplier;
        appliedRules.push(`DR×${ruleset.driveRushMultiplier}`);
      }
      const finalPercent = ruleset.roundScalingPercent ? Math.floor(percent) : percent;

      let damage = (move.damage * finalPercent) / 100;
      if (ruleset.roundFinalDamage) damage = Math.floor(damage);

      hits.push({
        stepIndex: idx,
        routeId: route.id,
        moveKey: step.moveKey,
        move: step.move,
        stage,
        stagePercent,
        guaranteedPercent,
        finalPercent,
        baseDamage: move.damage,
        damage,
        appliedRules,
      });
      stage++;
    }
  }

  if (hits.length === 0) {
    issues.push({ code: 'no_hits', message: 'ヒットが1つも解決できなかった（chain に技が無い）' });
  }

  const totalDamage = hits.reduce((sum, h) => sum + h.damage, 0);
  return {
    status: issues.length === 0 ? 'calculated' : 'incomplete',
    rulesetId: ruleset.id,
    totalDamage,
    hits,
    issues,
  };
}
