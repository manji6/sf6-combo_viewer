import type { CharacterId } from './types';

export interface Character {
  id: CharacterId;
  name: string;
  nameEn: string;
  /** 一言紹介 */
  tagline: string;
  /** 相関グラフ・カードのアクセントカラー（CSS 変数値） */
  accent: string;
}

export const characters: Character[] = [
  {
    id: 'manon',
    name: 'マノン',
    nameEn: 'Manon',
    tagline: 'メダルを重ねて火力を上げる投げ・差し合いキャラ。デガジェ締めからの起き攻めが強力。',
    accent: '#d9a441',
  },
];

export const characterById = new Map<CharacterId, Character>(
  characters.map((c) => [c.id, c]),
);
