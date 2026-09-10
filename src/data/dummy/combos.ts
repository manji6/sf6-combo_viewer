import type { Combo } from '../types';

// ダミーのコンボ（名前付き経路）。routeChain は route[i].to === route[i+1].from を満たす。

export const combos: Combo[] = [
  {
    slug: 'manon-mid-2mk-bnb-degage',
    character: 'manon',
    name: '中央 2中K始動 弱デガジェ〆（基本）',
    situationLabel: '中央・下段差し込みから',
    routeChain: ['starter_2mk_mid', 'route_2mk_confirm_degage'],
    startFrom: 'neutral_mid',
    endAt: 'kd_after_degage_light_mid',
    difficulty: 2,
    tags: ['基本', 'ノーゲージ', '実戦'],
    description:
      'まず覚える基本コンボ。締めの弱デガジェ後は「弱デガジェ締め後・中央ダウン」から起き攻め四択に移行できる。',
  },
  {
    slug: 'manon-mid-5mp-drc-ranversement',
    character: 'manon',
    name: '中央 5中P DRC 中ランヴェルセ〆（頻出）',
    situationLabel: '中央・地上ヒット確認',
    routeChain: ['starter_5mp_drc_2mp_mid', 'route_4hp_ranversement_mid'],
    startFrom: 'neutral_mid',
    endAt: 'kd_after_ranversement_mid',
    difficulty: 3,
    tags: ['頻出', 'DRC', '実戦'],
    description:
      '5中P ヒット確認からキャンセルドライブラッシュで火力を伸ばす主力コンボ。後半の「4強P → 中ランヴェルセ」は起き攻め DR2中K からのルートと共有パーツ。',
  },
  {
    slug: 'manon-mid-5mp-drc-sa3',
    character: 'manon',
    name: '中央 5中P DRC SA3〆（とどめ）',
    situationLabel: '中央・地上ヒット確認（SA3所持）',
    routeChain: ['starter_5mp_drc_2mp_mid', 'route_4hp_sa3_mid'],
    startFrom: 'neutral_mid',
    endAt: 'kd_after_pas_de_deux_mid',
    difficulty: 3,
    tags: ['SA3', 'とどめ', '高火力'],
    description: '同始動から締めを SA3 パ・ド・ドゥに変更。メダル最大で最大火力。',
  },
  {
    slug: 'manon-punish-5hp-rondpoint',
    character: 'manon',
    name: 'パニカン 5強P ロン・ポワン〆',
    situationLabel: '中央・パニッシュカウンター',
    routeChain: ['starter_5hp_pc_mid', 'route_pc_5hp_rondpoint'],
    startFrom: 'neutral_mid',
    endAt: 'kd_after_rondpoint_mid',
    difficulty: 2,
    tags: ['パニカン', 'ノーゲージ'],
    description: '差し返し・ぶっ放しへのパニッシュカウンター確認。',
  },
  {
    slug: 'manon-corner-2mk-medal',
    character: 'manon',
    name: '画面端 2中K メダル回収 ODロン・ポワン〆',
    situationLabel: '画面端・下段始動',
    routeChain: ['starter_corner_2mk', 'route_corner_medal_loop'],
    startFrom: 'neutral_corner',
    endAt: 'kd_after_rondpoint_corner',
    difficulty: 3,
    tags: ['画面端', 'メダル', 'ゲージ', '実戦'],
    description: '画面端でメダルを一気に稼ぐルート。締めの強制ダウンから強力な起き攻め。',
  },
  // 注（A-4）: セットプレイのフル一本（起き攻め1択がヒットして先まで繋がる流れ）は
  // Combo レコードにしない。セットプレイフロー（状況ノード＋okizeme route の再帰展開）で表現する。
];
