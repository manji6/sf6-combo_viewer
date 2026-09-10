# SF6 コンボ・セットプレイビューア — 仕様・設計・実装まとめ

最終更新: 2026-09-10（Phase 1 プロトタイプ、レビュー反映後。スキーマ決定 A-1〜A-4 を反映）
このドキュメントが現状の唯一の正。承認済みの元計画は `C:\Users\ryosu\.claude\plans\web-iridescent-flame.md`、
レビュー用の短いガイドは `docs/PROTOTYPE.md`。

> **A-1〜A-4（2026-09-10 決定・実装済み）**: 要約は §3.0。
> スキーマ本体（`src/data/types.ts`）・ダミーデータ・描画への適用まで完了。
> U-7（コマンド表記の公式配色・SP/AUTO/DR）も同時に反映済み。

---

## 1. 概要

Street Fighter 6 のコンボと**起き攻めセットプレイ（分岐択）**を「見て」理解するための一般公開向け閲覧サイト。

- 既存のコンボ情報の課題: 表記がテキスト主体で読みにくい／起き攻めの分岐と各択の特徴が構造化されていない／
  コンボが実は「再利用パーツの組み合わせ」なのにその連結を追えない
- 解決: ゲーム状況を**ノード**、技の連なり（パーツ）を**辺**とする有向グラフでコンボ／セットプレイを表現。
  レシピはアイコン／テキスト両表記、起き攻めは ComfyUI 風のノードグラフ、パーツ連結はビジュアル相関グラフで見せる

### フェーズ

| | Phase 1（現在） | Phase 2 |
|---|---|---|
| 目的 | UI/UX をダミーデータで作り切り、レビューで確定 | 本開発 |
| データ | 素の TS 配列（`src/data/dummy/*.ts`）、マノンのみ、すべて仮 | Content Collections + Zod、実データ、複数キャラ |
| 成果物 | 全画面が実物コンポーネントで動く Astro 最小アプリ | SEO・登録 Skill・デプロイまで |

**現在地**: Phase 1 実装済み・レビュー中。`npm run build` 45 ページ、`astro check` 0 エラー。

### 決定事項

| 項目 | 決定 |
|---|---|
| フレームワーク | Astro（静的出力）+ TypeScript + Tailwind v4 + Preact（インタラクティブな島のみ） |
| ホスティング | Cloudflare Pages（GitHub 連携）、既存 Cloudflare ドメインを割当（Phase 2） |
| データ入力 | リポジトリ内ファイルを手編集 → push で自動ビルド（DB なし） |
| 対象 | マノンのみ。将来キャラ追加・管理画面・外部投稿・i18n・動画 |
| 言語 | 日本語中心（UI 文言は将来 i18n 可能な形）。用語は「起き攻め」（「置き攻け」ではない） |
| 難易度 | ★1〜5 |
| コマンドアイコン | 矢印は自作 SVG（回転）、攻撃ボタンは CSS チップ。pixelarticons（MIT）は導入済みだが未配線 |

---

## 2. 機能要件（レビューで固まったもの含む）

### 2.1 コンボ

- 「コンボ」＝**始動技から始まる伸ばし方**。相手の状況を問わず「この技が当たったらどこまで伸びるか」
- 始動が特定状況（`knockdown` / `okiStart` / `blockstring`）のものはコンボ一覧から除外し、セットプレイ側で扱う
- **（A-4）セットプレイの「フル一本」は `Combo` レコードにしない**。起き攻めの1択がヒットして先まで繋がる流れは
  セットプレイフロー（状況ノード＋`okizeme` route の再帰展開）が表現する。`Combo` は「始動技から始まり、
  名前を付けて一覧・検索する価値があるもの」だけ。ダミーの `manon-oki-degage-dr2mk-ranversement` は削除対象
- 一覧: フィルタ（立ち位置・始動・Dゲージ・SA・モダン可否・タグ）＋ソート（ダメージ／難易度／名前）。
  絞り込み状態は URL クエリに同期（共有・リロードで復元）
- 詳細: **コンボフロー**（後述のノードグラフ）＋テキスト表記（折りたたみ）＋パーツ連結の逆引き＋締め後の起き攻めへの導線

### 2.2 セットプレイ（起き攻め）

- 「セットプレイ」＝**特定の状況から始まる読み合い**（○○締め後のダウン、△△をジャストパリィ後 など）
- 起点（状況ノード）ごとに、**分岐択を破線で扇状表示**（ComfyUI 風フロー）。
  ヒット後はコンボ継続を実線でたどり、次のダウンでまた扇状展開（＝完全再帰。ループ／既出／深さで打ち切り）
