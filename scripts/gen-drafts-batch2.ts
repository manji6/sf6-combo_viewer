// batch2: すこれるブログ https://www.sukoreru.com/sf6-manon の実戦寄りの残り。
// 小技/確反/差し返し/ジャンプ/インパクト始動 ＋ 強ロン・ポワン〆の起き攻め
// ＋ 中P>CDR>2中P ガード後の読み合い。
// Dゲージ: CDR=3本 / 生DR=1本 / OD技=2本 / DI=1本。合計ダメージは素点合計＝目安。難易度は推定。
// `npx vite-node scripts/gen-drafts-batch2.ts`
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
add('moves', 'manon-2lp', mv({
  key: 'manon-2lp', name: 'しゃがみ弱P（ソデキリ）', category: 'normal',
  inputClassic: '2LP', inputModern: '2L',
  startup: 4, active: '4-5', recovery: '11', onHit: '+3', onBlock: '-2', cancel: 'C', damage: 300,
  comboScaling: '始動補正20%', driveGainHit: 250, driveLossBlock: -500, driveLossPunishCounter: -2000, superGain: 300,
  attribute: ['上'], notes: '連打キャンセル対応。2弱P からは デガジェ 不可・ロン・ポワンは可。モダンの弱攻撃割り当ては要検証',
}));
add('moves', 'manon-5hk', mv({
  key: 'manon-5hk', name: '立ち強K（ピエ・ドンジュ）', category: 'normal',
  inputClassic: '5HK', inputModern: '5H',
  startup: 15, active: '15-17', recovery: '26', onHit: null, onBlock: '-6', cancel: null, damage: 900,
  driveGainHit: 3000, driveLossBlock: -6000, driveLossPunishCounter: -10000, superGain: 1000,
  attribute: ['上'], notes: 'リーチが長くゲージ削り良好。地上パニッシュカウンター時 +17F、空中パニカン時吹き飛びダウン。差し返しパニカンで追撃可。ヒット硬直差は要確認',
}));
add('moves', 'manon-jhk', mv({
  key: 'manon-jhk', name: 'ジャンプ強K（カブリオール）', category: 'normal',
  inputClassic: 'j.HK', inputModern: 'j.H',
  startup: 11, active: '11-15', recovery: '着地後3', onHit: null, onBlock: null, cancel: null, damage: 800,
  driveGainHit: 2000, driveLossBlock: -4000, driveLossPunishCounter: -5000, superGain: 1000,
  attribute: ['中'], notes: '飛び込み。飛び道具読み前ジャンプが通った時のコンボ始動。ヒット/ガード硬直差は当てる高さで変動',
}));
add('moves', 'manon-degage-m', mv({
  key: 'manon-degage-m', name: '中デガジェ', category: 'special',
  inputClassic: '214MK', inputModern: '4SP', inputModernPrecise: '214M',
  startup: 16, active: '16-39', recovery: '22', onHit: 'D', onBlock: '-13', cancel: null, damage: 1200,
  driveGainHit: 2000, driveLossBlock: -5000, driveLossPunishCounter: -8000, superGain: 800,
  attribute: ['上'], notes: '15-39F 空中判定。確反・パニカンの〆に。豪鬼が黄色体力なら 強Kパニカン>中デガジェ で倒せる。モダンは強度自動選択',
}));
add('moves', 'manon-ranversement-l', mv({
  key: 'manon-ranversement-l', name: '弱ランヴェルセ', category: 'special',
  inputClassic: '236LP', inputModern: '2SP', inputModernPrecise: '236L',
  startup: 22, active: '22-23', recovery: '37', onHit: 'D', onBlock: '-23', cancel: 'SA3', damage: 1350,
  driveGainHit: 2000, driveLossBlock: -2000, driveLossPunishCounter: -8000, superGain: 2150,
  attribute: ['上'], notes: 'ダメージはメダルLv1（Lvで上昇: Lv5 で1950）。3-23F 飛び道具無敵。SA3 に繋ぐならどのコンボでも弱ランヴェルセが最ダメージ。モダンは強度自動選択',
}));
add('moves', 'manon-rondpoint-h', mv({
  key: 'manon-rondpoint-h', name: '強ロン・ポワン', category: 'special',
  inputClassic: '236HK', inputModern: '6SP', inputModernPrecise: '236H',
  startup: 14, active: '14-22', recovery: '24', onHit: 'D', onBlock: '-11', cancel: 'SA3', damage: 800,
  driveGainHit: 2000, driveLossBlock: -4000, driveLossPunishCounter: -4000, superGain: 1350,
  attribute: ['上'], notes: '9-22F 上半身空中判定無敵。44-46F ヒット時 必殺技/SA キャンセル可。〆に使うとラッシュ2中K重ねの起き攻め（弱デガジェ〆と違い最速だとスカる）。モダンは強度自動選択',
}));
add('moves', 'manon-impact', mv({
  key: 'manon-impact', name: 'ドライブインパクト（グリッサード）', category: 'common',
  inputClassic: 'DI', inputModern: 'DI',
  startup: 26, active: '26-27', recovery: '35', onHit: 'D', onBlock: '-3', cancel: null, damage: 800,
  comboScaling: '始動補正20%', driveGainHit: 800, driveLossBlock: -5000, driveLossPunishCounter: -15000, superGain: 0,
  attribute: ['上'], notes: '1-27F アーマー判定（2回）。パニカン/アーマー成立後にヒットで 地上膝崩れ・SAゲージ3000増加。Dゲージ1本消費',
}));
add('moves', 'manon-manege-h', mv({
  key: 'manon-manege-h', name: '強マネージュ・ドレ（コマ投げ）', category: 'special',
  inputClassic: '63214HP', inputModern: '5SP',
  startup: 5, active: '5-7', recovery: '53', onHit: 'D', onBlock: null, cancel: null, damage: 2000,
  driveGainHit: 5000, driveLossBlock: 0, driveLossPunishCounter: -10000, superGain: 3000,
  attribute: ['投'], notes: '発生5F。中P>CDR>2中P ガード後（+3）の本命択。ヒット時メダルLv+1。ダメージ・SAゲージはメダルLv1（Lvで上昇）。モダンは強度自動選択',
}));

