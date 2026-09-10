// batch1: すこれるブログ https://www.sukoreru.com/sf6-manon をもとにした
// コア6コンボ ＋ 弱デガジェ〆の起き攻め。drafts/ に <collection>__<id>.json を書く。
// フレームは公式（streetfighter.com/6/ja-jp/character/manon/frame）。
// 合計ダメージは各技の素点合計（補正前の目安）。難易度は推定。
//
// `npx vite-node scripts/gen-drafts-batch1.ts`
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const draftsDir = join(root, 'drafts');
mkdirSync(draftsDir, { recursive: true });

const VER = 'Year3（公式フレームデータ参照。パッチ版数未確認）';
const SRC = '出典: すこれるブログ（sukoreru.com/sf6-manon）。合計ダメージは各技の素点合計＝補正前の目安。難易度は推定。';

/* eslint-disable @typescript-eslint/no-explicit-any */
const files: Record<string, any> = {};
const add = (coll: string, id: string, data: any) => {
  files[`${coll}__${id}`] = data;
};

// ── moves（公式フレームデータ） ──────────────────────────────
const mv = (o: any) => ({ character: 'manon', verifiedVersion: VER, ...o });

add('moves', 'manon-5lp', mv({
  key: 'manon-5lp', name: '立ち弱P（ハジメ）', category: 'normal',
  inputClassic: '5LP', inputModern: '5L',
  startup: 4, active: '4-6', recovery: '10', onHit: '+4', onBlock: '-1', cancel: 'C', damage: 300,
  comboScaling: '始動補正20%', driveGainHit: 250, driveLossBlock: -500, driveLossPunishCounter: -2000, superGain: 300,
  attribute: ['上'], notes: '連打キャンセル対応',
}));
add('moves', 'manon-5lk', mv({
  key: 'manon-5lk', name: '立ち弱K（タンジュ）', category: 'normal',
  inputClassic: '5LK', inputModern: '5L',
  startup: 5, active: '5-6', recovery: '12', onHit: '+2', onBlock: '-2', cancel: 'C', damage: 300,
  comboScaling: '始動補正20%', driveGainHit: 250, driveLossBlock: -500, driveLossPunishCounter: -2000, superGain: 300,
  attribute: ['上'], notes: '弱K で最長クラスのリーチ。弱K>CDR でコンボに行ける。モダンの弱攻撃割り当ては要検証',
}));
add('moves', 'manon-5mp', mv({
  key: 'manon-5mp', name: '立ち中P（ツリテ）', category: 'normal',
  inputClassic: '5MP', inputModern: '5M',
  startup: 7, active: '7-10', recovery: '15', onHit: '+2', onBlock: '-2', cancel: 'C', damage: 600,
  driveGainHit: 1500, driveLossBlock: -3000, driveLossPunishCounter: -4000, superGain: 500,
  attribute: ['上'], notes: '主力牽制。中P>CDR>2中P は連続ガード＋3F有利',
}));
add('moves', 'manon-2mp', mv({
  key: 'manon-2mp', name: 'しゃがみ中P（ヒキテ）', category: 'normal',
  inputClassic: '2MP', inputModern: '2M',
  startup: 7, active: '7-9', recovery: '11', onHit: '+6', onBlock: '-1', cancel: 'C', damage: 600,
  driveGainHit: 1500, driveLossBlock: -3000, driveLossPunishCounter: -4000, superGain: 500,
  attribute: ['上'], notes: '空振り時硬直4F増加。モダンの 2M 割り当ては要検証（ヒキテ/ストゥニュー）',
}));
add('moves', 'manon-2mk', mv({
  key: 'manon-2mk', name: 'しゃがみ中K（ストゥニュー）', category: 'normal',
  inputClassic: '2MK', inputModern: '2M',
  startup: 8, active: '8-11', recovery: '16', onHit: '+4', onBlock: '-2', cancel: null, damage: 600,
  comboScaling: '始動補正20%', driveGainHit: 2000, driveLossBlock: -4000, driveLossPunishCounter: -6000, superGain: 600,
  attribute: ['下'], notes: 'リーチが長くキャンセル可。モダンの 2M 割り当ては要検証',
}));
add('moves', 'manon-5hp', mv({
  key: 'manon-5hp', name: '立ち強P（ランドリ）', category: 'normal',
  inputClassic: '5HP', inputModern: '5H',
  startup: 10, active: '10-13', recovery: '20', onHit: '0', onBlock: '-3', cancel: 'SA', damage: 800,
  driveGainHit: 3000, driveLossBlock: -6000, driveLossPunishCounter: -10000, superGain: 1000,
  attribute: ['上'], notes: '空中ヒット時吹き飛びダウン。差し返しパニカン → タン・リエ 派生からコンボ',
}));
add('moves', 'manon-tanlie', mv({
  key: 'manon-tanlie', name: 'タン・リエ（強P → 強P）', category: 'unique',
  inputClassic: '5HP~HP', inputModern: '5H~H',
  startup: 5, active: '5-9', recovery: '17', onHit: '+3', onBlock: '-8', cancel: null, damage: 600,
  comboScaling: 'コンボ補正20%', driveGainHit: 2000, driveLossBlock: -5000, driveLossPunishCounter: -7000, superGain: 1000,
  attribute: ['上'], notes: '立ち強Pがパニッシュカウンター時に派生すると吹き飛びダウン（浮かせて引き寄せ）。※ガード時硬直2F増加',
}));
add('moves', 'manon-4hp', mv({
  key: 'manon-4hp', name: '4強P（レベランス）', category: 'unique',
  inputClassic: '4HP', inputModern: '4H',
  startup: 8, active: '8-13', recovery: '17', onHit: '+3', onBlock: '+1', cancel: 'C', damage: 800,
  driveGainHit: 2000, driveLossBlock: -5000, driveLossPunishCounter: -8000, superGain: 1000,
  attribute: ['上'], notes: '引き強P。空中ヒット時吹き飛びダウン。ボタンホールドでフェイント派生（ガード時の反確回避）',
}));
add('moves', 'manon-enhaut', mv({
  key: 'manon-enhaut', name: 'アン・オー（1段目）', category: 'unique',
  inputClassic: '4MK', inputModern: '4M',
  startup: 10, active: '10-13', recovery: '19', onHit: '-1', onBlock: '-3', cancel: null, damage: 600,
  driveGainHit: 2000, driveLossBlock: -4000, driveLossPunishCounter: -4000, superGain: 700,
  attribute: ['上'], notes: '空中ヒット時吹き飛びダウン。起き攻め重ねに使う',
}));
add('moves', 'manon-enhaut-2', mv({
  key: 'manon-enhaut-2', name: 'アン・オー（2段目）', category: 'unique',
  inputClassic: '4MK~MK', inputModern: '4M~M',
  startup: 14, active: '14-18', recovery: '21', onHit: '-3', onBlock: '-11', cancel: 'C', damage: 500,
  driveGainHit: 1000, driveLossBlock: -2500, driveLossPunishCounter: -4000, superGain: 700,
  attribute: ['中'], notes: '中段。空中ヒット時床バウンド。＞中K は大きく遅らせ可（理論上9F遅らせ弱Pまで暴れ潰し）',
}));
add('moves', 'manon-degage-l', mv({
  key: 'manon-degage-l', name: '弱デガジェ', category: 'special',
  inputClassic: '214LK', inputModern: null, inputModernPrecise: '214L',
  startup: 16, active: '16-31', recovery: '36', onHit: 'D', onBlock: '-24', cancel: null, damage: 1000,
  driveGainHit: 1500, driveLossBlock: -4000, driveLossPunishCounter: -8000, superGain: 800,
  attribute: ['下'], notes: '締めに使うと最速で持続重ねの起き攻めが可能。モダンは強度自動選択のため弱指定は手動入力（214L）',
}));
add('moves', 'manon-ranversement-m', mv({
  key: 'manon-ranversement-m', name: '中ランヴェルセ', category: 'special',
  inputClassic: '236MP', inputModern: '2SP', inputModernPrecise: '236M',
  startup: 25, active: '25-26', recovery: '34', onHit: 'D', onBlock: '-20', cancel: 'SA3', damage: 1400,
  driveGainHit: 2000, driveLossBlock: -2000, driveLossPunishCounter: -8000, superGain: 2150,
  attribute: ['上'], notes: 'ダメージはメダルLv1（Lvで上昇: Lv5 で2000）。3-26F 飛び道具無敵。ボタンホールドでフェイント。ヒット時メダルLv+1',
}));
add('moves', 'manon-rondpoint-m', mv({
  key: 'manon-rondpoint-m', name: '中ロン・ポワン', category: 'special',
  inputClassic: '236MK', inputModern: '6SP', inputModernPrecise: '236M',
  startup: 11, active: '11-19', recovery: '27', onHit: 'D', onBlock: '-14', cancel: 'SA3', damage: 1000,
  driveGainHit: 2000, driveLossBlock: -4000, driveLossPunishCounter: -4000, superGain: 1350,
  attribute: ['上'], notes: '7-19F 上半身空中判定に無敵。コンボは弱/中/強/OD どれでも繋がる。モダンは強度自動選択',
}));
add('moves', 'manon-rondpoint-od', mv({
  key: 'manon-rondpoint-od', name: 'OD ロン・ポワン', category: 'special',
  inputClassic: '236KK', inputModern: '6AS SP', inputModernPrecise: '236KK',
  startup: 8, active: '8-16', recovery: '30', onHit: 'D', onBlock: '-19', cancel: 'SA2', damage: 800,
  driveGainHit: 0, driveLossBlock: -4000, driveLossPunishCounter: -4000, superGain: 1350,
  attribute: ['上'], notes: '4-16F 空中判定の打撃・空弾に無敵。ヒット後 デガジェ・SA1/2 で追撃可。対空や強Pパニカンコンボの拾いに使う',
}));
add('moves', 'manon-manege-l', mv({
  key: 'manon-manege-l', name: '弱マネージュ・ドレ（コマ投げ）', category: 'special',
  inputClassic: '63214LP', inputModern: '5SP',
  startup: 10, active: '10-12', recovery: '48', onHit: 'D', onBlock: null, cancel: null, damage: 2000,
  driveGainHit: 5000, driveLossBlock: 0, driveLossPunishCounter: -10000, superGain: 3000,
  attribute: ['投'], notes: 'ダメージ・SAゲージはメダルLv1（Lvで上昇: Lv5 で3700）。ヒット時メダルLv+1。弱版は密着でもコパン暴れに負ける',
}));
add('moves', 'manon-manege-od', mv({
  key: 'manon-manege-od', name: 'OD マネージュ・ドレ（コマ投げ）', category: 'special',
  inputClassic: '63214PP', inputModern: '5AS SP',
  startup: 8, active: '8-9', recovery: '51', onHit: 'D', onBlock: null, cancel: null, damage: 2000,
  driveGainHit: 0, driveLossBlock: 0, driveLossPunishCounter: -10000, superGain: 3000,
  attribute: ['投'], notes: 'ダメージはメダルLv1（Lvで上昇）。弱デガジェ〆の DR2中K ガード時（+5）の2択に使える（中版は届かない）',
}));

