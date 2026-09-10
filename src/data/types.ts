// SF6 コンボ・セットプレイビューア — ドメイン型定義
// Phase 1（プロトタイプ）用。Phase 2 で Zod スキーマに移行する。

/** キャラクター識別子（MVP はマノンのみ） */
export type CharacterId = 'manon';

/** 立ち位置 */
export type Position = 'midscreen' | 'near_corner' | 'corner' | 'anywhere';

/** 相手のやられ状態 */
export type OpponentState =
  | 'neutral'
  | 'standing_hit'
  | 'crouch_hit'
  | 'juggle'
  | 'air'
  | 'wall_splat'
  | 'knockdown_soft'
  | 'knockdown_hard'
  | 'blockstun';

/** 状況ノードの種類 */
export type SituationKind =
  | 'neutral'
  | 'hit'
  | 'juggle'
  | 'knockdown'
  | 'blockstring'
  | 'okiStart';

/** パーツ（route）の種類 */
export type RouteKind =
  | 'starter'
  | 'combo_route'
  | 'okizeme'
  | 'ender'
  | 'conversion';

/** リスク評価 */
export type Risk = '低' | '中' | '高';

/** 操作タイプ対応 */
export type ControlType = 'classic' | 'both';

/**
 * 状況ノード。「次に何ができるか」を決めるゲーム状況。
 * 後続の選択肢が同じ状況は同一ノードに統合する（連結表現の肝）。
 */
export interface Situation {
  id: string;
  label: string;
  kind: SituationKind;
  position: Position;
  opponentState: OpponentState;
  /** 相手が動けるようになるまでの有利フレーム（任意テキスト。基本は後ろ受け身想定） */
  advantage?: string;
  /**
   * この状況（多くはダウン）で相手が取れる起き上がり方。
   * 例: "後ろ受け身可（基本は後ろ受け身）" / "後ろ受け身不可・その場のみ" / "受け身不可（強制ダウン）"
   */
  wakeupNote?: string;
  tags: string[];
  notes?: string;
}

/** コンボ 1 手 */
export interface Step {
  /** 技名（表示用）。moveKey があれば辞典の name を優先してよい */
  move: string;
  /** numpad 正準表記（例: 236MP, 2MK, DR, DRC）。クラシックの正 */
  command: string;
  /**
   * モダン操作のコマンド（明示指定）。
   * 未指定かつ moveKey があれば moves 辞典の inputModern を使う。
   * どちらも無ければ deriveModern() の粗い推定にフォールバック。
   */
  commandModern?: string;
  /**
   * 技辞典（moves コレクション）の key。フレームデータ・モダン入力の参照元。
   * DR / DRC / 66 / (微歩き) など「技ではない操作」では省略する。
   */
  moveKey?: string;
  /** 直前の技からキャンセルで繋ぐか */
  cancel?: boolean;
  note?: string;
}

/** 技のカテゴリ */
export type MoveCategory =
  | 'normal' // 通常技
  | 'unique' // 特殊技
  | 'special' // 必殺技
  | 'super' // スーパーアーツ
  | 'throw' // 投げ
  | 'common'; // 共通システム（ドライブ系など）

/**
 * 技ごとのフレームデータ辞典（4 層目）。1 技 1 レコード。
 * データ元: 公式フレームデータ（https://www.streetfighter.com/6/ja-jp/character/manon/frame）。
 * バランス調整で数値が変わるため verifiedVersion で確認時点を明示する。
 */
export interface Move {
  /** 参照キー（例: "manon-5mp" "manon-ranversement-m"）。Step.moveKey と対応 */
  key: string;
  character: CharacterId;
  /** 技名（公式表記。例: "立ち中P（ツリテ）"） */
  name: string;
  category: MoveCategory;

  /** クラシックの numpad 正準表記 */
  inputClassic: string;
  /**
   * モダンの入力（公式コマンドリスト準拠）。null = モダンに存在しない技。
   * 例: 中ランヴェルセ → "2SP"（↓+SP）、レベランス → "4H"（←+強）
   */
  inputModern: string | null;
  /** モダンでも通るクラシック式モーション入力（フルダメージ狙いなど）。任意 */
  inputModernPrecise?: string;

