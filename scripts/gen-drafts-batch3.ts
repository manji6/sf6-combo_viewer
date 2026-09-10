// batch3: すこれるブログ https://www.sukoreru.com/sf6-manon の SA / OD グランフェッテ系。
// SA1/2/3・OD グランフェッテ・OD デガジェ・強ランヴェルセ・弱ロン・ポワン を技辞典に追加し、
// 「無敵技ガード〆」「中P始動リーサル SA3」「J強K ODグランフェッテ」「強Kパニカン SA2」を登録。
// フレームデータは公式（streetfighter.com/6/ja-jp/character/manon/frame）参照。
// Dゲージ: CDR=3本 / 生DR=1本 / OD技=2本 / DI=1本。ODグランフェッテはスピン中に回復するため実質消費は少ない。
// 合計ダメージは素点合計＝補正前の目安。出典に明記のある実測値は combo の damageOverride に入れる。難易度は推定。
// `npx vite-node scripts/gen-drafts-batch3.ts`
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
const mv = (o: any) => ({ character: 'manon', verifiedVersion: VER, ...o });
const sit = (o: any) => ({ tags: [], ...o });
const R = (o: any) => ({ character: 'manon', notes: SRC, ...o });
const C = (o: any) => ({ character: 'manon', ...o });

// ── moves ──────────────────────────────────────────────────
add('moves', 'manon-rondpoint-l', mv({
  key: 'manon-rondpoint-l', name: '弱 ロン・ポワン', category: 'special',
  inputClassic: '236LK', inputModern: null, inputModernPrecise: '236L',
  startup: 9, active: '9-15', recovery: '29', onHit: '+3', onBlock: '-15', cancel: 'SA3', damage: 900,
  driveGainHit: 2000, driveLossBlock: -4000, driveLossPunishCounter: -4000, superGain: 1350,
  attribute: ['上'],
  notes: '5-15F 上半身のみ空中判定の打撃・空弾に無敵。2段目のみ SA3/CA でキャンセル可。SA3 へ繋ぐ場合は弱ロン・ポワンが最もダメージが高い（どのコンボでも共通）。',
}));
add('moves', 'manon-ranversement-h', mv({
  key: 'manon-ranversement-h', name: '強ランヴェルセ', category: 'special',
  inputClassic: '236HP', inputModern: null, inputModernPrecise: '236H',
  startup: 29, active: '29-30', recovery: '30', onHit: 'D', onBlock: '-16', cancel: 'SA3', damage: 1500,
  driveGainHit: 2000, driveLossBlock: -2000, driveLossPunishCounter: -8000, superGain: 2150,
  attribute: ['上'],
  notes: 'ダメージはメダルLv1（Lvで上昇: Lv5 で2100）。3-30F 飛び道具無敵。ボタンホールドでフェイント。ヒット時メダルLv+1。',
}));
add('moves', 'manon-degage-od', mv({
  key: 'manon-degage-od', name: 'OD デガジェ', category: 'special',
  inputClassic: '214KK', inputModern: null,
  startup: 22, active: '22-24', recovery: '22', onHit: '+6', onBlock: '-3', cancel: null, damage: 800,
  comboScaling: '始動補正20%',
  driveGainHit: 0, driveLossBlock: -4000, driveLossPunishCounter: -5000, superGain: 800,
  attribute: ['中'],
  notes: '11-24F 足元無敵・投げ無敵、9-21F 空中判定。空中ヒット時床バウンドでコンボが伸びる。モダンの OD 派生入力は要検証。',
}));
add('moves', 'manon-grandfouette-od', mv({
  key: 'manon-grandfouette-od', name: 'OD グラン・フェッテ', category: 'special',
  inputClassic: '236PP~K', inputModern: null,
  startup: 10, active: '10-15', recovery: '22', onHit: 'D', onBlock: '-12', cancel: 'SA2', damage: 800,
  comboScaling: '即時補正10%',
  driveGainHit: 0, driveLossBlock: -4000, driveLossPunishCounter: -5000, superGain: 1150,
  attribute: ['上'],
  notes: 'OD ランヴェルセ中に K 派生。4強P>ODグランフェッテ は火力上昇とゲージ回収が強い。名目Dゲージは OD ランヴェルセ分の2本だが、スピン中に回復するため実質1本程度。モダンの派生入力は要検証。',
}));
add('moves', 'manon-sa1', mv({
  key: 'manon-sa1', name: 'SA1 アラベスク', category: 'super',
  inputClassic: '236236K', inputModern: null,
  startup: 10, active: '10-13', recovery: '65', onHit: 'D', onBlock: '-49', cancel: null, damage: 2000,
  comboScaling: '最低保障30%',
  driveGainHit: 0, driveLossBlock: -2500, driveLossPunishCounter: 0, superGain: 0,
  attribute: ['下'],
  notes: '1-13F 打撃・投げ無敵。ヒット時に位置入れ替え。リバーサル無敵SAとして全キャラ中でも強力。カウンター/パニッシュカウンターで数値が変動しない。モダン入力は要検証。',
}));
add('moves', 'manon-sa2', mv({
  key: 'manon-sa2', name: 'SA2 エトワール', category: 'super',
  inputClassic: '214214P', inputModern: null,
  startup: 7, active: '7-80', recovery: '38+着地後34', onHit: 'D', onBlock: '-61', cancel: null, damage: 2800,
  comboScaling: '最低保障40%',
  driveGainHit: 0, driveLossBlock: -1000, driveLossPunishCounter: 0, superGain: 0,
  attribute: ['上'],
  notes: '1-9F 完全無敵。横にも上にも長く、バクステ・垂直飛びにも勝てる。強Kパニカンからノーキャンセルで繋がり約3800dmg＋Dゲージ合計2削り。カウンター/パニッシュカウンターで数値が変動しない。モダン入力は要検証。',
}));
add('moves', 'manon-sa3', mv({
  key: 'manon-sa3', name: 'SA3 パ・ド・ドゥ', category: 'super',
  inputClassic: '236236P', inputModern: null,
  startup: 7, active: '7-8', recovery: '72', onHit: 'D', onBlock: null, cancel: null, damage: 4000,
  comboScaling: '最低保障50%。立ち強P・ロン・ポワンからのキャンセル時のみ即時補正15%',
  driveGainHit: 0, driveLossBlock: 0, driveLossPunishCounter: 0, superGain: 0,
  attribute: ['投'],
  notes: '1-8F 完全無敵。近距離。ダメージはメダルLv1（Lvで上昇: Lv5 で4600）。弱ロン・ポワンから繋ぐと最もSAダメージが高い。カウンター/パニッシュカウンターで数値が変動しない。モダン入力は要検証。',
}));