- 各択について次を持てる・表示する（`RouteProperties`）:
  - **`frameAdvantage`** … 起き攻めの初回行動を重ねた後の有利フレーム（このアプリで一番見たい値。基本は後ろ受け身想定）
  - **`wakeup`（A-2）** … 受け身の種類ごとの対応を**構造化して**持つ。
    `coverage: 'both' | 'quick' | 'back'`（両対応／その場受け身のみ／後ろ受け身のみ）＋
    `quickRise?` / `backTech?`（それぞれの受け身に対するフレーム差・補足テキスト）。
    「その場受け身のみ繋がる／後ろ受け身のみ繋がる／両対応」がフィルタ・条件分岐で扱えるようになる
  - `strongVs` / `weakVs` … 有効・苦手な相手の行動
  - `caution` … 注意点（例「ドライブインパクトで割り込まれる」「先端当てないと反確」）
  - `onBlock` / `useWhen` / `risk`（低/中/高）
- 起き攻めの初回行動は **DR 以外も表現可能**: 微歩き `(微歩き)` / 前ステップ `66` / フレーム消費技（5弱P 空振り、`note` に「当てない」）
- 状況ノード側は `advantage`（相手が動けるまでの有利F）と `wakeupNote`（そのダウンで相手が取れる受け身、後ろ受け身可否）を持つ
- **SOFT / HARD ダウンの区別は状況ノードの `opponentState`** で表す（`knockdown_soft`＝受け身可／`knockdown_hard`＝強制ダウン・受け身不可）。
  `wakeup` は「受け身が取れるダウン（soft）」で受け身の種類ごとの成否を、`opponentState` は「そもそも受け身が取れるか」を担当する

### 2.3 コマンド表記

- 正準表記は **numpad**（236・214 等）で保存
- **アイコン ⇄ テキスト**をヘッダーのトグルで切替（`data-notation`、localStorage `sf6cv:notation`、FOUC 回避の inline script）
- **配色は公式 SF6 準拠（U-7）**: 弱＝シアン `--btn-l` / 中＝イエロー `--btn-m` / 強＝レッド `--btn-h`。
  - **OD**（オーバードライブ）は色を付けず、`OD` の接頭ラベル ＋ ボタン2つ（PP/KK）で表す
  - **DR / CDR** は緑 `--btn-dr`（`.nt-meta[data-m]` で着色）。「ドライブラッシュ＝緑」
  - **SP**（モダン必殺技ボタン）はオレンジのベタ角丸 `--btn-sp`
  - **AUTO**（モダンのアシスト）は濃グレーのピクセル調バッジ `--btn-auto`（旧 `AS`）
  - ライトテーマは各色を暗めに再定義
- **クラシック ⇄ モダン**は**コンボフロー単位**で切替（ヘッダーではない。コンボごとに可否が違うため）
  - `comboSupportsModern`（本線が全パーツ `controlType:'both'`）が真のコンボだけ「モダン」ボタンが有効。
    クラシックのみのコンボは「モダン」を disabled 表示
  - モダンにすると `controlType:'classic'` のパーツはグラフから**消える**（データ駆動。classic 版・modern 版の 2 グラフを持つ）
  - モダン記法: 必殺技＝「方向 ＋ `SP`」、OD 必殺技＝「方向 ＋ `AUTO` ＋ `SP`」、通常/特殊技＝「方向 ＋ 弱中強（P/K なし）」。
    技ごとの正確なモダン入力は `moves` 辞典の `inputModern`（§3.7）。未整備の技は `deriveModern()` の粗い推定にフォールバック
  - ルート詳細ページにも手順のクラシック/モダン小トグル（`controlType:'both'` のときだけ）＋技辞典のフレーム（発生／ヒット／ガード）併記

### 2.4 相関グラフ（全体マップ）

- 方針: **「軽い地図」として残す**（案A）。個別のコンボフローと役割が被らず、ハブ構造の把握に効く
- `/manon/graph/`＝マノン全体、ルート詳細の「周辺の相関」＝そのパーツの周辺1ホップ
- `SystemMap.tsx`（`@dagrejs/dagre` + 素の SVG）。丸枠＝状況ノード（kind で色）、ベジェ＝パーツ（役割で色）。
  pan/zoom・辺の種類フィルタ・クリックで各詳細へ。「起き攻め」の辺を隠すとコンボの骨組みだけ見える

