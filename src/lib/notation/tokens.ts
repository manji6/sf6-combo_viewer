// numpad 正準表記のトークン定義とマッピング

export type ButtonStrength = 'L' | 'M' | 'H' | '';
export type ButtonKind = 'P' | 'K';

export interface DirectionsToken {
  kind: 'directions';
  dirs: number[]; // 1..9（テンキー）
  raw: string;
}

export interface ButtonToken {
  kind: 'button';
  strength: ButtonStrength;
  buttons: ButtonKind[]; // 通常1つ。PP/KK は2つ
  od: boolean; // OD（EX）
  text: string; // 「中P」など
  raw: string;
}

export interface ModifierToken {
  kind: 'modifier';
  type: 'jump' | 'neutraljump' | 'delay' | 'link' | 'cancel' | 'then' | 'hold' | 'repeat' | 'hits';
  value?: string;
  text: string;
  raw: string;
}

export interface MetaToken {
  kind: 'meta';
  type: 'DR' | 'DRC' | 'OD' | 'PC' | 'CH' | 'SA1' | 'SA2' | 'SA3';
  text: string;
  raw: string;
}

export interface NoteToken {
  kind: 'note';
  text: string;
  raw: string;
}

export interface TextToken {
  kind: 'text';
  text: string;
  raw: string;
}

export type Token =
  | DirectionsToken
  | ButtonToken
  | ModifierToken
  | MetaToken
  | NoteToken
  | TextToken;

/** テンキー方向 → 矢印の回転角（deg, 0 = 右向き）。5 は中立（null） */
export const DIRECTION_ANGLE: Record<number, number | null> = {
  1: 135,
  2: 90,
  3: 45,
  4: 180,
  5: null,
  6: 0,
  7: -135,
  8: -90,
  9: -45,
};

/** テンキー方向 → 矢印文字（テキスト表記用） */
export const DIRECTION_GLYPH: Record<number, string> = {
  1: '↙',
  2: '↓',
  3: '↘',
  4: '←',
  5: '・',
  6: '→',
  7: '↖',
  8: '↑',
  9: '↗',
};

export const STRENGTH_LABEL: Record<ButtonStrength, string> = {
  L: '弱',
  M: '中',
  H: '強',
  '': '',
};

/** 強度 → 色（CSS 変数名） */
export const STRENGTH_COLOR: Record<string, string> = {
  L: 'var(--btn-l)',
  M: 'var(--btn-m)',
  H: 'var(--btn-h)',
  OD: 'var(--btn-od)',
  '': 'var(--btn-none)',
};

export const META_LABEL: Record<MetaToken['type'], string> = {
  DR: 'DR',
  DRC: 'DRC',
  OD: 'OD',
  PC: 'PC',
  CH: 'CH',
  SA1: 'SA1',
  SA2: 'SA2',
  SA3: 'SA3',
};

export const META_FULL: Record<MetaToken['type'], string> = {
  DR: 'ドライブラッシュ',
  DRC: 'キャンセルドライブラッシュ',
  OD: 'オーバードライブ',
  PC: 'パニッシュカウンター',
  CH: 'カウンターヒット',
  SA1: 'スーパーアーツ1',
  SA2: 'スーパーアーツ2',
  SA3: 'スーパーアーツ3',
};
