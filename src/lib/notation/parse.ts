import {
  META_LABEL,
  STRENGTH_LABEL,
  type ButtonKind,
  type ButtonStrength,
  type MetaToken,
  type Token,
} from './tokens';

// SP/AS（モダン）→ PP/KK → L?P など → 単独 P/K → 単独 L/M/H（モダンの弱中強攻撃）
const BUTTON_RE = /^(SP|AS|PP|KK|LP|MP|HP|LK|MK|HK|P|K|L|M|H)/;

function buttonText(strength: ButtonStrength, buttons: ButtonKind[], od: boolean): string {
  if (buttons.length === 2) return `${buttons[0]}${buttons[1]}`; // PP/KK
  const b = buttons[0];
  if (b === 'SP') return 'SP';
  if (b === 'AS') return 'AUTO';
  const s = STRENGTH_LABEL[strength];
  if (b === 'A') return `${s || ''}`.trim() || 'A'; // モダン攻撃（弱/中/強）
  return `${od ? 'OD' : ''}${s}${b ?? ''}`;
}

/**
 * numpad 正準表記の文字列をトークン列へ分解する。
 * 例: "236MP", "OD236KK", "4MK~MK", "[4]6HK", "DRC", "(様子見)"
 */
export function parseCommand(input: string): Token[] {
  const tokens: Token[] = [];
  let s = input.trim();
  let od = false; // 直後のボタンに適用する OD フラグ

  while (s.length > 0) {
    // 空白
    const ws = s.match(/^\s+/);
    if (ws) {
      s = s.slice(ws[0].length);
      continue;
    }

    // 括弧内メモ / メタ
    const paren = s.match(/^\(([^)]*)\)/);
    if (paren) {
      const inner = paren[1].trim();
      const upper = inner.toUpperCase();
      if (upper === 'PC' || upper === 'CH') {
        tokens.push({ kind: 'meta', type: upper as MetaToken['type'], text: META_LABEL[upper as MetaToken['type']], raw: paren[0] });
      } else {
        tokens.push({ kind: 'note', text: inner, raw: paren[0] });
      }
      s = s.slice(paren[0].length);
      continue;
    }

    // ため [4] など
    const hold = s.match(/^\[([1-9])\]/);
    if (hold) {
      tokens.push({ kind: 'modifier', type: 'hold', value: hold[1], text: `[${hold[1]}]`, raw: hold[0] });
      s = s.slice(hold[0].length);
      continue;
    }

    // 連結記号
    if (s.startsWith('~')) {
      tokens.push({ kind: 'modifier', type: 'link', text: '~', raw: '~' });
      s = s.slice(1);
      continue;
    }
    if (s.startsWith('xx')) {
      tokens.push({ kind: 'modifier', type: 'cancel', text: 'xx', raw: 'xx' });
      s = s.slice(2);
      continue;
    }
    if (s.startsWith('>')) {
      tokens.push({ kind: 'modifier', type: 'cancel', text: '>', raw: '>' });
      s = s.slice(1);
      continue;
    }
    if (s.startsWith(',')) {
      tokens.push({ kind: 'modifier', type: 'then', text: ',', raw: ',' });
      s = s.slice(1);
      continue;
    }

    // ジャンプ / ディレイ
    const dl = s.match(/^dl\./i);
    if (dl) {
      tokens.push({ kind: 'modifier', type: 'delay', text: 'dl.', raw: dl[0] });
      s = s.slice(dl[0].length);
      continue;
    }
    const nj = s.match(/^nj\./i);
    if (nj) {
      tokens.push({ kind: 'modifier', type: 'neutraljump', text: 'nj.', raw: nj[0] });
      s = s.slice(nj[0].length);
      continue;
    }
    const jp = s.match(/^j\./i);
    if (jp) {
      tokens.push({ kind: 'modifier', type: 'jump', text: 'j.', raw: jp[0] });
      s = s.slice(jp[0].length);
      continue;
    }

    // 繰り返し x2 など
    const rep = s.match(/^x(\d+)/i);
    if (rep) {
      tokens.push({ kind: 'modifier', type: 'repeat', value: rep[1], text: `x${rep[1]}`, raw: rep[0] });
      s = s.slice(rep[0].length);
      continue;
    }

    // メタ（大文字トークン）
    const drc = s.match(/^(DRC|CDR)/);
    if (drc) {
      tokens.push({ kind: 'meta', type: 'DRC', text: META_LABEL.DRC, raw: drc[0] });
      s = s.slice(drc[0].length);
      continue;
    }
    const dr = s.match(/^DR(?![A-Za-z])/);
    if (dr) {
      tokens.push({ kind: 'meta', type: 'DR', text: META_LABEL.DR, raw: dr[0] });
      s = s.slice(2);
      continue;
    }
    const sa = s.match(/^SA([123])/);
    if (sa) {
      const t = `SA${sa[1]}` as MetaToken['type'];
      tokens.push({ kind: 'meta', type: t, text: META_LABEL[t], raw: sa[0] });
      s = s.slice(sa[0].length);
      continue;
    }
    const od0 = s.match(/^OD/);
    if (od0) {
      od = true;
      s = s.slice(2);
      continue;
    }
    const pc = s.match(/^PC(?![A-Za-z])/);
    if (pc) {
      tokens.push({ kind: 'meta', type: 'PC', text: META_LABEL.PC, raw: pc[0] });
      s = s.slice(2);
      continue;
    }
    const ch = s.match(/^CH(?![A-Za-z])/);
    if (ch) {
      tokens.push({ kind: 'meta', type: 'CH', text: META_LABEL.CH, raw: ch[0] });
      s = s.slice(2);
      continue;
    }

    // 方向連番
    const dirs = s.match(/^[1-9]+/);
    if (dirs) {
      tokens.push({
        kind: 'directions',
        dirs: dirs[0].split('').map((d) => Number(d)),
        raw: dirs[0],
      });
      s = s.slice(dirs[0].length);
      continue;
    }

    // ボタン
    const btn = s.match(BUTTON_RE);
    if (btn) {
      const raw = btn[1];
      let strength: ButtonStrength = '';
      let buttons: ButtonKind[] = [];
      if (raw === 'PP') buttons = ['P', 'P'];
      else if (raw === 'KK') buttons = ['K', 'K'];
      else if (raw === 'SP') buttons = ['SP'];
      else if (raw === 'AS') buttons = ['AS'];
      else if (raw === 'L' || raw === 'M' || raw === 'H') {
        strength = raw as ButtonStrength;
        buttons = ['A']; // モダンの弱中強攻撃
      } else if (raw.length === 2) {
        strength = raw[0] as ButtonStrength;
        buttons = [raw[1] as ButtonKind];
      } else {
        buttons = [raw as ButtonKind];
      }
      const isOd = od || raw === 'PP' || raw === 'KK';
      tokens.push({
        kind: 'button',
        strength,
        buttons,
        od: isOd,
        text: buttonText(strength, buttons, od),
        raw,
      });
      od = false;
      s = s.slice(raw.length);
      continue;
    }

    // それ以外は 1 文字ずつテキストとして拾う
    tokens.push({ kind: 'text', text: s[0], raw: s[0] });
    s = s.slice(1);
  }

  return tokens;
}