// ── situations ──────────────────────────────────────────────
const sit = (o: any) => ({ tags: [], ...o });

add('situations', 'neutral_mid', sit({
  id: 'neutral_mid', label: '中央・立ち回り', kind: 'neutral', position: 'midscreen', opponentState: 'neutral',
  advantage: '±0', tags: ['始動'],
  notes: '中P・中K を軸に地上戦。中P>CDR>2中P の連携をガード/ヒットさせて 強コマ投げ / 打撃 の2択。',
}));
add('situations', 'juggle_can_4hp_ranversement', sit({
  id: 'juggle_can_4hp_ranversement', label: '4強P → 中ランヴェルセ が繋がる浮き', kind: 'juggle', position: 'midscreen',
  opponentState: 'juggle', advantage: '限定浮き', tags: ['連結ハブ'],
  notes: '頻出コンボ（中P CDR 2中P）と起き攻め（DR2中K / DR4強P）の両方がここに到達し、4強P→中ランヴェルセ を共有する。',
}));
add('situations', 'juggle_pc_5hp', sit({
  id: 'juggle_pc_5hp', label: '5強P パニッシュカウンター・浮き', kind: 'juggle', position: 'midscreen',
  opponentState: 'juggle', advantage: 'パニカン誘発', tags: ['パニカン'],
  notes: '強P 差し返しがパニカン → 強P（タン・リエ）派生で吹き飛び、引き寄せながら浮く。OD ロン・ポワンで拾える。',
}));
add('situations', 'kd_after_ranversement_mid', sit({
  id: 'kd_after_ranversement_mid', label: '中ランヴェルセ締め後・中央ダウン', kind: 'knockdown', position: 'midscreen',
  opponentState: 'knockdown_soft', wakeupNote: '受け身可', tags: ['起き攻め開始'],
  notes: 'メダルLv+1。詳しい起き攻めはバッチ2以降で整理（記事では 弱デガジェ〆・強ロン・ポワン〆 が主）。',
}));
add('situations', 'kd_after_degage_light_mid', sit({
  id: 'kd_after_degage_light_mid', label: '弱デガジェ締め後・中央ダウン', kind: 'knockdown', position: 'midscreen',
  opponentState: 'knockdown_soft', wakeupNote: '受け身可（最速で持続重ね可）', tags: ['起き攻め開始'],
  notes: 'マノンの主力起き攻め。最速で ラッシュ2中K / ラッシュ4強P を持続重ねできる。',
}));
add('situations', 'kd_after_rondpoint_mid', sit({
  id: 'kd_after_rondpoint_mid', label: '中ロン・ポワン締め後・中央ダウン', kind: 'knockdown', position: 'midscreen',
  opponentState: 'knockdown_soft', wakeupNote: '受け身可', tags: [],
  notes: '2中P確認コンボの締め。強ロン・ポワン〆ならラッシュ2中K重ねが可能（最速だとスカる）。',
}));
add('situations', 'kd_after_manege_dore_mid', sit({
  id: 'kd_after_manege_dore_mid', label: 'マネージュ・ドレ後・中央ダウン', kind: 'knockdown', position: 'midscreen',
  opponentState: 'knockdown_hard', advantage: 'メダル獲得 +1', wakeupNote: '受け身不可（コマ投げ）', tags: ['メダル'],
  notes: 'コマ投げ後。バッチ1では起き攻めルート未整理。',
}));

