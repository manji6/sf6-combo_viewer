import { describe, expect, it, vi } from 'vitest';

// src/content は実データ専用。ダメージ計算エンジンの回帰テストは tests/fixtures の
// 旧ダミーデータ（graph.test.ts 等と同じもの）で回す。
vi.mock('../src/data', () => import('./fixtures/data'));

import { getCombo } from '../src/data';
import { calculateComboDamage } from '../src/lib/damage/calculate';
import {
  CANDIDATE_RULESET_2026_09,
  parseMinGuaranteePercent,
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

describe('calculateComboDamage', () => {
  it('DR 無しの3ヒットコンボ: 各ヒットが段どおりの残存率で計算される', () => {
    const combo = getCombo('manon-mid-2mk-bnb-degage');
    const result = calculateComboDamage(combo);
    expect(result.status).toBe('calculated');
    expect(result.issues).toEqual([]);
    // 2中K(600,100%) + 中P(600,100%) + 弱デガジェ(1000,80%=800) = 2000
    expect(result.hits.map((h) => h.damage)).toEqual([600, 600, 800]);
    expect(result.totalDamage).toBe(2000);
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
});
