import { describe, expect, it, vi } from 'vitest';

// src/content は実データ専用。ダメージ計算エンジンの回帰テストは tests/fixtures の
// 旧ダミーデータ（graph.test.ts 等と同じもの）で回す。
vi.mock('../src/data', () => import('./fixtures/data'));

import { getCombo } from '../src/data';
import { calculateComboDamage } from '../src/lib/damage/calculate';
import {
  CANDIDATE_RULESET_2026_09,
  parseImmediateScalingPercent,
  parseMinGuaranteePercent,
  parseStarterScalingPercent,
  scalingPercentForStage,
} from '../src/lib/damage/ruleset';

describe('scalingPercentForStage', () => {
  it('候補テーブル通りに段の残存率を返す', () => {
    expect(scalingPercentForStage(CANDIDATE_RULESET_2026_09, 1)).toBe(100);
    expect(scalingPercentForStage(CANDIDATE_RULESET_2026_09, 2)).toBe(100);
    expect(scalingPercentForStage(CANDIDATE_RULESET_2026_09, 3)).toBe(80);
  });
  it('テーブルの範囲を超えたら下限値（10%）を使う', () => {
    expect(scalingPercentForStage(CANDIDATE_RULESET_2026_09, 20)).toBe(10);
  });
});

describe('parseMinGuaranteePercent', () => {
  it('「最低保障30%」「最低保証30%」のどちらの表記も読み取る', () => {
    expect(parseMinGuaranteePercent('最低保障30%')).toBe(30);
    expect(parseMinGuaranteePercent('最低保証50%。立ち強Pからのキャンセル時のみ即時補正15%')).toBe(50);
  });
  it('記載が無ければ undefined', () => {
    expect(parseMinGuaranteePercent(undefined)).toBeUndefined();
    expect(parseMinGuaranteePercent('特になし')).toBeUndefined();
  });
});

describe('parseStarterScalingPercent / parseImmediateScalingPercent', () => {
  it('「始動補正20%」「即時補正10%」を読み取る', () => {
    expect(parseStarterScalingPercent('始動補正20%')).toBe(20);
    expect(parseImmediateScalingPercent('即時補正10%')).toBe(10);
  });
  it('両方併記（グランフェッテ等）でもそれぞれ読み取れる', () => {
    expect(parseStarterScalingPercent('始動補正20% / 即時補正10%')).toBe(20);
    expect(parseImmediateScalingPercent('始動補正20% / 即時補正10%')).toBe(10);
  });
  it('記載が無ければ undefined', () => {
    expect(parseStarterScalingPercent(undefined)).toBeUndefined();
    expect(parseImmediateScalingPercent('コンボ補正20%')).toBeUndefined();
  });
});