### 2.5 その他 UI

- ヘッダーは **「キャラクター ▾」ホバードロップダウン**（キャラが増えても横に伸びない）。
  focus-within でキーボード対応、640px 以下は静的展開
- ダーク ⇄ ライトのテーマトグル（`data-theme`、localStorage `sf6cv:theme`、`prefers-color-scheme` 既定）。
  色は `:root`（ダーク基準）＋ `:root[data-theme='light']` で risk / button を濃いめに再定義
- ピクセル調レトロテーマ、モバイルファースト

---

## 3. データモデル（3層グラフ ＋ キャラ）

型定義: **`src/data/types.ts`（これが仕様の正）**。データ本体: `src/data/dummy/{characters,situations,routes,combos}.ts`（Phase 2 で JSON + Zod へ）。

### 3.0 スキーマ決定（A-1〜A-4 / 2026-09-10）

| # | 決定 | 反映先 |
|---|---|---|
| **A-1** | **`moves` コレクション（4層目＝技ごとのフレームデータ辞典）を作る**。データ元は公式フレームデータ（後述）。`Step` に `moveKey?` を足して技辞典と紐付ける | §3.1 `Step.moveKey` / §3.7 `Move` |
| **A-2** | 受け身状態を**構造化データ化**する。`RouteProperties.vsWakeup`（文字列）を廃止し `RouteProperties.wakeup { coverage, quickRise?, backTech? }` にする。SOFT/HARD は `Situation.opponentState` で表す（変更なし） | §3.2 `RouteProperties.wakeup` |
| **A-3** | 立ち位置バケットは**現状維持**（`midscreen` / `near_corner` / `corner` / `anywhere`）。スキーマ変更なし。運用ルールだけ明文化：多くは `midscreen` か `corner`。`near_corner`＝「端付近（多少の距離調整が効くが端限定ではない）」は一部のみ、乱用しない | §3.4 補足 / Phase 2 `CONTENT.md` |
| **A-4** | セットプレイのフル一本は `Combo` レコードにしない（§2.1 参照）。ダミーの `manon-oki-degage-dr2mk-ranversement` は削除 | §2.1 / §3.3 |

**実装済み**（型・ダミーデータ・描画）:
- `src/data/dummy/moves.ts`（マノン 16 技）＋ `src/data/index.ts` の `getMove` / `moveByKey` / `stepModernCommand`
- `Step` は `command`（クラシックの正）を保持しつつ `moveKey` で辞典を参照。モダン表記は
  `stepModernCommand()` が「明示 `commandModern` > 辞典 `inputModern` > `deriveModern()` 推定」の順で解決
- `RouteProperties.wakeup` → `src/lib/ui.ts` の `wakeupSummary()` が 1 行テキスト化、フロー枠／パーツ詳細／状況詳細で表示
- パーツ詳細の「手順」に技辞典のフレーム（発生／ヒット／ガード）を併記
- `validateAll()` に `moveKey` の実在チェックを追加

**要検証（オーナー）**: モダンの通常技割り当て（`5M` / `2M` が「ツリテ／ヒキテ／ストゥニュー」のどれか）。
`moves.ts` に仮値＋ notes を入れてある。`5MP`=ツリテ→`5M` は確実、`2MP`/`2MK` は未確認。

### 3.1 `Step` — 1 手（レシピの最小単位）

```ts
interface Step {
  move: string;            // 技名（表示用。moveKey があれば辞典 name を優先してよい）
  command: string;         // numpad 正準表記（クラシックの正。"5MP" "DR" "66" "(投げ)" 等）
  commandModern?: string;  // モダン入力の明示指定（通常は不要）
  moveKey?: string;        // （A-1）moves 辞典の key。モダン入力・フレームの参照元。
                           //        DR / DRC / 66 / (微歩き) など「技でない操作」では省略
  cancel?: boolean;        // 直前の技からキャンセルで繋ぐか
  note?: string;           // "最速重ね" 等の機能的メモ（ナレーション禁止）
}
```

- `command` はクラシック表記の正として常に持つ（辞典と二重持ちだが Phase 1 は許容。`moveKey` があれば辞典を裏取りに使える）
- モダン表記は `stepModernCommand(step)` が「`commandModern` > `moves[moveKey].inputModern` > `deriveModern(command)`」の順で解決

### 3.2 `Route` — パーツ＝**レシピの実体**

