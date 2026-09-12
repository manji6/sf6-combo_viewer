// コンボ全体を順に処理してダメージを計算する純粋関数（DC-3 MVP）。
// DOM・Astro・グローバル状態に依存しない。辞書（moveByKey 経由）とルールセットは
// 引数で注入できるようにしたいところだが、MVP では既存の src/data の索引をそのまま使う。
//
// 前提・既知の制限（ruleset.ts のコメントも参照）:
//  - moveKey を持つ step のみ「ヒット」として扱う。DR/DRC/CDR（moveKey 無し・
//    command が DR系）は非ヒット・以降 DR 係数を適用するだけの印。
//  - action（whiff/feint/walk 等）付きの step は非ヒット。whiff/feint は「補正切り」
//    として段（stage）を 1 にリセットする。空振り/フェイントを伴わない補正切り
//    （タゲコンの浮かせ直し等）は、遷移先の situation が「補正切り」タグを
//    持っていればパーツの境界でリセットする。
//  - 技辞典の damage は多段技でも 1 つの数値しか持たないため、多段の内訳計算はしない
//    （既存の手入力ダメージ運用と同じ粒度）。
//
// 2026-09-13 オーナー実測との答え合わせで確認できたこと（ruleset.ts のコメントも参照）:
//  - Move.comboScaling の「始動補正◯%」: この技がコンボの最初のヒットなら、
//    以降のヒットの段が1つ前進する（弱P/弱K/2弱P/ドライブインパクトで確認。
//    OD必殺技にも同じ表記があるが未確認）。
//  - Move.comboScaling の「即時補正◯%」: この技がヒットした時点で、自身と
//    以降の全ヒットの残存率から◯ポイントを差し引く。同じ技を2回使うと
//    重ね掛けされる（画面端補正切りコンボの弱グランフェッテ2回で確認）。
//    適用順は「段の残存率 − 即時補正の累計」→ DR係数 → floor。
import { getRoute, getSituation, moveByKey } from '../../data';
import type { Combo, Move, Step } from '../../data/types';
import {
  CANDIDATE_RULESET_2026_09,
  parseImmediateScalingPercent,
  parseMinGuaranteePercent,
  parseStarterScalingPercent,
  scalingPercentForStage,
  type DamageRuleset,
} from './ruleset';
import type { CalculationIssue, CalculationResult, HitBreakdown } from './types';

const DR_COMMAND_RE = /^(DR|DRC|CDR)$/;

/** チェーン全体から最初の「本当のヒット」の step を探す（DR・action 付きは飛ばす） */
function findFirstHitStep(stepGroups: Step[][]): Step | undefined {
  for (const group of stepGroups) {
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
  const firstMove: Move | undefined = firstHit?.moveKey ? moveByKey.get(firstHit.moveKey) : undefined;
  // 始動補正: 始動技がこの補正を持てば、段の進行を1つ前進させて始める
  let stage = parseStarterScalingPercent(firstMove?.comboScaling) != null ? 2 : 1;
  let drApplied = false;
  let immediateOffset = 0; // 即時補正の累計（ポイント）。ヒットのたびに増えていく
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
        if (step.action === 'whiff' || step.action === 'feint') {
          stage = 1;
          immediateOffset = 0;
        }
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

      // 即時補正: このヒット自身にも、これまでの累計オフセットを適用する。
      // ただしコンボの最初のヒット（例: 単発の投げ）には適用しない
      // （始動補正と同様、始動そのものを自己ペナルティしない。投げの
      // 「即時補正20%」を単発投げに適用すると実測と食い違うことを確認）
      const isFirstHit = step === firstHit;
      const ownImmediate = isFirstHit ? undefined : parseImmediateScalingPercent(move.comboScaling);
      if (!isFirstHit && (ownImmediate != null || immediateOffset > 0)) {
        const totalOffset = immediateOffset + (ownImmediate ?? 0);
        percent -= totalOffset;
        appliedRules.push(`即時補正-${totalOffset}pt`);
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
      if (ownImmediate != null) immediateOffset += ownImmediate;
    }

    // 補正切り: 空振り/フェイントを伴わない場合もある（タゲコンの浮かせ直し等で
    // 相手が一度「ニュートラルに近い状態」へ戻り、真のコンボが終わるケース）。
    // その状況ノードに「補正切り」タグが付いていれば、次のパーツの前で段をリセットする。
    // 2026-09-13 オーナー実測（画面端補正切りコンボの全7ヒット + 補正切り後の
    // 中マネージュ・ドレ）で確認した。
    if (getSituation(route.to).tags.includes('補正切り')) {
      stage = 1;
      immediateOffset = 0;
      drApplied = false;
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
