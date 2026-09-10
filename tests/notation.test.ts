import { describe, expect, it } from 'vitest';
import {
  commandToText,
  deriveModern,
  parseCommand,
  tokensToPlain,
} from '../src/lib/notation/parse';

describe('parseCommand', () => {
  it('方向連番をまとめて1トークンにする', () => {
    const t = parseCommand('236MP');
    expect(t[0]).toMatchObject({ kind: 'directions', dirs: [2, 3, 6] });
    expect(t[1]).toMatchObject({ kind: 'button' });
  });

  it('PP / KK は OD 扱い（od:true）', () => {
    const t = parseCommand('236KK');
    const btn = t.find((x) => x.kind === 'button');
    expect(btn).toMatchObject({ kind: 'button', od: true });
  });

  it('先頭 OD 接頭辞を次のボタンに適用する', () => {
    const t = parseCommand('OD236MP');
    const btn = t.find((x) => x.kind === 'button');
    expect(btn).toMatchObject({ od: true });
  });

  it('括弧内メモは note トークン、PC/CH は meta', () => {
    expect(parseCommand('(微歩き)')[0]).toMatchObject({ kind: 'note', text: '微歩き' });
    expect(parseCommand('(PC)')[0]).toMatchObject({ kind: 'meta', type: 'PC' });
  });

  it('DR / DRC / SA3 は meta トークン', () => {
    expect(parseCommand('DR')[0]).toMatchObject({ kind: 'meta', type: 'DR' });
    expect(parseCommand('DRC')[0]).toMatchObject({ kind: 'meta', type: 'DRC' });
    expect(parseCommand('SA3')[0]).toMatchObject({ kind: 'meta', type: 'SA3' });
  });

  it('ため [4] を hold 修飾子にする', () => {
    const t = parseCommand('[4]6HK');
    expect(t[0]).toMatchObject({ kind: 'modifier', type: 'hold', value: '4' });
  });

  it('AS ボタンを解釈できる', () => {
    const t = parseCommand('6AS SP');
    expect(t.filter((x) => x.kind === 'button')).toHaveLength(2);
  });
});

describe('commandToText', () => {
  it('236MP → テキスト表記', () => {
    expect(commandToText('236MP')).toContain('中P');
  });
  it('LPLK → 弱P 弱K', () => {
    const s = commandToText('LPLK');
    expect(s).toContain('弱P');
    expect(s).toContain('弱K');
  });
});

describe('deriveModern（フォールバック推定）', () => {
  it('通常技は P/K を落とす', () => {
    expect(deriveModern('5MP')).toBe('5M');
    expect(deriveModern('2MK')).toBe('2M');
    expect(deriveModern('4HP')).toBe('4H');
  });
  it('必殺技（方向3桁以上）は 方向+SP', () => {
    expect(deriveModern('236MP')).toBe('236SP');
    expect(deriveModern('214LK')).toBe('214SP');
  });
  it('OD 必殺技は 方向+AUTO+SP', () => {
    expect(deriveModern('236KK')).toBe('236AS SP');
  });
  it('SA（連続波動系）は 代表方向+SP+強（正確な方向は技辞典から）', () => {
    expect(deriveModern('236236P')).toBe('2SP H');
    expect(deriveModern('214214P')).toBe('2SP H');
  });
  it('すでにモダン表記ならそのまま', () => {
    expect(deriveModern('2SP')).toBe('2SP');
    expect(deriveModern('5M')).toBe('5M');
  });
  it('DR / DRC / ため はそのまま', () => {
    expect(deriveModern('DR')).toBe('DR');
    expect(deriveModern('[4]6HK')).toContain('[4]');
  });
});

describe('tokensToPlain', () => {
  it('記号を言葉にする（aria 用）', () => {
    const s = tokensToPlain(parseCommand('5MP > 236MP'));
    expect(s).toContain('キャンセル');
  });
});