「ある状況 → 別の状況」へ移す技の連なり。再利用単位。

```ts
interface Route {
  id: string;
  character: 'manon';
  from: string;                 // 開始状況ノード id
  to: string;                   // 終了状況ノード id
  kind: 'starter' | 'combo_route' | 'okizeme' | 'ender' | 'conversion';
  label: string;
  steps: Step[];                // ← レシピ本体
  resources: { driveCost: number; superCost: number; saLevel: 1|2|3|null };
  damage: number;               // このパーツ単体のダメージ目安
  difficulty: number;           // ★1〜5
  constraints?: string;         // 補正・やられ判定・ジャンプ数などの制約（Phase 1 は自由記述）
  properties?: RouteProperties; // 主に okizeme の「択の特徴」
  controlType: 'classic' | 'both';
  tags: string[];
  video?: { youtubeId: string; start: number } | null;
  notes?: string;
}

interface RouteProperties {
  frameAdvantage?: string;  // 起き攻め初回行動後の有利F（例 "+2（2中K持続当て）"）
  wakeup?: {                // （A-2）受け身の種類ごとの対応。旧 vsWakeup（文字列）を置き換え
    coverage: 'both' | 'quick' | 'back';  // 両対応 / その場受け身のみ / 後ろ受け身のみ
    quickRise?: string;    // その場受け身に対するフレーム差・補足（例 "+1、密着"）
    backTech?: string;     // 後ろ受け身に対するフレーム差・補足（例 "-1、間合いが開く"）
  };
  strongVs?: string[];
  weakVs?: string[];
  useWhen?: string;
  onBlock?: string;
  caution?: string;
  risk?: '低' | '中' | '高';
}
```

- `coverage` の意味: `both`＝どちらの受け身でも重ね／連係が成立、`quick`＝その場受け身にしか間に合わない、
  `back`＝後ろ受け身にしか届かない（追走系）。`quickRise` / `backTech` は成立する側のみ埋めればよい
- SOFT/HARD ダウンそのものは `Situation.opponentState`（`knockdown_soft` / `knockdown_hard`）で判定。
  `knockdown_hard` の状況に紐づく起き攻めは `wakeup` を持たない（受け身が発生しないため）

### 3.3 `Combo` — 名前付き経路（**Route の連結だけ**）

技は入れず、Route の ID を並べるだけ。レシピ・合計ダメージ・ゲージは描画時に導出。

**（A-4）`Combo` にするのは「始動技から始まり、名前を付けて一覧・検索する価値があるもの」だけ。**
セットプレイの1択がヒットして先まで繋がる流れは `Combo` にせず、セットプレイフロー（状況ノード＋`okizeme` route の
再帰展開）で見せる。ダミーの `manon-oki-degage-dr2mk-ranversement` は削除する。

```ts
interface Combo {
  slug: string;
  character: 'manon';
  name: string;
  situationLabel: string;       // 一覧で見せる状況ラベル
  routeChain: string[];         // route id の並び（route[i].to === route[i+1].from）
  startFrom: string;            // routeChain[0].from と一致
  endAt: string;                // routeChain[last].to と一致
  damageOverride?: number | null;
  driveCostOverride?: number | null;
  difficulty: number;
  tags: string[];
  video?: { youtubeId: string; start: number } | null;
  description?: string;
}
```

### 3.4 `Situation` — 状況ノード

「次に何ができるか」を決めるゲーム状況。**後続の選択肢が同じ状況は同一ノードに統合**する（連結表現の肝）。

```ts
interface Situation {
  id: string;
  label: string;
  kind: 'neutral' | 'hit' | 'juggle' | 'knockdown' | 'blockstring' | 'okiStart';
  position: 'midscreen' | 'near_corner' | 'corner' | 'anywhere';
  opponentState: 'neutral'|'standing_hit'|'crouch_hit'|'juggle'|'air'|'wall_splat'|'knockdown_soft'|'knockdown_hard'|'blockstun';
  advantage?: string;    // 相手が動けるまでの有利F
  wakeupNote?: string;   // そのダウンで相手が取れる起き上がり方（後ろ受け身可否など）
  tags: string[];        // "起き攻め開始" 等
  notes?: string;
}
```

**（A-3）`position` の運用ルール**（スキーマは変更しない）:

- 実際のセットプレイはほとんどが `midscreen` か `corner`。まずこの2つで考える
- `near_corner`＝「端付近。多少の距離調整は効くが厳密な端限定ではない」。一部の設置にだけ使い、**乱用しない**
- `anywhere`＝位置を問わず同じ択（`neutral` 始動のコンボ始点など）
- 詳しい判断基準は Phase 2 の `CONTENT.md`（コンテンツ作成ガイド）に移す