// ── situations ─────────────────────────────────────────────
add('situations', 'kd_after_super_mid', sit({
  id: 'kd_after_super_mid', label: 'スーパーアーツ〆後・中央ダウン', kind: 'knockdown',
  position: 'midscreen', opponentState: 'knockdown_hard',
  wakeupNote: 'リーサル用途が主',
  tags: ['起き攻め開始'],
  notes: 'SA2 / SA3 でコンボを〆た後。ラウンドを取り切る用途が主。SA 別の起き攻めはバッチ4以降で整理。',
}));

// ── routes ─────────────────────────────────────────────────
add('routes', 'route_odfouette_ranversement', R({
  id: 'route_odfouette_ranversement', from: 'neutral_mid', to: 'kd_after_ranversement_mid', kind: 'combo_route',
  label: '4強P → ODグランフェッテ → 4強P → 強ロン・ポワン → 弱ランヴェルセ〆',
  steps: [
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp', note: '無敵技をガードした後' },
    { move: 'ODグランフェッテ', command: '236PP~K', moveKey: 'manon-grandfouette-od', cancel: true, note: 'OD ランヴェルセ K派生。スピン中にDゲージ回復' },
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: '強ロン・ポワン', command: '236HK', moveKey: 'manon-rondpoint-h', cancel: true, note: '難しければ強ランヴェルセに置換可' },
    { move: '弱ランヴェルセ', command: '236LP', moveKey: 'manon-ranversement-l', cancel: true, note: 'メダルLv+1' },
  ],
  resources: { driveCost: 2, superCost: 0, saLevel: null },
  damage: 4550, difficulty: 3,
  constraints: '無敵技をガードした時のコンボ。名目Dゲージ2本だがコンボ中に回復するため実質1本消費。メダル4枚以上ならコマ投げの方が火力上。',
  controlType: 'classic',
  tags: ['パニカン', '無敵技ガード', 'メダル', 'OD'],
}));
add('routes', 'route_jhk_odfouette_ranversement', R({
  id: 'route_jhk_odfouette_ranversement', from: 'neutral_mid', to: 'kd_after_ranversement_mid', kind: 'combo_route',
  label: 'J強K → 4強P → ODグランフェッテ → 4強P → 強ランヴェルセ〆',
  steps: [
    { move: 'J強K', command: 'j.HK', moveKey: 'manon-jhk', note: '飛び道具読み前ジャンプ' },
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: 'ODグランフェッテ', command: '236PP~K', moveKey: 'manon-grandfouette-od', cancel: true, note: '2024.5.22 アプデで 4強P>ODグランフェッテ が接続。中ランヴェルセに置換も可' },
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: '強ランヴェルセ', command: '236HP', moveKey: 'manon-ranversement-h', cancel: true, note: 'メダルLv+1' },
  ],
  resources: { driveCost: 2, superCost: 0, saLevel: null },
  damage: 4700, difficulty: 3,
  constraints: '飛び道具読み前ジャンプが通った時。2ゲージ使用（コンボ中に回復し実質1本程度）。ノーゲージなら 4強P>中ランヴェルセ〆。',
  controlType: 'classic',
  tags: ['ジャンプ始動', 'メダル', 'OD'],
}));
add('routes', 'route_4hp_cr_2mp_4hp_rondboin_sa3', R({
  id: 'route_4hp_cr_2mp_4hp_rondboin_sa3', from: 'juggle_can_4hp_ranversement', to: 'kd_after_super_mid', kind: 'ender',
  label: '4強P → CDR → 2中P → 4強P → 弱ロン・ポワン → SA3〆',
  steps: [
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: 'キャンセルドライブラッシュ', command: 'DRC' },
    { move: '2中P', command: '2MP', moveKey: 'manon-2mp' },
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: '弱ロン・ポワン', command: '236LK', moveKey: 'manon-rondpoint-l', cancel: true, note: 'SA3 に繋ぐなら弱が最高効率' },
    { move: 'SA3（パ・ド・ドゥ）', command: '236236P', moveKey: 'manon-sa3', cancel: true },
  ],
  resources: { driveCost: 3, superCost: 3, saLevel: 3 },
  damage: 7100, difficulty: 4,
  constraints: '「4強P → 中ランヴェルセ が繋がる浮き」から。2つ目の CDR で 3 本消費（コンボ全体で Dゲージ 6 本）。',
  controlType: 'classic',
  tags: ['リーサル', 'CDR', 'SA', 'メダル'],
}));
add('routes', 'route_5hk_pc_sa2', R({
  id: 'route_5hk_pc_sa2', from: 'neutral_mid', to: 'kd_after_super_mid', kind: 'combo_route',
  label: '強K パニカン → SA2（エトワール）',
  steps: [
    { move: '強K', command: 'PC 5HK', moveKey: 'manon-5hk', note: '遠めの差し返しがパニッシュカウンター' },
    { move: 'SA2（エトワール）', command: '214214P', moveKey: 'manon-sa2', note: 'ノーキャンセルで繋がる。約3800dmg＋Dゲージ合計2削り' },
  ],
  resources: { driveCost: 0, superCost: 2, saLevel: 2 },
  damage: 3700, difficulty: 2,
  constraints: '遠めの差し返し 強K がパニッシュカウンターした時。SA2 はノーキャンセルで繋がる。',
  controlType: 'classic',
  tags: ['パニカン', '差し返し', 'SA', '〆'],
}));