// ── situations ─────────────────────────────────────────────
add('situations', 'neutral_corner', sit({
  id: 'neutral_corner', label: '画面端・立ち回り', kind: 'neutral', position: 'corner', opponentState: 'neutral',
  advantage: '±0', tags: ['始動'], notes: '画面端は打撃択からのリターンが悪くない。ただしコマ投げが強いので端でインパクトを撃つならコマ投げの方が良いことが多い。',
}));
add('situations', 'kd_after_rondpoint_h_mid', sit({
  id: 'kd_after_rondpoint_h_mid', label: '強ロン・ポワン締め後・中央ダウン', kind: 'knockdown', position: 'midscreen',
  opponentState: 'knockdown_soft', wakeupNote: '受け身可', tags: [],
  notes: 'ラッシュ2中K重ねの起き攻め（弱デガジェ〆と違い最速だとスカるためタイミング要練習）。',
}));
add('situations', 'kd_after_degage_mid_mid', sit({
  id: 'kd_after_degage_mid_mid', label: '中デガジェ締め後・中央ダウン', kind: 'knockdown', position: 'midscreen',
  opponentState: 'knockdown_soft', wakeupNote: '受け身可', tags: [],
  notes: '確反・差し返しパニカンの〆。起き攻めルートはバッチ2では未整理（起き攻めは弱デガジェ〆の方が強い）。',
}));
add('situations', 'kd_after_ranversement_corner', sit({
  id: 'kd_after_ranversement_corner', label: 'ランヴェルセ締め後・画面端ダウン', kind: 'knockdown', position: 'corner',
  opponentState: 'knockdown_soft', wakeupNote: '受け身可', tags: [],
  notes: 'バッチ2では起き攻めルート未整理。',
}));
add('situations', 'juggle_di_pc', sit({
  id: 'juggle_di_pc', label: 'ドライブインパクト パニッシュカウンター・浮き/膝崩れ', kind: 'juggle', position: 'midscreen',
  opponentState: 'juggle', advantage: '膝崩れ', tags: [],
  notes: '相手のインパクト/技をパニカンで返した、またはアーマー成立後にヒット。前ステで距離を調整して 4強P で拾う。',
}));
add('situations', 'wall_splat_corner', sit({
  id: 'wall_splat_corner', label: 'ドライブインパクト 壁貼りつき・画面端', kind: 'juggle', position: 'corner',
  opponentState: 'wall_splat', advantage: '壁貼りつき', tags: [],
  notes: '画面端インパクト。ノーゲージコンボと同ルート（4強P → 弱ランヴェルセ）。',
}));
add('situations', 'blockstring_5mp_cr_2mp', sit({
  id: 'blockstring_5mp_cr_2mp', label: '中P CDR 2中P ガード後・+3有利', kind: 'blockstring', position: 'midscreen',
  opponentState: 'blockstun', advantage: '+3（連続ガード）', tags: [],
  notes: '強コマ投げ / 2中P・4強P で2択。中P がヒットしていた場合は同ルートでランヴェルセまで（メダル）。相手はジャンプするか無敵技を撃つかだけ考えればよく、非常に有利な読み合い。',
}));