### 3.5 連結の肝（具体例）

起き攻め `oki_dr2mk_from_degage_light` と頻出コンボ内 `starter_5mp_drc_2mp_mid` が
どちらも `juggle_can_4hp_ranversement` ノードに到達し、締めパーツ `route_4hp_ranversement_mid` を**共有**
→ 「起き攻めの DR2中K から入るパーツが頻出コンボの一部でもある」を表現。

### 3.6 整合性ルール（`src/lib/graph/derive.ts` の `validateAll()`。ビルド時に警告）

- 各 route の `from` / `to` が実在する状況 id か
- 各 combo の `routeChain` が連続（`route[i].to === route[i+1].from`）、`startFrom` / `endAt` が端と一致
- 孤立ノード（接続パーツなし）の検出
- （A-1 適用後）`Step.moveKey` が実在する `Move.key` か

### 3.7 `Move` — 技ごとのフレームデータ辞典（4層目 / A-1）

**決定（A-1・実装済み）**: 技の発生・硬直差・ダメージ等を1技1レコードで持つ辞典 `moves` を作る。
本体は `src/data/dummy/moves.ts`（マノン 16 技）。`Step.moveKey` で参照し、モダン入力とフレームをここから引く。

```ts
type MoveCategory = 'normal' | 'unique' | 'special' | 'super' | 'throw' | 'common';

interface Move {
  key: string;              // 参照キー（例 "manon-5mp" "manon-ranversement-m"）
  character: 'manon';
  name: string;             // 技名（公式表記。例 "立ち中P（ツリテ）"）
  category: MoveCategory;

  inputClassic: string;     // numpad 正準表記
  inputModern: string | null;      // モダン入力。null = モダンに存在しない技
  inputModernPrecise?: string;     // モダンでも通るクラシック式モーション（フルダメージ狙い等）

  startup: number | null;   // 発生
  active: string | null;    // 持続（"4-6" など範囲表記のため string）
  recovery: string | null;  // 全体/硬直（"着地後3" 等があるため string）
  onHit: string | null;     // ヒット硬直差（"+4" "D"＝ダウン 等）
  onBlock: string | null;   // ガード硬直差
  cancel: string | null;    // キャンセル可否（"C" "SA" "SA3" 等、公式表記）
  damage: number | null;

  comboScaling?: string | null;           // コンボ補正値（"始動補正20%" 等）
  driveGainHit?: number | null;
  driveLossBlock?: number | null;
  driveLossPunishCounter?: number | null;
  superGain?: number | null;

  attribute?: string[];     // 属性（["上"] ["下"] ["投"] 等）
  notes?: string;
  verifiedVersion: string;  // この数値を確認したゲームバージョン
}
```

**モダン入力の考え方（実装）**: モダン必殺技は「方向＋SP」、OD は「方向＋AUTO＋SP」で、
クラシックの motion とは別物。技ごとに違い機械変換できないため `inputModern` に手入力する。
`deriveModern()` は辞典に無い技だけの粗いフォールバックに格下げ。
「モダンでも通る motion 入力」は `inputModernPrecise` に持つ（併記用、任意）。

**データ元**: 公式フレームデータ／コマンドリスト
`https://www.streetfighter.com/6/ja-jp/character/manon/frame` ・ `.../movelist`。
列は 技名／発生・持続・硬直／ヒット硬直差・ガード硬直差／キャンセル／ダメージ／コンボ補正値／
Dゲージ増減／SAゲージ増加／属性／備考。**WebFetch は 403（Cloudflare）で不可、ブラウザでは閲覧可**。
コマンドリストは クラシック／モダン 切替あり。IP は Capcom（dustloop / 対空 UFD と同じ非商用ファンツールのグレー領域として扱う）。

**バージョン管理**: バランス調整でフレームが変わるため各レコードに `verifiedVersion` を持たせ、
パッチ時は差分だけ追随する（`CONTENT.md` に更新手順を書く）。

---

## 4. 画面・ルート