describe('calculateComboDamage', () => {
  it('始動技（2中K）は「始動補正20%」を持つため、段が1つ前進した状態で計算される', () => {
    const combo = getCombo('manon-mid-2mk-bnb-degage');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    expect(result.issues).toEqual([]);
    // 2中K(600,stage2=100%)=600 → 中P(600,stage3=80%)=480 → 弱デガジェ(1000,stage4=70%)=700
    expect(result.hits.map((h) => h.damage)).toEqual([600, 480, 700]);
    expect(result.totalDamage).toBe(1780);
  });

  it('DRC を挟むと以降のヒットに 0.85 倍が掛かる（重ね掛けしない）', () => {
    const combo = getCombo('manon-mid-5mp-drc-ranversement');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    // 中P(600,100%)=600 → DRC → 2中P(600,100%*0.85=85%)=510
    // → 4強P(800,80%*0.85=68%)=544 → 中ランヴェルセ(1400,70%*0.85=59.5→59%)=826
    expect(result.hits.map((h) => h.damage)).toEqual([600, 510, 544, 826]);
    expect(result.totalDamage).toBe(2480);
    // DR 由来の行にだけ DR 表記が付く
    expect(result.hits[0].appliedRules.some((r) => r.includes('DR'))).toBe(false);
    expect(result.hits[1].appliedRules.some((r) => r.includes('DR'))).toBe(true);
  });

  it('「始動補正」を持つ技が始動なら段が1つ前進した状態（stage=2）から始まる（弱P、2026-09-13 オーナー実測で確認）', () => {
    const combo = getCombo('manon-test-light-starter');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    // 弱P(300,stage2=100%)=300 → 弱デガジェ(1000,stage3=80%)=800
    expect(result.hits[0].stage).toBe(2);
    expect(result.hits.map((h) => h.damage)).toEqual([300, 800]);
    expect(result.totalDamage).toBe(1100);
  });

  it('「即時補正」はコンボ最初のヒットには適用しない（単発投げで確認）', () => {
    // manon-throw は comboScaling: "即時補正20%" を持つが、単発（コンボの最初で
    // 唯一のヒット）にまで自己ペナルティを掛けると実測（1200そのまま）と食い違う。
    const combo = getCombo('manon-test-throw-only');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    expect(result.hits.map((h) => h.damage)).toEqual([1200]);
    expect(result.hits[0].appliedRules.some((r) => r.includes('即時補正'))).toBe(false);
  });

  it('空振り/フェイントを伴わない補正切りも、situation の「補正切り」タグでリセットする', () => {
    // タゲコンの浮かせ直し等、action:'whiff'|'feint' を伴わずにコンボが切れるケース
    // （2026-09-13 オーナー実測: 画面端補正切りコンボの全7ヒットで確認）。
    const combo = getCombo('manon-test-hoseigiri-reset');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    // 中P(600,stage1=100%) → 中P(600,stage2=100%) →[補正切りタグでリセット]→
    // 中P(600,stage1=100%、リセットされていなければ stage3=80%=480 になるはず)
    expect(result.hits.map((h) => h.damage)).toEqual([600, 600, 600]);
    expect(result.hits[2].stage).toBe(1);
    expect(result.totalDamage).toBe(1800);
  });

  it('SA最低保証はDR等で下がった後の下限として働き、ロン・ポワンからのキャンセルSA3は固定+50される', () => {
    // 2026-09-13 オーナー実測（弱ロン・ポワン→SA3、DR併用）で確認:
    // SA3自体は段6=table50%×DR0.85=42.5%→42%だが、最低保証50%の方が高いので
    // 50%が採用され（保証はDR後の下限）、さらにロン・ポワンからのキャンセル
    // ボーナス+50が乗る。
    const combo = getCombo('manon-test-sa3-rondpoint-cancel');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    const sa3Hit = result.hits[result.hits.length - 1];
    expect(sa3Hit.moveKey).toBe('manon-sa3');
    expect(sa3Hit.finalPercent).toBe(50);
    expect(sa3Hit.damage).toBe(2050); // 4000×50% + 50
    expect(sa3Hit.appliedRules.join(' ')).toContain('SA最低保証50%');
    expect(sa3Hit.appliedRules.join(' ')).toContain('SA3即時補正+50');
  });

  it('パニッシュカウンター（PC）は基礎ダメージに ×1.2（2026-09-13 オーナー実測、強K/強P/DIの3例で確認）', () => {
    const combo = getCombo('manon-test-pc-bonus');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    // 中P(600) の PC ボーナス: 600×1.2=720、stage1=100% のまま
    expect(result.hits[0].baseDamage).toBe(720);
    expect(result.hits[0].damage).toBe(720);
    expect(result.hits[0].appliedRules.some((r) => r.includes('PC×'))).toBe(true);
  });

  it('「コンボ補正」は始動補正と同種だが始動技以外でも発動し、自分自身には掛からない（manon-tanlie で確認）', () => {
    const combo = getCombo('manon-test-combo-correction');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    // 中P(600,stage1=100%)=600 → コンボ補正技(600,stage2=100%、自身は前進の影響なし)=600
    // → 中P(600, 本来なら stage3=80%=480 のはずが、直前の技のコンボ補正で
    //   1段前進した stage4=70%=420 になる)
    expect(result.hits.map((h) => h.damage)).toEqual([600, 600, 420]);
    expect(result.hits[2].stage).toBe(4);
    expect(result.totalDamage).toBe(1620);
  });

  describe('controlType: modern（2026-09-13 追加。SPボタン簡易入力のダメージ減衰）', () => {
    it('inputModern が inputClassic と異なる技（簡易入力の代替手段がある）は modern で ×0.8', () => {
      const combo = getCombo('manon-test-modern-shortcut');
      const classic = calculateComboDamage(combo, CANDIDATE_RULESET_2026_09, 'classic');
      const modern = calculateComboDamage(combo, CANDIDATE_RULESET_2026_09, 'modern');
      expect(classic.hits[0].damage).toBe(2000);
      expect(modern.status).toBe('calculated');
      expect(modern.hits[0].damage).toBe(1600); // 2000×0.8（公式フレームデータの弱マネージュ・ドレと同じ比率）
      expect(modern.hits[0].appliedRules.some((r) => r.includes('モダン簡易入力×0.8'))).toBe(true);
    });

    it('classic を明示的に指定した場合は減衰しない（デフォルトも classic のまま）', () => {
      const combo = getCombo('manon-test-modern-shortcut');
      const withoutArg = calculateComboDamage(combo);
      expect(withoutArg.hits[0].damage).toBe(2000);
    });

    it('inputModern が inputClassic と同一（簡易入力の代替手段が無い）技は modern でも減衰しない', () => {
      const combo = getCombo('manon-test-modern-same-input');
      const modern = calculateComboDamage(combo, CANDIDATE_RULESET_2026_09, 'modern');
      expect(modern.status).toBe('calculated');
      expect(modern.hits[0].damage).toBe(1000);
      expect(modern.hits[0].appliedRules.some((r) => r.includes('モダン簡易入力'))).toBe(false);
    });

    it('special/super で inputModern が未確認（null）の技は modern 計算で「不明」issue になり、結果から除外される', () => {
      const combo = getCombo('manon-test-sa3-rondpoint-cancel');
      const modern = calculateComboDamage(combo, CANDIDATE_RULESET_2026_09, 'modern');
      expect(modern.status).toBe('incomplete');
      expect(modern.issues.some((i) => i.code === 'missing_modern_input' && i.moveKey === 'manon-sa3')).toBe(
        true,
      );
      expect(modern.hits.some((h) => h.moveKey === 'manon-sa3')).toBe(false);
    });
  });
});