// ── combos ─────────────────────────────────────────────────
add('combos', 'manon-punish-invincible-odfouette', C({
  slug: 'manon-punish-invincible-odfouette', name: '無敵技ガード 4強P ODグランフェッテ 弱ランヴェルセ〆',
  situationLabel: '中央・相手の無敵技をガード', routeChain: ['route_odfouette_ranversement'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid',
  damageOverride: 3000, driveCostOverride: 1, difficulty: 3,
  tags: ['パニカン', '無敵技ガード', 'メダル', 'OD'],
  description: '無敵技をガードした時のコンボ。メダル1枚でも3000dmg超。名目2ゲージだがコンボ中に回復するため実質1消費。メダル3枚以下なら積極的にこちら、4枚からはコマ投げの方が火力が高い。' + SRC,
}));
add('combos', 'manon-jump-jhk-odfouette', C({
  slug: 'manon-jump-jhk-odfouette', name: 'ジャンプ始動 J強K 4強P ODグランフェッテ 強ランヴェルセ〆',
  situationLabel: '飛び道具読み前ジャンプが通った時', routeChain: ['route_jhk_odfouette_ranversement'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid',
  driveCostOverride: 1, difficulty: 3,
  tags: ['ジャンプ始動', 'メダル', 'OD'],
  description: '飛びが通った時に2ゲージ使って伸ばすコンボ。ODグランフェッテを中ランヴェルセに置換してもOK。ノーゲージなら 4強P>中ランヴェルセ〆。' + SRC,
}));
add('combos', 'manon-mid-5mp-lethal-sa3', C({
  slug: 'manon-mid-5mp-lethal-sa3', name: '中央 中P始動 リーサル SA3〆',
  situationLabel: '中央・地上ヒット確認（リーサル）', routeChain: ['route_5mp_cr_2mp', 'route_4hp_cr_2mp_4hp_rondboin_sa3'],
  startFrom: 'neutral_mid', endAt: 'kd_after_super_mid', difficulty: 4,
  tags: ['リーサル', 'CDR', 'SA', 'メダル'],
  description: '中P始動の簡単なリーサルコンボ。前半の 中P>CDR>2中P は最頻出コンボと共有。Dゲージ 6 本（CDR×2）＋SA3。コンボパーツは他始動でも使い回せる。' + SRC,
}));
add('combos', 'manon-punish-5hk-pc-sa2', C({
  slug: 'manon-punish-5hk-pc-sa2', name: '差し返し 強K パニカン SA2〆',
  situationLabel: '遠めの差し返し（強K パニカン）', routeChain: ['route_5hk_pc_sa2'],
  startFrom: 'neutral_mid', endAt: 'kd_after_super_mid',
  damageOverride: 3800, difficulty: 2,
  tags: ['パニカン', '差し返し', 'SA'],
  description: '遠めの差し返し 強K がパニカンした時、SA2 がノーキャンセルで繋がる。3800dmg＋Dゲージを合計2削るので非常に強力。' + SRC,
}));

// ── write ──────────────────────────────────────────────────
let n = 0;
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(draftsDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  n++;
}
console.log(`${n} 件の下書きを drafts/ に生成`);
process.exit(0);