| ルート | 内容 |
|---|---|
| `/` | トップ。サイト説明＋キャラ選択（現在マノンのみ、`#characters`） |
| `/manon/` | マノン ハブ。「コンボ一覧」タブ（フィルタ／ソート／URL 同期）と「セットプレイ」タブ（起き攻め起点の一覧）。各タブに定義の説明文。相関グラフへの導線 |
| `/manon/combos/[slug]/` | コンボ詳細。**コンボフロー**（ノードグラフ、クラシック/モダントグル、全画面）＋テキスト表記（折りたたみ）＋パーツと連結（逆引き）＋締め後の起き攻め |
| `/manon/situations/[id]/` | 状況ノード詳細。見出しに `advantage` / `wakeupNote`。**起き攻めフロー**（ノードグラフ）＋各択の特徴カード（frameAdvantage / wakeup / strong / weak / caution / ガード時 / 難易度、クラシック限定バッジ）＋ in/out パーツ一覧＋この状況を通るコンボ |
| `/manon/routes/[id]/` | パーツ詳細。手順（クラシック/モダン小トグル）＋データ表＋択の特徴（frameAdvantage / wakeup 含む）＋連結（このパーツを使うコンボ・同起点/同着地点の他パーツ）＋周辺の相関（SystemMap） |
| `/manon/graph/` | 全体相関グラフ（SystemMap） |
| `/guide/notation/` | コマンド表記の凡例 |
| `/about/` | サイトについて |

### 4.1 コンボ／起き攻めのノードグラフ（`FlowCanvas.tsx`）

- ComfyUI 風。1 手＝1 ノードで左→右、パーツごとにグループ枠
- エッジ: 実線＝コンボ本線／水色＝分岐（別の締めなど）／破線＝起き攻め（accent 色）
- 起き攻めグループの枠に**その択の特徴**を表示（緑バッジ「初回行動後 +2」＋ 起き上がり ＋ ◯有効/×苦手/⚠注意 ＋ リスク ＋ 詳細リンク）
- outcome ノード（状況）: ダウンなら「相手復帰まで +38 前後」。`loop`／`repeat`（既出）／`more`（この先へ）を帯表示
- ツールバー: クラシック/モダン（有効時）・全体表示・先頭へ・＋/−・**全画面**（Esc で閉じる）
- 実装: `src/lib/graph/flow.ts` が step 単位の DAG を生成
  - `buildComboFlow(combo, control)` / `buildSituationFlow(id, control)`
  - `expandFrom()` が完全再帰（`OKI_MAX_DEPTH_COMBO = 1` / `OKI_MAX_DEPTH_SITUATION = 2`、ループ・既出・深さで打ち切り）
  - `control='modern'` で `controlType:'classic'` のパーツを除外
- レイアウトは `@dagrejs/dagre`（LR）＋ 2 パス実測（非表示で実寸を測ってから配置）＋ 枠の縦重なりをスイープで解消

### 4.2 相関グラフ（`SystemMap.tsx`）

- `@dagrejs/dagre` LR ＋ 素の SVG。dagre のエッジ経路を使い平行エッジを分離
- ノードラベルは最大2行、エッジは細く薄く＋ホバー強調、辺の種類フィルタ

### 4.3 コマンド表記（`src/lib/notation/`）

- `parse.ts` … `parseCommand()` がトークン化、`tokensToText()` / `deriveModern()`
- `tokens.ts` … 方向→角度/文字、強度ラベル/色、メタ（DR / DRC=CDR / SA 等）
- `Tokens.astro`（Astro）/ `Notation.tsx`（Preact）… クラシック・モダン両方を出力し CSS `[data-control]` で切替
- `Sequence.astro` … `Tokens` のラッパ（`command` + `commandModern`）

---

## 5. 実装構成

### 技術スタック

- Astro `^7.3` / TypeScript strict / Tailwind v4（`@tailwindcss/vite`）/ Preact（`@astrojs/preact`）
- `@dagrejs/dagre` … グラフレイアウト（FlowCanvas・SystemMap 共通）
- 静的出力（`output` 未指定＝static）。インタラクティブ部分だけ Preact 島（`client:only="preact"`）
- 検証: `npm run build`（45 ページ）＋ `npx astro check`（0 エラー）
- 開発: `npm run dev`（CLAUDE.md 記載どおり `astro dev --background` 推奨）

### ディレクトリ