  /** 発生 F */
  startup: number | null;
  /** 持続（範囲表記があるため文字列。例 "4-6"） */
  active: string | null;
  /** 全体硬直 or 硬直 F（文字列許容。例 "着地後3"） */
  recovery: string | null;
  /** ヒット硬直差（例 "+4" "D"（ダウン）） */
  onHit: string | null;
  /** ガード硬直差 */
  onBlock: string | null;
  /** キャンセル可否（公式表記。例 "C" "SA" "SA3" "-"） */
  cancel: string | null;
  /** ダメージ（メダル Lv などで変動する技は代表値） */
  damage: number | null;

  /** コンボ補正値（例 "始動補正20%"） */
  comboScaling?: string | null;
  /** Dゲージ増加（ヒット） */
  driveGainHit?: number | null;
  /** Dゲージ減少（ガード） */
  driveLossBlock?: number | null;
  /** Dゲージ減少（パニッシュカウンター） */
  driveLossPunishCounter?: number | null;
  /** SAゲージ増加 */
  superGain?: number | null;

  /** 属性（例: ["上"] ["下"] ["投"]） */
  attribute?: string[];
  /** 備考（公式の「備考」列など） */
  notes?: string;
  /** この数値を確認したゲームバージョン */
  verifiedVersion: string;
}

/** 択の特徴（フロー図・パーツ詳細で表示） */
export interface RouteProperties {
  /**
   * 起き攻めの初回行動を重ねた（or 前ステ・微歩き等をした）後の有利フレーム。
   * このアプリで一番見たいフレーム情報。基本は後ろ受け身を想定した値。
   * 例: "+3", "+2（2中K持続当て）", "-1"
   */
  frameAdvantage?: string;
  /**
   * 受け身の種類ごとの対応（A-2）。旧 vsWakeup（文字列）を構造化したもの。
   * SOFT / HARD ダウンそのものは Situation.opponentState で判定する。
   * knockdown_hard（受け身なし）に紐づく起き攻めは wakeup を持たない。
   */
  wakeup?: {
    /** both＝両対応 / quick＝その場受け身のみ成立 / back＝後ろ受け身のみ成立 */
    coverage: 'both' | 'quick' | 'back';
    /** その場受け身に対するフレーム差・補足（成立する場合） */
    quickRise?: string;
    /** 後ろ受け身に対するフレーム差・補足（成立する場合） */
    backTech?: string;
    /** 補足（「動かないため起き上がり方に依存しない」等） */
    note?: string;
  };
  /** 有効な相手の行動・状況（例: パリィ／ガード継続、打撃暴れ） */
  strongVs?: string[];
  /** 弱い相手の行動（例: 垂直ジャンプ、無敵技） */
  weakVs?: string[];
  /** いつ選ぶか（一言） */
  useWhen?: string;
  /** ガードされた（重ならず空振り/最速ガードされた）時の状況 */
  onBlock?: string;
  /** 注意点（例: ドライブインパクト返し不可、先端当てないと反確） */
  caution?: string;
  risk?: Risk;
}

export interface RouteResources {
  /** Drive ゲージ消費本数 */
  driveCost: number;
  /** SA ゲージ消費本数 */
  superCost: number;
  /** 使用する SA レベル */
  saLevel: 1 | 2 | 3 | null;
}

/**
 * パーツ（辺）。ある状況から別の状況へ移す技の連なり。再利用単位。
 */
export interface Route {
  id: string;
  character: CharacterId;
  /** 開始状況ノード id */
  from: string;
  /** 終了状況ノード id */
  to: string;
  kind: RouteKind;
  label: string;
  steps: Step[];
  resources: RouteResources;
  /** このパーツ単体のダメージ目安 */
  damage: number;
  /** ★1〜5 */
  difficulty: number;
  /** 補正・やられ判定・ジャンプ数などの制約（Phase 1 は自由記述） */
  constraints?: string;
  properties?: RouteProperties;
  controlType: ControlType;
  tags: string[];
  video?: { youtubeId: string; start: number } | null;
  notes?: string;
}

/**
 * コンボ（名前付き経路）。routes の連結として定義。
 */
export interface Combo {
  slug: string;
  character: CharacterId;
  name: string;
  /** 一覧などで見せる状況ラベル */
  situationLabel: string;
  /** 連結する route id の並び。route[i].to === route[i+1].from を満たす */
  routeChain: string[];
  /** routeChain[0].from と一致 */
  startFrom: string;
  /** routeChain[last].to と一致 */
  endAt: string;
  damageOverride?: number | null;
  driveCostOverride?: number | null;
  difficulty: number;
  tags: string[];
  video?: { youtubeId: string; start: number } | null;
  description?: string;
}