// ── routes ──────────────────────────────────────────────────
const R = (o: any) => ({ character: 'manon', ...o });

add('routes', 'route_5lp5lp_degage_l', R({
  id: 'route_5lp5lp_degage_l', from: 'neutral_mid', to: 'kd_after_degage_light_mid',
  kind: 'combo_route', label: '弱P×2 → 弱デガジェ〆',
  steps: [
    { move: '弱P', command: '5LP', moveKey: 'manon-5lp' },
    { move: '弱P', command: '5LP', moveKey: 'manon-5lp', cancel: true, note: '連打キャンセル' },
    { move: '弱デガジェ', command: '214LK', moveKey: 'manon-degage-l', cancel: true, note: '〆。起き攻めが強い' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 1600, difficulty: 1,
  constraints: '立ち弱P 始動（2弱P 始動ではデガジェが繋がらない）',
  controlType: 'classic',
  notes: SRC,
  tags: ['とりこれ', '小技始動', '〆'],
}));
add('routes', 'route_5mp_cr_2mp', R({
  id: 'route_5mp_cr_2mp', from: 'neutral_mid', to: 'juggle_can_4hp_ranversement',
  kind: 'starter', label: '中P キャンセルラッシュ 2中P',
  steps: [
    { move: '中P', command: '5MP', moveKey: 'manon-5mp', cancel: true },
    { move: 'キャンセルドライブラッシュ', command: 'DRC' },
    { move: '2中P', command: '2MP', moveKey: 'manon-2mp' },
  ],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 1200, difficulty: 3,
  constraints: '中P がヒット確認できたら。中P>CDR>2中P はガードでも連続ガード＋3F有利',
  controlType: 'both',
  notes: SRC,
  tags: ['頻出', 'CDR'],
}));
add('routes', 'route_4hp_ranversement_mid', R({
  id: 'route_4hp_ranversement_mid', from: 'juggle_can_4hp_ranversement', to: 'kd_after_ranversement_mid',
  kind: 'ender', label: '4強P → 中ランヴェルセ',
  steps: [
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: '中ランヴェルセ', command: '236MP', moveKey: 'manon-ranversement-m', cancel: true, note: 'メダルLv+1' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2200, difficulty: 2,
  constraints: '「4強P → 中ランヴェルセ が繋がる浮き」からのみ。ヒット確認できるなら 4強P>弱ランヴェルセ の方が有利F高い',
  controlType: 'both',
  notes: SRC,
  tags: ['〆', '連結', 'メダル'],
}));
add('routes', 'route_5mp_cr_2mp_5lk_rondpoint', R({
  id: 'route_5mp_cr_2mp_5lk_rondpoint', from: 'neutral_mid', to: 'kd_after_rondpoint_mid',
  kind: 'combo_route', label: '中P CDR 2中P → 弱K → 中ロン・ポワン',
  steps: [
    { move: '中P', command: '5MP', moveKey: 'manon-5mp', cancel: true },
    { move: 'キャンセルドライブラッシュ', command: 'DRC' },
    { move: '2中P', command: '2MP', moveKey: 'manon-2mp' },
    { move: '弱K', command: '5LK', moveKey: 'manon-5lk' },
    { move: '中ロン・ポワン', command: '236MK', moveKey: 'manon-rondpoint-m', cancel: true },
  ],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 2500, difficulty: 3,
  constraints: '中P>CDR>2中P の2択で 2中P がヒットした時。ロン・ポワンは弱/中/強/OD どれでも可（OD なら追撃可）',
  controlType: 'both',
  notes: SRC,
  tags: ['頻出', 'CDR', '2択確認'],
}));
add('routes', 'route_enhaut_cr_2mp', R({
  id: 'route_enhaut_cr_2mp', from: 'neutral_mid', to: 'juggle_can_4hp_ranversement',
  kind: 'starter', label: 'アン・オー CDR 2中P',
  steps: [
    { move: 'アン・オー', command: '4MK', moveKey: 'manon-enhaut', note: '起き攻め重ね' },
    { move: '派生 中K', command: '~MK', moveKey: 'manon-enhaut-2', cancel: true, note: '＞中K は大きく遅らせ可（暴れ潰し）' },
    { move: 'キャンセルドライブラッシュ', command: 'DRC' },
    { move: '2中P', command: '2MP', moveKey: 'manon-2mp' },
  ],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 1700, difficulty: 3,
  constraints: 'アン・オーがヒット。起き攻めの4中K重ねから同ルート。ゲージ節約なら アン・オー>弱/中デガジェ〆',
  controlType: 'both',
  notes: SRC,
  tags: ['起き攻め', 'CDR', '中段重ね'],
}));
add('routes', 'route_5lk_cr_5lp', R({
  id: 'route_5lk_cr_5lp', from: 'neutral_mid', to: 'juggle_can_4hp_ranversement',
  kind: 'starter', label: '弱K キャンセルラッシュ 弱P',
  steps: [
    { move: '弱K', command: '5LK', moveKey: 'manon-5lk', cancel: true },
    { move: 'キャンセルドライブラッシュ', command: 'DRC' },
    { move: '弱P', command: '5LP', moveKey: 'manon-5lp' },
  ],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 600, difficulty: 3,
  constraints: '遠めの 5F/6F 確定反撃（例: マリーザ 弱クアトリガ ガード時）。弱K>CDR でコンボに行けるのはマノンの強み',
  controlType: 'both',
  notes: SRC,
  tags: ['確定反撃', 'CDR'],
}));
add('routes', 'route_5hp_pc_tanlie', R({
  id: 'route_5hp_pc_tanlie', from: 'neutral_mid', to: 'juggle_pc_5hp',
  kind: 'starter', label: '5強P パニカン → 強P（タン・リエ）',
  steps: [
    { move: '5強P', command: 'PC 5HP', moveKey: 'manon-5hp', note: '差し返しパニッシュカウンター' },
    { move: '強P（タン・リエ）', command: '~HP', moveKey: 'manon-tanlie', cancel: true, note: 'PC時は吹き飛び、引き寄せながら浮く' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 1400, difficulty: 2,
  constraints: '5強P がパニッシュカウンター（差し返し）した時',
  controlType: 'both',
  notes: SRC,
  tags: ['パニカン', '差し返し'],
}));
add('routes', 'route_pc_odrondpoint_dr5lp_ranversement', R({
  id: 'route_pc_odrondpoint_dr5lp_ranversement', from: 'juggle_pc_5hp', to: 'kd_after_ranversement_mid',
  kind: 'ender', label: 'OD ロン・ポワン → ラッシュ弱P → 中ランヴェルセ',
  steps: [
    { move: 'OD ロン・ポワン', command: '236KK', moveKey: 'manon-rondpoint-od', cancel: true, note: '浮きを拾う' },
    { move: 'ドライブラッシュ', command: 'DR' },
    { move: '弱P', command: '5LP', moveKey: 'manon-5lp' },
    { move: '中ランヴェルセ', command: '236MP', moveKey: 'manon-ranversement-m', cancel: true, note: 'メダルLv+1' },
  ],
  resources: { driveCost: 5, superCost: 0, saLevel: null },
  damage: 2500, difficulty: 3,
  constraints: 'ゲージ内訳: OD ロン・ポワン 2 ＋ 生ドライブラッシュ 3（要確認）。メダルを溜める貴重なコンボ',
  controlType: 'both',
  notes: SRC + ' ラッシュがキャンセル/生のどちらかは要確認。',
  tags: ['パニカン', 'メダル', '〆'],
}));

// 弱デガジェ〆 の起き攻め
add('routes', 'oki_dr2mk_from_degage', R({
  id: 'oki_dr2mk_from_degage', from: 'kd_after_degage_light_mid', to: 'juggle_can_4hp_ranversement',
  kind: 'okizeme', label: 'ラッシュ2中K 重ね',
  steps: [
    { move: 'ドライブラッシュ', command: 'DR' },
    { move: '2中K', command: '2MK', moveKey: 'manon-2mk', note: '最速で持続重ね' },
  ],
  resources: { driveCost: 3, superCost: 0, saLevel: null },
  damage: 600, difficulty: 3,
  constraints: '弱デガジェ〆から最速で持続重ね。生ドライブラッシュ 3 本消費',
  controlType: 'both',
  notes: SRC,
  properties: {
    frameAdvantage: { frames: '+5', note: '2中K 持続をガードさせた時' },
    wakeup: { coverage: 'both', note: '弱デガジェ〆は最速で持続重ね可' },
    strongVs: ['コパン暴れ（弱P 4F）', '遅らせ暴れ'],
    weakVs: ['垂直・バックジャンプ', '無敵技'],
    useWhen: '基本択。ヒットで 4強P→中ランヴェルセ、ガードで +5 から OD コマ投げ / 4強P の2択',
    onBlock: '+5（OD コマ投げ / 4強P で2択。中版コマ投げは届かない・弱版はコパンに負ける）',
    risk: '低',
  },
  tags: ['基本択', '持続重ね'],
}));
add('routes', 'oki_dr4hp_from_degage', R({
  id: 'oki_dr4hp_from_degage', from: 'kd_after_degage_light_mid', to: 'juggle_can_4hp_ranversement',
  kind: 'okizeme', label: 'ラッシュ4強P 重ね',
  steps: [
    { move: 'ドライブラッシュ', command: 'DR' },
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp', note: '持続重ね。ヒット確認で再度4強P' },
  ],
  resources: { driveCost: 3, superCost: 0, saLevel: null },
  damage: 800, difficulty: 3,
  constraints: '弱デガジェ〆から最速で持続重ね',
  controlType: 'both',
  notes: SRC,
  properties: {
    frameAdvantage: { frames: '+8', note: '4強P 持続をガードさせた時' },
    wakeup: { coverage: 'both', note: '最速で持続重ね可' },
    strongVs: ['暴れ', '遅らせ暴れ'],
    weakVs: ['垂直・バックジャンプ', '無敵技'],
    useWhen: 'ヒット確認で 4強P→中ランヴェルセ。ガードされそうならボタンホールドでフェイントにして反確回避',
    onBlock: '+8（弱コマ投げ / 4強P・アン・オー で2択）',
    risk: '低',
  },
  tags: ['基本択', '持続重ね', 'ヒット確認'],
}));
add('routes', 'oki_grab_from_degage', R({
  id: 'oki_grab_from_degage', from: 'kd_after_degage_light_mid', to: 'kd_after_manege_dore_mid',
  kind: 'okizeme', label: '弱コマ投げ',
  steps: [{ move: '弱マネージュ・ドレ', command: '63214LP', moveKey: 'manon-manege-l' }],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2000, difficulty: 2,
  constraints: '打撃重ねを嫌ってガードで固まる相手に',
  controlType: 'classic',
  notes: SRC + ' モダンは強度自動選択のため弱指定は手動入力。',
  properties: {
    frameAdvantage: { frames: '±0', note: 'コマ投げ・メダル+1' },
    wakeup: { coverage: 'both' },
    strongVs: ['ガード継続', 'しゃがみっぱ'],
    weakVs: ['前・バックジャンプ', '打撃暴れ', '投げ抜け'],
    useWhen: '打撃重ねを嫌ってガードで固まる相手に',
    onBlock: '—（投げ）',
    risk: '中',
  },
  tags: ['崩し', 'メダル'],
}));

// ── combos ─────────────────────────────────────────────────
const C = (o: any) => ({ character: 'manon', ...o });

add('combos', 'manon-mid-lp-degage', C({
  slug: 'manon-mid-lp-degage', name: '中央 弱P始動 弱デガジェ〆（とりこれ）',
  situationLabel: '中央・小技始動', routeChain: ['route_5lp5lp_degage_l'],
  startFrom: 'neutral_mid', endAt: 'kd_after_degage_light_mid', difficulty: 1,
  tags: ['とりこれ', 'ノーゲージ', '起き攻め'],
  description: 'まず覚える小技始動。弱デガジェ〆から最速で持続重ねの起き攻めに行ける。' + SRC,
}));
add('combos', 'manon-mid-5mp-cr-ranversement', C({
  slug: 'manon-mid-5mp-cr-ranversement', name: '中央 中P CDR 中ランヴェルセ〆（最頻出）',
  situationLabel: '中央・地上ヒット確認', routeChain: ['route_5mp_cr_2mp', 'route_4hp_ranversement_mid'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid', difficulty: 3,
  tags: ['頻出', 'CDR', 'メダル', '実戦'],
  description: 'マノンの主力。中P>CDR>2中P はガードでも連続ガード＋3F有利で、そこから 強コマ投げ / 打撃 の2択。後半 4強P→中ランヴェルセ は他始動と共有パーツ。' + SRC,
}));
add('combos', 'manon-mid-5mp-cr-rondpoint', C({
  slug: 'manon-mid-5mp-cr-rondpoint', name: '中央 中P CDR 2中P確認 中ロン・ポワン〆',
  situationLabel: '中央・2中P ヒット確認', routeChain: ['route_5mp_cr_2mp_5lk_rondpoint'],
  startFrom: 'neutral_mid', endAt: 'kd_after_rondpoint_mid', difficulty: 3,
  tags: ['CDR', '2択確認'],
  description: '中P>CDR>2中P の2択で 2中P がヒットした時。ロン・ポワンは弱/中/強/OD どれでも可。OD なら デガジェ・SA で追撃。' + SRC,
}));
add('combos', 'manon-mid-enhaut-cr-ranversement', C({
  slug: 'manon-mid-enhaut-cr-ranversement', name: '中央 アン・オー CDR 中ランヴェルセ〆',
  situationLabel: '中央・アン・オー ヒット確認（起き攻め重ねからも）',
  routeChain: ['route_enhaut_cr_2mp', 'route_4hp_ranversement_mid'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid', difficulty: 3,
  tags: ['起き攻め', 'CDR', '中段重ね'],
  description: 'アン・オー（4中K＞K）始動。中P始動と同じルート。起き攻めで アン・オー を重ねられる場面で使う（＞中K は遅らせて暴れ潰し）。ゲージ節約なら アン・オー>弱/中デガジェ〆。' + SRC,
}));
add('combos', 'manon-punish-5lk-ranversement', C({
  slug: 'manon-punish-5lk-ranversement', name: '遠め確反 弱K CDR 中ランヴェルセ〆',
  situationLabel: '遠めの 5F/6F 確定反撃', routeChain: ['route_5lk_cr_5lp', 'route_4hp_ranversement_mid'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid', difficulty: 3,
  tags: ['確定反撃', 'CDR'],
  description: '弱K>CDR でコンボに行けるのはマノンの強み。遠めの 5F/6F 確反で使用。ノーゲージなら 弱K>中ロン・ポワン。' + SRC,
}));
add('combos', 'manon-punish-5hp-pc-ranversement', C({
  slug: 'manon-punish-5hp-pc-ranversement', name: 'パニカン 5強P タン・リエ ODロン・ポワン 中ランヴェルセ〆',
  situationLabel: '中央・5強P パニッシュカウンター（差し返し）',
  routeChain: ['route_5hp_pc_tanlie', 'route_pc_odrondpoint_dr5lp_ranversement'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid', difficulty: 3,
  tags: ['パニカン', '差し返し', 'メダル'],
  description: '強P 差し返しがパニカン → 強P タゲコン で吹き飛ばして OD ロン・ポワンで拾う。メダルを溜める貴重なコンボ。リーサルは SA3〆も可。' + SRC,
}));

// ── write ──────────────────────────────────────────────────
let n = 0;
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(draftsDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  n++;
}
console.log(`${n} 件の下書きを drafts/ に生成`);
process.exit(0);