```
src/
  data/
    types.ts            ← ★ データ構造の仕様
    characters.ts
    dummy/{situations,routes,combos,moves}.ts   ← ダミーデータ（Phase 2 で JSON へ）。moves.ts＝技辞典（A-1）
    index.ts            re-export ＋ ID 索引（getRoute / getSituation / getCombo）
  lib/
    notation/{parse,tokens}.ts
    graph/
      derive.ts         outgoing/incoming・combosUsingRoute 逆引き・flattenCombo・validateAll・comboSupportsModern
      flow.ts           buildComboFlow / buildSituationFlow（step 単位 DAG、expandFrom 完全再帰）
      systemmap.ts      fullGraph() / neighborhood()（相関グラフ用データ）
    ui.ts               ラベル・Stars・driveLabel など
  components/
    notation/{Tokens,Sequence,Arrow}.astro
    islands/{FlowCanvas,SystemMap,Notation}.tsx
    {ComboCard,ComboExplorer,StepList,Stars,NotationToggle,ThemeToggle}.astro
  layouts/BaseLayout.astro    ヘッダー（キャラドロップダウン・トグル）・フッター・テーマ/表記の inline 初期化
  pages/…                     §4 参照
  styles/global.css           テーマトークン（ダーク基準＋light 上書き）・ピクセル調・notation の CSS
docs/{SPEC.md, PROTOTYPE.md}
```

### localStorage / DOM フラグ

| キー / 属性 | 用途 |
|---|---|
| `sf6cv:theme` / `<html data-theme>` | ダーク・ライト（既定は `prefers-color-scheme`） |
| `sf6cv:notation` / `<html data-notation>` | アイコン・テキスト（既定アイコン） |
| （永続化なし）/ `.fc[data-control]` ・ルート詳細の `[data-ctl-root]` | クラシック・モダン（コンボ／パーツ単位、既定クラシック） |

---

## 6. これまでの経緯（レビュー反映履歴）

| コミット | 反映内容 |
|---|---|
| `d875688` | Phase 1 プロトタイプ初版（マノン、ダミーデータ、当初は入れ子リストの樹形図＋Cytoscape 相関グラフ） |
| `a0ba8ae` | **コンボ／起き攻めを ComfyUI 風のノードグラフ表示に全面変更**（樹形図＋step単位DAG＋FlowCanvas）。要望: レシピは左→右、状況→技がノードでつながる、締めから起き攻めは破線 |
| `157fa5f` | ノードの2行折返し不具合、キャンバスの最大幅（full-bleed 化）、DR/CDR 表記、SA3 の行き先を専用ノードに分離 |
| `2004611` | 起き攻め枠に「その択の特徴」を表示（技名の二重表示解消）、非DR始動（微歩き・前ステップ・フレーム消費技）、**全画面ボタン**、用語「置き攻け」→「起き攻め」 |
| `42c5fd9` | ライト配色の可読性、枠の重なり解消（スイープ＋最小幅）、outcome の帯（バッジ見切れ解消）、矢印描画（SVG 範囲・マーカーID）、クラシック/モダン切替の初期実装 |
| `6e2dee3` | **クラシック/モダン切替をヘッダーからコンボフロー単位へ**（コンボごとに可否が違うため）、矢印が消える不具合（不透明な枠背景がエッジを隠していた） |
| `7705c34` | **フレーム情報**（`frameAdvantage`＝初回行動後の有利F）、**受け身状態**（`wakeupNote` / `vsWakeup`）、classic 限定コンボはトグルを disabled 表示、コンボフローの縦幅 1.5倍 |
| `69e0bb6` | 相関グラフを Cytoscape → **自前 SVG（SystemMap）** へ（Cytoscape がハイドレート失敗で真っ白だった）。cytoscape 依存削除 |
| `91392e3` | SystemMap の見やすさ（間隔拡大・dagre 経路・2行ラベル・エッジ薄く＋ホバー・「起き攻め」フィルタ） |
| `cf44e28` | ヘッダーのキャラリンクを**ホバードロップダウン**へ（キャラ増加でヘッダーが伸びない） |
| `c601841` | **コンボ一覧とセットプレイの区別を明確化**（コンボ＝始動技から／セットプレイ＝特定状況から）＋各タブに説明文 |
| `936ac5c` | 仕様・設計・実装まとめ（`SPEC.md`）を追加、`PROTOTYPE.md` を更新 |
| `f949987` | 用語「起き攻け」→「起き攻め」の統一。スキーマ決定 A-1〜A-4 をドキュメントに反映 |
| （次） | **A-1〜A-4 を実装**: `moves` 技辞典（マノン16技、公式フレーム/コマンド）＋ `Step.moveKey` ＋ `stepModernCommand()`／`RouteProperties.wakeup` 構造化（`wakeupSummary()`）／`manon-oki-degage-dr2mk-ranversement` 削除。**U-7**: コマンド表記を公式配色へ（シアン/イエロー/レッド、OD 表記、DR 緑、SP オレンジ、AUTO バッジ）。パーツ詳細にフレーム併記 |

