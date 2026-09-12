import { describe, expect, it, vi } from 'vitest';

// src/content は実データ専用（現状ほぼ空）。テストは tests/fixtures の旧ダミーで回す。
vi.mock('../src/data', () => import('./fixtures/data'));

import { combos, getCombo, getRoute } from '../src/data';
import {
  comboStarterMove,
  comboSupportsModern,
  flattenCombo,
  validateComboChain,
} from '../src/lib/graph/derive';
import { buildComboFlow, buildSituationFlow } from '../src/lib/graph/flow';

describe('comboSupportsModern（RV-01 回帰）', () => {
  it('本線に controlType:"classic" のパーツを含むコンボは false（一部の手にモダン入力があっても）', () => {
    // manon-punish-5hp-rondpoint は route_pc_5hp_rondpoint（classic）を含む。
    // かつ先頭 starter の 5強P にはモダン入力（5H）がある。
    const c = getCombo('manon-punish-5hp-rondpoint');
    expect(comboSupportsModern(c)).toBe(false);
    // flattenCombo の supportsModern も同じ結果
    expect(flattenCombo(c).supportsModern).toBe(false);
  });

  it('本線が全パーツ both のコンボは true', () => {
    const c = getCombo('manon-mid-5mp-drc-ranversement');
    expect(comboSupportsModern(c)).toBe(true);
    expect(flattenCombo(c).supportsModern).toBe(true);
  });

  it('空の routeChain は false（every の空集合 true を防ぐ）', () => {
    expect(
      comboSupportsModern({
        slug: 'x',
        character: 'manon',
        name: 'x',
        situationLabel: 'x',
        routeChain: [],
        startFrom: 's',
        endAt: 's',
        difficulty: 1,
        tags: [],
      }),
    ).toBe(false);
  });

  it('全コンボで comboSupportsModern と flattenCombo.supportsModern が一致する', () => {
    for (const c of combos) {
      expect(flattenCombo(c).supportsModern).toBe(comboSupportsModern(c));
    }
  });
});

describe('flattenCombo', () => {
  it('全ダミーコンボの routeChain が連続している', () => {
    for (const c of combos) {
      expect(validateComboChain(c)).toEqual([]);
    }
  });

  it('合計ダメージはパーツ damage の和（override 無しのとき）', () => {
    // R12: 以前は totalDamage が誤って 1 になっても通る弱いテストだった（実際には
    // step 数と正値であることしか確認していなかった）。route.damage の和との一致を検査する。
    const c = getCombo('manon-mid-2mk-bnb-degage');
    expect(c.damageOverride ?? null).toBeNull(); // override 無しの前提を明示
    const flat = flattenCombo(c);
    const expected = c.routeChain.map(getRoute).reduce((sum, r) => sum + r.damage, 0);
    expect(flat.totalDamage).toBe(expected);
  });

  it('damageOverride があればそちらを優先する', () => {
    const c = combos.find((x) => x.damageOverride != null);
    if (!c) return; // fixture に override 付きが無ければスキップ
    expect(flattenCombo(c).totalDamage).toBe(c.damageOverride);
  });

  it('action（whiff/feint 等）は flatten 後も失われない（R02 回帰）', () => {
    const inline = {
      slug: 'x',
      character: 'manon' as const,
      name: 'x',
      situationLabel: 'x',
      routeChain: ['oki_wait_from_degage_light'],
      startFrom: 'kd_after_degage_light_mid',
      endAt: 'neutral_mid_plus',
      difficulty: 1,
      tags: [],
    };
    const flat = flattenCombo(inline);
    expect(flat.steps[0].action).toBe('walk_back');
  });

  it('nodePath は startFrom で始まり endAt で終わる', () => {
    for (const c of combos) {
      const flat = flattenCombo(c);
      expect(flat.nodePath[0]).toBe(c.startFrom);
      expect(flat.nodePath[flat.nodePath.length - 1]).toBe(c.endAt);
    }
  });
});

describe('comboStarterMove（RV-06）', () => {
  it('先頭パーツの最初の技を返す', () => {
    expect(comboStarterMove(getCombo('manon-mid-2mk-bnb-degage'))?.label).toBe('2中K');
    expect(comboStarterMove(getCombo('manon-mid-5mp-drc-ranversement'))?.label).toBe('中P');
    expect(comboStarterMove(getCombo('manon-punish-5hp-rondpoint'))?.label).toBe('5強P');
  });
  it('全ダミーコンボで始動技が解決できる', () => {
    for (const c of combos) {
      expect(comboStarterMove(c)).not.toBeNull();
    }
  });
});

describe('buildComboFlow', () => {
  it('start ノードから始まり、step / outcome ノードを含む', () => {
    const g = buildComboFlow('manon-mid-5mp-drc-ranversement', 'classic');
    expect(g.nodes.some((n) => n.type === 'start')).toBe(true);
    expect(g.nodes.some((n) => n.type === 'step')).toBe(true);
    expect(g.nodes.some((n) => n.type === 'outcome')).toBe(true);
    expect(g.edges.length).toBeGreaterThan(0);
  });

  it('モダン版は controlType:"classic" のパーツ（グループ）を含まない', () => {
    // manon-mid-2mk-bnb-degage の締めダウンから oki_dr_enhaut_from_degage_light（classic）が扇状展開される
    const classic = buildComboFlow('manon-mid-2mk-bnb-degage', 'classic');
    const modern = buildComboFlow('manon-mid-2mk-bnb-degage', 'modern');
    const hasEnhaut = (g: ReturnType<typeof buildComboFlow>) =>
      g.groups.some((gr) => gr.routeId === 'oki_dr_enhaut_from_degage_light');
    expect(hasEnhaut(classic)).toBe(true);
    expect(hasEnhaut(modern)).toBe(false);
  });

  it('同じノード id は重複しない', () => {
    const g = buildComboFlow('manon-mid-5mp-drc-ranversement', 'classic');
    const ids = g.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildSituationFlow（再帰・打ち切り）', () => {
  it('起点から起き攻めの択が扇状展開される', () => {
    const g = buildSituationFlow('kd_after_degage_light_mid', 'classic');
    const okiGroups = g.groups.filter((gr) => gr.variant === 'okizeme');
    expect(okiGroups.length).toBeGreaterThanOrEqual(3);
  });

  it('深さ上限を超えると more フラグで打ち切る（無限再帰しない）', () => {
    const g = buildSituationFlow('kd_after_degage_light_mid', 'classic');
    // ノード数が有限（爆発しない）
    expect(g.nodes.length).toBeLessThan(200);
    // loop / repeat / more のいずれかで閉じている outcome がある
    expect(g.nodes.some((n) => n.loop || n.repeat || n.more)).toBe(true);
  });

  it('okizeme グループに整形済みの有利フレーム（"+2F" 形式）が載る', () => {
    const g = buildSituationFlow('kd_after_degage_light_mid', 'classic');
    const withFrame = g.groups.find((gr) => gr.frameAdvantage);
    expect(withFrame?.frameAdvantage).toMatch(/F$/);
  });
});
