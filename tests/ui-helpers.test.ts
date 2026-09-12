import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/data', () => import('./fixtures/data'));

import { stepModernCommand } from '../src/data';
import {
  frameAdvLabel,
  parseAdvantage,
  situationAdvantageText,
  stepActionLabel,
  wakeupSummary,
} from '../src/lib/ui';

describe('wakeupSummary', () => {
  it('coverage を先頭に、その場/後ろを併記', () => {
    expect(
      wakeupSummary({ coverage: 'both', quickRise: '密着', backTech: '半歩足す' }),
    ).toBe('両対応／その場: 密着・後ろ: 半歩足す');
  });
  it('note があれば note を使う', () => {
    expect(wakeupSummary({ coverage: 'both', note: '受け身なし' })).toBe('両対応（受け身なし）');
  });
  it('quick のみ', () => {
    expect(wakeupSummary({ coverage: 'quick', quickRise: '密着' })).toBe('その場受け身のみ／その場: 密着');
  });
  it('undefined は undefined', () => {
    expect(wakeupSummary(undefined)).toBeUndefined();
  });
});

describe('frameAdvLabel', () => {
  it('数値に F を付ける', () => {
    expect(frameAdvLabel({ frames: '+2' })).toBe('+2F');
    expect(frameAdvLabel({ frames: '±0' })).toBe('±0F');
    expect(frameAdvLabel({ frames: '-8' })).toBe('-8F');
  });
  it('withNote で条件を括弧書き', () => {
    expect(frameAdvLabel({ frames: '+2', note: '2中K持続当て' }, { withNote: true })).toBe(
      '+2F（2中K持続当て）',
    );
  });
  it('note があっても withNote 無しなら数値だけ', () => {
    expect(frameAdvLabel({ frames: '+2', note: 'x' })).toBe('+2F');
  });
  it('undefined は undefined', () => {
    expect(frameAdvLabel(undefined)).toBeUndefined();
  });
});

describe('stepActionLabel', () => {
  it('action なしは move 名', () => {
    expect(stepActionLabel({ move: '2中K', command: '2MK' })).toBe('2中K');
  });
  it('dash は固定ラベル', () => {
    expect(stepActionLabel({ move: '前ステップ', command: '66', action: 'dash' })).toBe('前ステップ');
  });
  it('whiff は「<技名> 空振り」', () => {
    expect(stepActionLabel({ move: '5弱P', command: '5LP', action: 'whiff' })).toBe('5弱P 空振り');
  });
});

describe('stepModernCommand（優先順位）', () => {
  it('明示 commandModern が最優先', () => {
    expect(
      stepModernCommand({ move: 'x', command: '5MP', commandModern: '5L', moveKey: 'manon-5mp' }),
    ).toBe('5L');
  });
  it('明示なしなら技辞典 inputModern', () => {
    expect(stepModernCommand({ move: 'x', command: '5MP', moveKey: 'manon-5mp' })).toBe('5M');
  });
  it('どちらも無ければ undefined（呼び出し側で deriveModern にフォールバック）', () => {
    expect(stepModernCommand({ move: 'x', command: 'DR' })).toBeUndefined();
  });
  it('inputModern:null でも inputModernPrecise があればそれを使う（R01 回帰）', () => {
    // manon-rondpoint-l は inputModern: null, inputModernPrecise: "236L"。
    // 以前は undefined を返し、呼び出し側の deriveModern が "236SP" に汎用変換していた。
    expect(
      stepModernCommand({ move: 'x', command: '236LK', moveKey: 'manon-rondpoint-l' }),
    ).toBe('236L');
  });
  it('inputModern:null かつ inputModernPrecise も無ければ undefined（非対応）', () => {
    expect(
      stepModernCommand({ move: 'x', command: '236HK', moveKey: 'manon-test-classic-only' }),
    ).toBeUndefined();
  });
});

describe('parseAdvantage / situationAdvantageText（R03 回帰）', () => {
  it('数値フレームと自由記述を区別する', () => {
    expect(parseAdvantage('+8')).toEqual({ frame: '+8', basis: undefined, note: undefined });
    expect(parseAdvantage('パニカン誘発')).toEqual({ freeform: 'パニカン誘発' });
  });
  it('括弧の注記・前置の測定条件を取り出す', () => {
    expect(parseAdvantage('+3（連続ガード）')).toEqual({
      frame: '+3',
      basis: undefined,
      note: '連続ガード',
    });
    expect(parseAdvantage('前ステ後 +3')).toEqual({ frame: '+3', basis: '前ステ後', note: undefined });
  });
  it('「メダル獲得 +1」のような報酬は reward 側の責務（advantage には置かない運用）', () => {
    // parseAdvantage 自体は数値の形があれば frame として解析するので reward/advantage の
    // 切り分けはデータ側（schema.reward）で行う。ここでは解析結果自体の形を確認するのみ。
    expect(parseAdvantage('メダル獲得 +1')?.frame).toBe('+1');
  });
  it('knockdown/okiStart は基準の明記が無ければ「相手復帰まで」を補う', () => {
    expect(situationAdvantageText({ kind: 'knockdown', advantage: '+8' })).toBe('相手復帰まで +8');
    expect(situationAdvantageText({ kind: 'okiStart', advantage: '+5' })).toBe('相手復帰まで +5');
  });
  it('基準が明記されていればそれを使い、二重に補わない', () => {
    expect(situationAdvantageText({ kind: 'knockdown', advantage: '前ステ後 +3' })).toBe(
      '前ステ後 +3',
    );
  });
  it('knockdown/okiStart 以外は基準を補わず数値のみ', () => {
    expect(situationAdvantageText({ kind: 'neutral', advantage: '±0' })).toBe('±0');
    expect(situationAdvantageText({ kind: 'blockstring', advantage: '+3（連続ガード）' })).toBe(
      '+3（連続ガード）',
    );
  });
  it('自由記述はそのまま表示する（相手復帰まで等を付けない）', () => {
    expect(situationAdvantageText({ kind: 'knockdown', advantage: '起き上がりに重ね' })).toBe(
      '起き上がりに重ね',
    );
  });
  it('advantage 無指定は undefined', () => {
    expect(situationAdvantageText({ kind: 'knockdown', advantage: undefined })).toBeUndefined();
  });
});