---

## 7. 未確定・Phase 2 TODO

### 決定・実装済み（A 項目 / U-7 / 2026-09-10）

- **A-1** `moves` 技辞典（4層目）… §3.7・実装済み
- **A-2** 受け身を `RouteProperties.wakeup` に構造化（`vsWakeup` 文字列を廃止）… §3.2・実装済み
- **A-3** `position` はスキーマ現状維持、運用ルールを明文化 … §3.4
- **A-4** セットプレイのフル一本は `Combo` にしない … §2.1 / §3.3・ダミー削除済み
- **U-1〜U-3** ノードグラフの情報量・深さ・6択の見やすさ … 現状維持で OK
- **U-4** 微歩き等の非コマンド操作 … （下記の残件へ）
- **U-5** 相関グラフのスケール戦略 … 現状維持、方針は Phase 2
- **U-6** ノード粒度の運用ルール … 既定「統合」、条件はルート `constraints` へ。詳細は Phase 2 `CONTENT.md`
- **U-7** コマンド表記の公式配色（シアン/イエロー/レッド・OD 表記・DR 緑・SP オレンジ・AUTO）… 実装済み（§2.3）

### レビューで決めたいこと（Phase 1 の残り）

- **U-4** 微歩き・前ステップ・空振り・投げなど「コマンドではない操作」に専用の操作チップを用意するか（現状: 微歩き＝淡色メモ、前ステ＝`66` の矢印で混在）
- 起き攻め枠に出す特徴項目の粒度（`frameAdvantage` / `wakeup` / `strongVs` / `weakVs` / `caution` / `onBlock` / `risk`）
- モダンの通常技割り当ての検証（`moves.ts` の `2MP` / `2MK` の `inputModern` 仮値）

### B 項目（Phase 2 の進め方。未決定）

- **B-1** コンボ登録は Skill（`/register-combo`）で対話的に作るか、まとめて種データ投入するか
- **B-2** `deriveModern()` の精度改善（方向→強度マッピング）と手動 `inputModern` の整備範囲
- **B-3** フレームデータのパッチ追随フロー（`verifiedVersion` の運用、差分検知）
- **B-4** id / slug の命名規則の確定（`kd_after_*` / `route_*` / `oki_*` / `manon-*` / `moveKey`）

### C 項目（インフラ。未決定）

- **C-1** GitHub リポジトリ作成 → Cloudflare Pages 連携の手順
- **C-2** 公開サブドメイン名の決定

### Phase 2 実装項目（承認済み計画）

1. スキーマ確定: `src/content.config.ts`（Zod、**4コレクション**＝situations / routes / combos / moves）。
   `src/data/dummy` → `src/content/{situations,routes,combos,moves}/manon/*.json`（1レコード1ファイル）。
   構造は A-1〜A-4 反映後のもの（`Step.moveKey` / `RouteProperties.wakeup` / `Move`）
2. ビルド時導出・検証（`validateAll` を content 由来に接続、mermaid ダンプ）
3. SEO（`@astrojs/sitemap`、OGP/meta、コンボ詳細に JSON-LD、`robots.txt`、Lighthouse）
4. **コンボ登録支援 Skill `/register-combo`**: Web ページ・画像・YouTube・テキストから JSON を作成／更新。
   `drafts/` ＋ dev 限定 `/manon/_preview/` で「アプリと同じ見た目」プレビュー ＋ ターミナルダイジェスト ＋ 承認後 promote
5. テスト（`vitest`：notation パーサ・graph 導出・再帰打ち切り）
6. `CONTENT.md`（ノード設計ガイド「後続が同じなら同一ノード」）＋ scaffolding スクリプト。オーナーが実データ投入
7. デプロイ（GitHub → Cloudflare Pages → カスタムドメイン）

### オーナー作業（ブロッカーではない）

- 実データ投入（正しいレシピ・ダメージ・起き攻め分岐・フレーム・受け身・難易度）
- マノンの正式技名一覧（公式表記に合わせる）
- 攻撃ボタン配色規約の最終確認（現状 L=青 / M=黄 / H=赤 / OD=緑 / SP=紫 / AS=青緑）
- 公開サブドメイン名の決定
- モダン操作コマンドの表記ルール詳細（凡例で確定）
