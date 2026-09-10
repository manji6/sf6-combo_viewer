import { describe, expect, it } from 'vitest';
import { validateAll } from '../src/lib/graph/derive';
import type { Combo, Move, Route, Situation } from '../src/data/types';

// 最小の正常データセット。個別のテストで一部を壊して検証を確認する。
function baseData(): {
  situations: Situation[];
  routes: Route[];
  combos: Combo[];
  moves: Move[];
} {
  const situations: Situation[] = [
    { id: 's_start', label: '始点', kind: 'neutral', position: 'midscreen', opponentState: 'neutral', tags: [] },
    { id: 's_end', label: '終点', kind: 'knockdown', position: 'midscreen', opponentState: 'knockdown_soft', tags: [] },
  ];
  const moves: Move[] = [
    {
      key: 'm_a',
      character: 'manon',
      name: '技A',
      category: 'normal',
      inputClassic: '5MP',
      inputModern: '5M',
      startup: 7,
      active: '7-10',
      recovery: '15',
      onHit: '+2',
      onBlock: '-2',
      cancel: 'C',
      damage: 600,
      verifiedVersion: 'test',
    },
  ];
  const routes: Route[] = [
    {
      id: 'r_a',
      character: 'manon',
      from: 's_start',
      to: 's_end',
      kind: 'combo_route',
      label: 'ルートA',
      steps: [{ move: '技A', command: '5MP', moveKey: 'm_a' }],
      resources: { driveCost: 0, superCost: 0, saLevel: null },
      damage: 600,
      difficulty: 1,
      controlType: 'both',
      tags: [],
    },
  ];
  const combos: Combo[] = [
    {
      slug: 'c_a',
      character: 'manon',
      name: 'コンボA',
      situationLabel: 'テスト',
      routeChain: ['r_a'],
      startFrom: 's_start',
      endAt: 's_end',
      difficulty: 1,
      tags: [],
    },
  ];
  return { situations, routes, combos, moves };
}

describe('validateAll（本番ダミーデータ）', () => {
  it('現行のダミーデータは検証エラーなし', () => {
    expect(validateAll()).toEqual([]);
  });
});

describe('validateAll（不正データ注入）', () => {
  it('正常な最小データセットはエラーなし', () => {
    expect(validateAll(baseData())).toEqual([]);
  });

  it('route.from が存在しない状況を指すとエラー', () => {
    const d = baseData();
    d.routes[0].from = 's_missing';
    expect(validateAll(d).some((e) => e.includes('s_missing'))).toBe(true);
  });

  it('route.steps が空だとエラー', () => {
    const d = baseData();
    d.routes[0].steps = [];
    expect(validateAll(d).some((e) => /steps.*空|空.*steps/.test(e))).toBe(true);
  });

  it('combo.routeChain が空だとエラー', () => {
    const d = baseData();
    d.combos[0].routeChain = [];
    expect(validateAll(d).some((e) => e.includes('routeChain'))).toBe(true);
  });

  it('ID 重複を検出する（route）', () => {
    const d = baseData();
    d.routes.push({ ...d.routes[0] });
    expect(validateAll(d).some((e) => /重複|duplicate/i.test(e))).toBe(true);
  });

  it('ID 重複を検出する（situation）', () => {
    const d = baseData();
    d.situations.push({ ...d.situations[0] });
    expect(validateAll(d).some((e) => /重複|duplicate/i.test(e))).toBe(true);
  });

  it('step.moveKey が技辞典に無いとエラー', () => {
    const d = baseData();
    d.routes[0].steps[0].moveKey = 'm_missing';
    expect(validateAll(d).some((e) => e.includes('m_missing'))).toBe(true);
  });

  it("route の character と combo の character が食い違うとエラー", () => {
    const d = baseData();
    // combo は manon、route を別キャラ扱いに（型上は 'manon' のみだが実データ移行後を想定して文字列比較）
    (d.routes[0] as { character: string }).character = 'other';
    expect(validateAll(d).some((e) => /character|キャラ/i.test(e))).toBe(true);
  });

  it("controlType:'both' なのに step のモダン入力が未確認（inputModern:null かつ手動指定なし）だと警告", () => {
    const d = baseData();
    d.moves[0].inputModern = null;
    // route は 'both' 宣言のまま、step に commandModern も無い
    expect(
      validateAll(d).some((e) => /モダン入力|inputModern|both/.test(e)),
    ).toBe(true);
  });

  it("action 付き step（技でない操作）は moveKey 不要でエラーにならない", () => {
    const d = baseData();
    d.routes[0].steps = [
      { move: '前ステップ', command: '66', action: 'dash' },
      { move: '技A', command: '5MP', moveKey: 'm_a' },
    ];
    expect(validateAll(d)).toEqual([]);
  });
});