/** トークン列をテキスト表記の文字列へ戻す（「236中P」など） */
export function tokensToText(tokens: Token[]): string {
  return tokens
    .map((t) => {
      switch (t.kind) {
        case 'directions':
          return t.raw;
        case 'button':
          return t.text;
        case 'meta':
          return ` ${t.text} `;
        case 'note':
          return `（${t.text}）`;
        case 'modifier':
          if (t.type === 'cancel') return ' > ';
          if (t.type === 'then') return ' ';
          if (t.type === 'link') return '~';
          return t.text;
        default:
          return t.text;
      }
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** aria-label / タイトル用の簡潔な読み上げテキスト（記号は言葉に） */
export function tokensToPlain(tokens: Token[]): string {
  return tokens
    .map((t) => {
      if (t.kind === 'modifier') {
        if (t.type === 'cancel') return 'キャンセル';
        if (t.type === 'link') return 'から';
        if (t.type === 'then') return '';
        return t.text;
      }
      if (t.kind === 'directions') return t.raw;
      return t.text;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function commandToText(input: string): string {
  return tokensToText(parseCommand(input));
}

/**
 * クラシックのコマンドからモダンのコマンドを推定する（commandModern 未指定時のフォールバック）。
 *  - 通常技: 方向 + 弱中強（P/K を落とす）  例 5MP → 5M, 2MK → 2M, 4HP → 4H
 *  - 必殺技: 方向連番 3 桁以上 → 方向 + SP    例 236MP → 236SP, 214LK → 214SP
 *  - OD 必殺技: 方向 + AUTO + SP           例 236KK → 236AS SP
 *  - SA: 方向 + SP + 強                     例 236236P → 236SP H
 *  - DR / DRC / PC / CH / DI / ため / j. などはそのまま
 * 正確なモダン入力は技辞典（moves.inputModern）から。これはそれが無い技の粗い推定。
 */
export function deriveModern(classic: string): string {
  let s = classic.trim();
  if (/\b(SP|AS)\b/.test(s) || /[1-9](L|M|H)(?![PK])/.test(s)) return s; // すでにモダン表記

  // SA（連続波動・昇龍系）
  s = s.replace(/(236236|214214|632146)([LMH]?)([PK]|PP|KK)/g, (_m, motion) => `${motion}SP H`);
  // OD 必殺技（方向 3 桁以上 ＋ PP/KK）
  s = s.replace(/([1-9]{3,})(PP|KK)/g, (_m, motion) => `${motion}AS SP`);
  // 必殺技（方向 3 桁以上）
  s = s.replace(/([1-9]{3,})([LMH]?)([PK])/g, (_m, motion) => `${motion}SP`);
  // 通常技（方向 0〜2 桁 ＋ 弱中強 ＋ P/K）
  s = s.replace(/(\bj\.)?([1-9]{0,2})([LMH])([PK])/g, (_m, jp, dir, str) => `${jp ?? ''}${dir}${str}`);
  return s;
}