// ── routes ─────────────────────────────────────────────────
add('routes', 'route_5mp_cr_2mp_blockstring', R({
  id: 'route_5mp_cr_2mp_blockstring', from: 'neutral_mid', to: 'blockstring_5mp_cr_2mp',
  kind: 'combo_route', label: '中P CDR 2中P（ガードさせ）',
  steps: [
    { move: '中P', command: '5MP', moveKey: 'manon-5mp', cancel: true },
    { move: 'キャンセルドライブラッシュ', command: 'DRC' },
    { move: '2中P', command: '2MP', moveKey: 'manon-2mp' },
  ],
  resources: { driveCost: 3, superCost: 0, saLevel: null },
  damage: 1200, difficulty: 3,
  constraints: 'ガードさせて +3 有利（連続ガード）。ヒットしていれば同ルートで 4強P→中ランヴェルセ',
  controlType: 'both',
  tags: ['CDR', '連携'],
}));
add('routes', 'route_2lp_rondpoint_h', R({
  id: 'route_2lp_rondpoint_h', from: 'neutral_mid', to: 'kd_after_rondpoint_h_mid',
  kind: 'combo_route', label: '2弱P×n → 強ロン・ポワン〆',
  steps: [
    { move: '2弱P', command: '2LP', moveKey: 'manon-2lp' },
    { move: '2弱P', command: '2LP', moveKey: 'manon-2lp', cancel: true, note: '連打キャンセル。弱P→2弱P でも可' },
    { move: '強ロン・ポワン', command: '236HK', moveKey: 'manon-rondpoint-h', cancel: true, note: 'OD含めどの強度でも可。迷ったら起き攻めもSA3も繋がる強。SA3なら弱が最ダメ' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 1400, difficulty: 1,
  constraints: '小技/4F暴れ始動。2弱P からは デガジェ は繋がらない',
  controlType: 'both',
  tags: ['とりこれ', '小技始動', 'ノーゲージ', '〆'],
}));
// route_lp_mp_degage_m / manon-punish-lp-mp-degage（弱P>中P>中デガジェ）は
// オーナー実機確認で「実戦で使えない」と判断され削除（2026-09-11）。
add('routes', 'route_5hk_pc_degage_m', R({
  id: 'route_5hk_pc_degage_m', from: 'neutral_mid', to: 'kd_after_degage_mid_mid',
  kind: 'combo_route', label: '強K パニカン → 中デガジェ〆',
  steps: [
    { move: '強K', command: 'PC 5HK', moveKey: 'manon-5hk', note: '遠めの差し返しがパニッシュカウンター' },
    { move: '中デガジェ', command: '214MK', moveKey: 'manon-degage-m', cancel: true, note: '弱/中デガジェ or SA2（SA2は3800dmg＋Dゲージ2削り）' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2100, difficulty: 2,
  constraints: '遠めの差し返し 強K がパニッシュカウンターした時',
  controlType: 'both',
  tags: ['パニカン', '差し返し', '〆'],
}));
add('routes', 'route_jhk_mp_degage_l', R({
  id: 'route_jhk_mp_degage_l', from: 'neutral_mid', to: 'kd_after_degage_light_mid',
  kind: 'combo_route', label: 'J強K → 中P → 弱デガジェ〆',
  steps: [
    { move: 'J強K', command: 'j.HK', moveKey: 'manon-jhk', note: '飛び道具読み前ジャンプ' },
    { move: '中P', command: '5MP', moveKey: 'manon-5mp', cancel: true },
    { move: '弱デガジェ', command: '214LK', moveKey: 'manon-degage-l', cancel: true, note: '〆。起き攻めが強い' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2400, difficulty: 2,
  constraints: '飛び道具読み前ジャンプが通った時。4強P が届かなそうならこちら。強ロン・ポワン>SA3 や ODロン・ポワン>SA2 も可',
  controlType: 'classic',
  tags: ['ジャンプ始動', '起き攻め', '〆'],
}));
add('routes', 'route_di_pc', R({
  id: 'route_di_pc', from: 'neutral_mid', to: 'juggle_di_pc',
  kind: 'starter', label: 'ドライブインパクト（返し / アーマー後）',
  steps: [{ move: 'ドライブインパクト', command: 'DI', moveKey: 'manon-impact', note: '相手のインパクト/技をパニカン、またはアーマー後にヒット' }],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 800, difficulty: 1,
  constraints: 'パニッシュカウンター or アーマー成立後にヒット（膝崩れ）',
  controlType: 'both',
  tags: ['インパクト返し'],
}));
add('routes', 'route_maesute_4hp_ranversement', R({
  id: 'route_maesute_4hp_ranversement', from: 'juggle_di_pc', to: 'kd_after_ranversement_mid',
  kind: 'ender', label: '前ステ → 4強P → 中ランヴェルセ',
  steps: [
    { move: '前ステップ', command: '66', action: 'dash', note: 'フレーム消費＋遠目で当たった時のケア' },
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: '中ランヴェルセ', command: '236MP', moveKey: 'manon-ranversement-m', cancel: true, note: 'メダルLv+1' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2200, difficulty: 2,
  constraints: 'インパクト膝崩れから。メダル1枚しかない時用（2枚あればコマ投げでよい）。ノーゲージ',
  controlType: 'both',
  tags: ['インパクト返し', 'メダル', '〆'],
}));
add('routes', 'starter_di_corner', R({
  id: 'starter_di_corner', from: 'neutral_corner', to: 'wall_splat_corner',
  kind: 'starter', label: '画面端 ドライブインパクト（壁貼りつき）',
  steps: [{ move: 'ドライブインパクト', command: 'DI', moveKey: 'manon-impact', note: '画面端で当てると壁貼りつき' }],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 800, difficulty: 1,
  constraints: '画面端。アクセントで撃つ程度（コマ投げの方が強いことが多い）',
  controlType: 'both',
  tags: ['インパクト', '画面端'],
}));
add('routes', 'route_di_wall_4hp_ranversement_l', R({
  id: 'route_di_wall_4hp_ranversement_l', from: 'wall_splat_corner', to: 'kd_after_ranversement_corner',
  kind: 'ender', label: '4強P → 弱ランヴェルセ',
  steps: [
    { move: '4強P', command: '4HP', moveKey: 'manon-4hp' },
    { move: '弱ランヴェルセ', command: '236LP', moveKey: 'manon-ranversement-l', cancel: true, note: 'メダルLv+1' },
  ],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2150, difficulty: 1,
  constraints: '画面端インパクト壁貼りつきから。ノーゲージコンボと同ルート',
  controlType: 'both',
  tags: ['インパクト', '画面端', '〆'],
}));

// 強ロン・ポワン〆 の起き攻め
add('routes', 'oki_dr2mk_from_rondpoint_h', R({
  id: 'oki_dr2mk_from_rondpoint_h', from: 'kd_after_rondpoint_h_mid', to: 'juggle_can_4hp_ranversement',
  kind: 'okizeme', label: 'ラッシュ2中K 重ね',
  steps: [
    { move: 'ドライブラッシュ', command: 'DR' },
    { move: '2中K', command: '2MK', moveKey: 'manon-2mk', note: '持続重ね' },
  ],
  resources: { driveCost: 1, superCost: 0, saLevel: null },
  damage: 600, difficulty: 4,
  constraints: '強ロン・ポワン〆から。弱デガジェ〆と違い最速だとスカる。タイミング要練習',
  controlType: 'both',
  properties: {
    frameAdvantage: { frames: '+5', note: '2中K 持続ガード時（弱デガジェ〆基準の推定）' },
    wakeup: { coverage: 'both', note: '最速だとスカる。タイミング調整が必要' },
    strongVs: ['暴れ'],
    weakVs: ['垂直ジャンプ', '無敵技'],
    useWhen: '強ロン・ポワン〆の起き攻め。安定は弱デガジェ〆',
    risk: '低',
  },
  tags: ['持続重ね'],
}));

// 中P>CDR>2中P ガード後の読み合い（blockstring setplay）
add('routes', 'bs_grab_5mp_cr_2mp', R({
  id: 'bs_grab_5mp_cr_2mp', from: 'blockstring_5mp_cr_2mp', to: 'kd_after_manege_dore_mid',
  kind: 'okizeme', label: '強コマ投げ（本命）',
  steps: [{ move: '強マネージュ・ドレ', command: '63214HP', moveKey: 'manon-manege-h' }],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 2000, difficulty: 2,
  constraints: '中P>CDR>2中P ガード後（+3）。本命択',
  controlType: 'classic',
  notes: SRC + ' モダンは強度自動選択。',
  properties: {
    frameAdvantage: { frames: '±0', note: 'コマ投げ・メダル+1' },
    strongVs: ['暴れ', 'ガード継続'],
    weakVs: ['前・バックジャンプ', '無敵技'],
    useWhen: '本命。相手のジャンプと無敵技以外の全てに勝ち、メダルを溜められる',
    onBlock: '—（投げ）',
    risk: '中',
  },
  tags: ['本命', '崩し', 'メダル'],
}));
add('routes', 'bs_2mp_5mp_cr_2mp', R({
  id: 'bs_2mp_5mp_cr_2mp', from: 'blockstring_5mp_cr_2mp', to: 'juggle_can_4hp_ranversement',
  kind: 'okizeme', label: '2中P（ジャンプ・バクステ潰し）',
  steps: [{ move: '2中P', command: '2MP', moveKey: 'manon-2mp', note: '当たれば確認で 4強P→中ランヴェルセ' }],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 600, difficulty: 2,
  constraints: '対の択。4F暴れには相打ち',
  controlType: 'both',
  properties: {
    frameAdvantage: { frames: '+6', note: '2中P ヒット時' },
    strongVs: ['前・バックジャンプ', 'バクステ'],
    weakVs: ['4F暴れ（相打ち）', '遅らせ暴れ'],
    useWhen: 'コマ投げを嫌ってジャンプ・バクステする相手に',
    onBlock: '-1',
    risk: '中',
  },
  tags: ['対の択', '確認'],
}));
add('routes', 'bs_4hp_5mp_cr_2mp', R({
  id: 'bs_4hp_5mp_cr_2mp', from: 'blockstring_5mp_cr_2mp', to: 'juggle_can_4hp_ranversement',
  kind: 'okizeme', label: '4強P（ジャンプ確認）',
  steps: [{ move: '4強P', command: '4HP', moveKey: 'manon-4hp', note: 'ジャンプにヒット確認で 4強P→中ランヴェルセ。ガードでもホールドでフェイント派生' }],
  resources: { driveCost: 0, superCost: 0, saLevel: null },
  damage: 800, difficulty: 2,
  constraints: '2中P と同用途。打撃暴れには負ける',
  controlType: 'both',
  properties: {
    frameAdvantage: { frames: '+3', note: '4強P ヒット時' },
    strongVs: ['前・バックジャンプ'],
    weakVs: ['打撃暴れ'],
    useWhen: 'ジャンプ潰し。ヒット確認で 4強P→中ランヴェルセ（メダル。2中P より高リターン）',
    onBlock: '+1',
    risk: '中',
  },
  tags: ['対の択', '確認', 'メダル'],
}));

// ── combos ─────────────────────────────────────────────────
add('combos', 'manon-mid-2lp-rondpoint', C({
  slug: 'manon-mid-2lp-rondpoint', name: '中央 2弱P始動 強ロン・ポワン〆',
  situationLabel: '中央・小技/4F暴れ始動', routeChain: ['route_2lp_rondpoint_h'],
  startFrom: 'neutral_mid', endAt: 'kd_after_rondpoint_h_mid', difficulty: 1,
  tags: ['とりこれ', 'ノーゲージ', '起き攻め'],
  description: '小技・4F暴れから。2弱P からは デガジェ 不可、ロン・ポワンは可。迷ったら起き攻めもSA3も繋がる強ロン・ポワン。' + SRC,
}));
// manon-punish-lp-mp-degage は削除（上記コメント参照）。
add('combos', 'manon-punish-5hk-pc-degage', C({
  slug: 'manon-punish-5hk-pc-degage', name: '差し返し 強K パニカン 中デガジェ〆',
  situationLabel: '遠めの差し返し（強K パニカン）', routeChain: ['route_5hk_pc_degage_m'],
  startFrom: 'neutral_mid', endAt: 'kd_after_degage_mid_mid', difficulty: 2,
  tags: ['パニカン', '差し返し'],
  description: '遠めの差し返し 強K がパニカンした時。中デガジェ or SA2（SA2は3800dmg＋Dゲージ2削りで強力）。' + SRC,
}));
add('combos', 'manon-jump-jhk-mp-degage', C({
  slug: 'manon-jump-jhk-mp-degage', name: 'ジャンプ始動 J強K 中P 弱デガジェ〆',
  situationLabel: '飛び道具読み前ジャンプが通った時', routeChain: ['route_jhk_mp_degage_l'],
  startFrom: 'neutral_mid', endAt: 'kd_after_degage_light_mid', difficulty: 2,
  tags: ['ジャンプ始動', '起き攻め'],
  description: '飛び道具読み前ジャンプが通った時。4強P が届かなそうならこちら。締めの弱デガジェから起き攻め。' + SRC,
}));
add('combos', 'manon-di-punish-ranversement', C({
  slug: 'manon-di-punish-ranversement', name: 'インパクト返し 前ステ 4強P 中ランヴェルセ〆',
  situationLabel: '相手インパクトをパニカンで返した', routeChain: ['route_di_pc', 'route_maesute_4hp_ranversement'],
  startFrom: 'neutral_mid', endAt: 'kd_after_ranversement_mid', difficulty: 2,
  tags: ['インパクト返し', 'メダル', 'ノーゲージ'],
  description: 'メダルが2枚あればコマ投げでよい。メダル1枚しかない時用のノーゲージコンボ。前ステはフレーム消費と遠目のケア。' + SRC,
}));
add('combos', 'manon-corner-di-wall-ranversement', C({
  slug: 'manon-corner-di-wall-ranversement', name: '画面端 インパクト壁貼りつき 4強P 弱ランヴェルセ〆',
  situationLabel: '画面端・ドライブインパクト', routeChain: ['starter_di_corner', 'route_di_wall_4hp_ranversement_l'],
  startFrom: 'neutral_corner', endAt: 'kd_after_ranversement_corner', difficulty: 1,
  tags: ['インパクト', '画面端', 'ノーゲージ'],
  description: 'ノーゲージインパクトコンボと同ルート。マノンはコマ投げが強いので、端でインパクトを撃つくらいならコマ投げの方が良いことが多い。' + SRC,
}));

// ── write ──────────────────────────────────────────────────
let n = 0;
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(draftsDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  n++;
}
console.log(`${n} 件の下書きを drafts/ に生成`);
process.exit(0);
