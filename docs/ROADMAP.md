# 作業リスト・ロードマップ

最終更新: 2026-09-15（ダメージ計算にモダン簡易入力補正を追加、SA1〜3/CAのモダン入力を全キャラ共通コマンドで確定、
ブランカの前投げ後・中央の起き攻めツリーを修正、モダン専用ブランカコンボ12種を登録、起き攻め未整備ノードの
UX修正（「起き攻めなし」タグでの出し分け）。詳細は git log 参照）
仕様の正は `docs/SPEC.md`。このファイルは**作業の一覧と進捗**。

## ステータス凡例

| 記号 | 意味 |
|---|---|
| ✅ | 完了 |
| 🔄 | 進行中 |
| ⏳ | 依存待ち（前工程が終われば着手可） |
| ⬜ | 未着手 |
| 🔲 | オーナー判断待ち（決めてもらえれば進む） |

---

## 現在地

**Phase 1 のレビュー項目は全て決着。Phase 2（本開発）の基盤も一通り完了。2026-09-12 の第三者レビュー（R01〜R12）も全件対応済み。**

- Phase 1: A-1〜A-4 / U-4 / U-7 / R-1 / V-1〜V-6 / 第三者レビュー RV-01
- Phase 2 基盤: P2-0（検証CLI・ビルドゲート）/ P2-1（Zod）/ P2-2（Content Collections 移行）/
  P2-3（検証ゲート）/ P2-5（CONTENT.md 草案）/ P2-8（SEO 土台）/ RV-05・RV-06・RV-07
- 2026-09-12 レビュー（R01〜R12）: 全12件対応済み（詳細・対応コミットは `docs/SPEC.md` の変更履歴表、
  元レビューは `docs/archive/REVIEW-2026-09-12.md`）
- ダメージ計算: クラシックは確定・実装済み、モダンのSPボタン簡易入力補正（×0.8）も実装済み（監査運用中、§7 参照）。
  SA1〜3・CA のモダン入力は全キャラ共通コマンドとしてオーナー確認済み
- 2キャラクター対応（マノン・ブランカ）、技辞典は公式フレームデータで全技を取り込み・照合済み（2026-09-13）
- ブランカのモダン専用コンボ12種を対戦ガイドから登録（弱/中攻撃・DI・確定反撃・スタン、2026-09-15）
- 起き攻めUX: 起き攻めルート未登録の終着点で紛らわしかったフォールバック表示を修正。「起き攻めなし」タグで
  「本当に起き攻めが無い」と「単に未登録」を区別できるようにした（2026-09-15、§1-D参照）
- テスト green（87件）・`astro check` 0エラー・build 156 ページ（検証ゲート込み）

**本番公開中**: https://sf6.amanohashi.date （Cloudflare Workers Builds、`main` push で自動デプロイ）。

**残るオーナー作業**: P2-4a（実機での入力方式確認、優先度は低め）／ §1-D の起き攻め未確認リスト（実機で確認でき次第）。
**残る開発**: P2-6 拡張（画像・動画・フルプレビュー）／ P2-10 UX 実機検証 ／ P2-11 deriveModern ／ P2-12 公開ゲート／
DC-6（ダメージ計算の公開表示への接続）／DC-7 残作業（モダン簡易入力の inputModern 補完・実測裏取り、§7 参照）。

---

## 1-D. 起き攻め未確認リスト（2026-09-15、オーナー実機確認待ち）

コンボの終着点になっている状況ノードのうち、起き攻めルートが1件も登録されていないもの。
「実際に起き攻めがある（後で埋める）」か「起き攻めというほどのものが無い（`tags` に `起き攻めなし` を追加）」かを
オーナーに確認してから対応する。**全部に起き攻めがあるとは限らない**（無いものは無い、というのがオーナーの弁）。

`kd_after_ranversement_mid`（ランヴェルセ締め後・中央）は確認済み：弱/中/強どれで締めても起き攻めの選択肢は
共通、実際に起き攻めは存在するので「起き攻めなし」タグは付けない（ラベルの強度表記だけ2026-09-15に修正済み）。

未確認（11件）:

| situation id | ラベル | 終着点にしているコンボ |
|---|---|---|
| `blanka_kd_after_cannon_loop_mid` | ローリングキャノン連携後・中央 | `blanka-mid-2mk-electric-sa2` |
| `blanka_kd_after_rolling_mid` | 中ローリングアタック締め後・中央 | `blanka-mid-2mp-cr-5hk-wildlift` |
| `blanka_kd_after_sa3_mid` | SA3締め後・中央 | `blanka-modern-lk-finisher` / `blanka-modern-mk-finisher` / `blanka-modern-punish-finisher` |
| `blanka_kd_after_vertical_h_corner` | 強バーチカルローリング締め後・画面端 | `blanka-modern-di-corner-basic` |
| `blanka_kd_after_vertical_m_mid` | 中バーチカルローリング締め後・中央 | `blanka-modern-di-basic` / `blanka-modern-di-gauge` / `blanka-modern-mk-gauge` / `blanka-modern-punish-basic` / `blanka-modern-stun-gauge` |
| `kd_after_degage_mid_mid`（manon） | 中デガジェ締め後・中央 | `manon-punish-5hk-pc-degage` |
| `kd_after_manege_dore_corner`（manon） | マネージュ・ドレ後・画面端 | `manon-corner-di-hoseigiri` |
| `kd_after_manege_dore_mid`（manon） | マネージュ・ドレ後・中央 | `manon-jump-jhk-hoseigiri-feint` |
| `kd_after_ranversement_corner`（manon） | ランヴェルセ締め後・画面端 | `manon-corner-di-wall-ranversement` |
| `kd_after_rondpoint_mid`（manon） | 中ロン・ポワン締め後・中央 | `manon-mid-5mp-cr-rondpoint` |
| `kd_after_super_mid`（manon） | スーパーアーツ〆後・中央 | `manon-mid-5mp-lethal-sa3` / `manon-punish-5hk-pc-sa2` |

対応方法: 各ノードについて、①実際に起き攻めの選択肢がある → 該当キャラの起き攻めをヒアリングして
`route`（`kind:"okizeme"`）を追加、②本当に起き攻めが無い → `situation.tags` に `"起き攻めなし"` を追加するだけ。
実装（UI側の出し分け）は `src/pages/[character]/situations/[id].astro` に反映済みなので、データを直すだけでよい。

---

## 1. UI/UX レビュー 残チェックリスト（＝ Phase 1 クローズ条件）

### 1-A. オーナー判断 … 全て決着（U-4 / R-1 / R-2）

| # | 項目 | 選択肢 | 状態 |
|---|---|---|---|
| **U-4** | 微歩き・前ステップ・空振り・投げなど「技コマンドでない操作」の表示 | (b) 専用の操作チップに統一 | ✅ 実装済み（`Step.action` ＋ `StepCmd.astro`） |
| **R-1** | 起き攻め枠の情報粒度 | 枠＝triage（有利F `+2F` ／ 受け身バッジ ／ リスク ／ ◯×⚠ 各1行）、詳細（受け身全文・使いどき・ガード時）はカード送り | ✅ 実装済み |
| **R-2** | `moves.ts` のモダン通常技割り当ての検証 | プロト表示としては現状の仮値で OK（オーナー確認済み）。実データ投入時（P2-4/P2-7）に公式で最終確認 | ✅ プロトは OK |

### 1-B. 私が点検・修正（一巡完了）

| # | 項目 | 状態 |
|---|---|---|
| V-1 | 空・境界状態 | ✅ ComboExplorer は空状態あり／状況詳細は「なし（始動状況）」。フレーム欄は不在時そのまま非表示で可 |
| V-2 | モバイル幅 | ✅ ヘッダー 640px ブレークポイント／グリッドは auto-fill minmax／レシピ行は `.scroll-x`／グラフは pointer events ＋ `touch-action:none` でタッチ pan 可（ピンチズームは無いが +/− ボタンで代替） |
| V-3 | ライト/ダーク両テーマ | ✅ フロー・各択カード・操作チップ・404 を両テーマで確認、コントラスト OK |
| V-4 | `about.astro` 等の文言 | ✅ 「樹形図」→「ノードグラフ」、技辞典を追記、アイコンのクレジットを実態（自作SVG＋CSS＋Pixelarticons）に |
| V-5 | 404・ちらつき | ✅ `src/pages/404.astro` 追加。`client:only` 島4箇所に `slot="fallback"`（高さ確保でレイアウトシフト防止）。コンソールエラーなし |
| V-6 | コンボ→起き攻めの導線 | ✅ コンボ詳細末尾に「締め後の起き攻め」セクション（状況リンク＋各択）が既にある |

### 1-C. 決着済み（記録）

- U-1〜U-3（ノードグラフの情報量・深さ・6択の見やすさ）→ 現状維持で OK
- U-5（相関グラフのスケール戦略）→ 現状維持、増えたら Phase 2 で方針
- U-6（ノード粒度）→ 既定「統合」、条件はルート `constraints` に。詳細は Phase 2 `CONTENT.md`
- U-7（コマンド表記の公式配色）→ 実装済み

---

## 2. インフラ / デプロイ

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| C-1 | GitHub リポジトリ | ✅ | `github.com/manji6/sf6-combo_viewer`（`main`） |
| **C-1.5** | **Cloudflare Workers デプロイ設定（リポジトリ側）** | ✅ | `wrangler.jsonc`（Static Assets、`dist/` を配信、SSR なし、custom domain = `sf6.amanohashi.date`）。デプロイは **Workers Builds**（ダッシュボードの Git 連携）方式に決定。API トークン／GitHub Actions は不要 |
| **C-1.6** | **Workers Builds のビルド設定** | ✅ | cloudflare-api MCP で設定完了。Worker `sf6-combo-viewer` / repo connection / build config（`main` → `npm run build` → `npx wrangler deploy` / `NODE_VERSION=22`）。あとは `main` push で初回ビルド |
| C-2 | 公開サブドメイン名 | ✅ | `sf6.amanohashi.date` に決定。`wrangler.jsonc` の `routes[].custom_domain` と `astro.config.mjs` の `site`、`robots.txt` に反映済み |
| C-3 | 本番ドメイン割当 | ✅ | **`https://sf6.amanohashi.date` 稼働中**（2026-09-10 初回デプロイ、commit `5f5e52f`）。custom domain の DNS・証明書は初回 `wrangler deploy` で自動作成 |

---

## 2.5 第三者レビュー（`docs/archive/REVIEW-2026-09-10.md`）の反映

Codex による設計レビュー。全体評価は「方向性は妥当、少数の実データで検証してから大量投入へ」。
確認済み不具合 / 実データ投入時の設計リスク / 実機検証が必要な UX 仮説 を分けて扱う。

| ID | 分類 | 対応方針 | 状態 |
|---|---|---|---|
| **RV-01** | 確認済み不具合 | 「モダン可」判定を `comboSupportsModern` に統一（`FlatCombo.usesModern` → `supportsModern`、空 chain ガード） | ✅ 修正済み（`d65ad5b`） |
| **RV-08** | 確認済み不具合 | `scripts/validate.mjs` が Node ESM で TS ディレクトリ import を解決できず失敗（`ERR_UNSUPPORTED_DIR_IMPORT`）。CLI を実行可能に（tsx 等）＋ 公開ビルドの失敗ゲートに。Map 化前の重複検出・空 steps/chain・宣言と入力の矛盾も検証対象へ | ⏳ P2-3（移行前に着手可） |
| **RV-02** | 設計リスク | モダン入力に確認状態（`verified` / `unverified` / `unsupported`）を持たせる。`inputModernPrecise` を解決器で使う。`deriveModern()` は「推定」と明示、本番のモダン可認定に使わない。非技操作（DR/dash/wait）は `moveKey` 不要のまま | ⏳ P2-1 / P2-4 |
| **RV-03** | 設計リスク | 共有ノードの「到達経路 × 後続 Route」の成立条件（`constraints`）。初期は条件が食い違うなら Situation を分割。必須条件はグラフ/カードにも短く表示 | ⏳ P2-1 / P2-3 / P2-4 / P2-5 |
| **RV-04** | 設計リスク | ダメージを「合計・確認条件・確認状態・確認バージョン」で構造化。未確認値を実測値として並べ替え・比較しない。0 ダメージ扱いにしない | ⏳ P2-1 / P2-4 |
| **RV-05** | UX 仮説 ＋ 実装 | 詳細上部に短いレシピ＋コピー、グラフ操作/スクロールの奪い合い、タブの `radio+label` をキーボード対応（button/リンク構造へ）、全画面のフォーカス管理、320/375/390px の横はみ出し。想定利用者 3〜5 人で主要導線を検証 | ⏳ V-2 追補 / P2-9 / 実機検証 |
| **RV-06** | 導線・意味 | `始動` フィルタを `start.kind` でなく始動技（`starterMoveKey` or 先頭 Route から解決）に。`frameAdvantage` の測定対象を区別（重ねガード後 / 前ステ後 …）、受け身別の値と代表値の関係を決める | ⏳ P2-1 / P2-4 / UI 改善 |
| **RV-07** | 運用設計 | `verifiedVersion` を Route / Combo にも。技更新→`moveKey→Route→Combo` 逆引きで再確認対象を抽出。誤り報告の入口 | ⏳ B-3 / P2-5 / P2-7 |
| **RV-09** | 計画 | ROADMAP に担当・実工数・依存・完了条件・確認待ち時間の列。Content Collections 移行を「TS→JSON だけ」と見積もらない（非同期取得・ID 二系統・参照解決・URL 維持・下書き除外・検証タイミング）。初回公開ゲートを追加（下記 §5） | 🔄 本ファイルに反映中 |

**留意（Codex の指摘どおり）**: 採用未定の UX 案（RV-05 の起き攻め表示変更など）を確定仕様として転記しない。
ダミーの具体的な技・数値は正解扱いにしない。既存データは表示ロジックの回帰検証に、実データはゲーム内容の検証に使い分ける。

---

## 3. Phase 2（本開発）

Phase 1 クローズ後に着手。順序は第三者レビューの推奨（§2.5）を反映。

| # | 項目 | 状態 | 内容 |
|---|---|---|---|
| P2-0 | 検証 CLI・ビルドゲート（RV-08） | ✅ `20f08e2` | `scripts/validate.ts`（vite-node）＋`npm run validate` / `check`。`validateAll(data?)` 注入可能化＋ルール追加（重複・空・キャラ不一致・宣言と入力の矛盾）。`validate-data` 統合で `astro:build:start` にてビルド中止。dev は警告のみ |
| P2-9 | テスト（`vitest` 57 件） | ✅ `fdec884` `c5014d5` | RV-01 回帰（classic限定 route を含む本線）・notation パーサ・graph 導出・再帰打ち切り・`stepModernCommand` / `wakeupSummary` / `frameAdvLabel` / `comboStarterMove`。拡充は継続 |
| P2-1 | Zod スキーマ | ✅ `3a3d81e` | `src/data/schema.ts`（形状の正）。型は `z.infer`。`types.ts` は再エクスポート。RV-02〜04 の確認状態フィールドは P2-4a の実例検証後に追加 |
| P2-2 | Content Collections 移行 | ✅ `3a3d81e` | `src/data/dummy/*.ts` → `src/content/**/*.json`（55 件）。`src/data/index.ts` が `import.meta.glob`（**同期**）で読み Zod 検証。`getCollection` の非同期を避け導出関数・各ページは同期のまま。`content.config.ts` も登録済み（getCollection 用） |
| P2-3 | ビルド時検証ゲート | ✅ `20f08e2` `3a3d81e` | Zod（形状。読み込み時 throw）＋ `validateAll`（参照・chain・重複・矛盾。ビルド中止）の2層 |
| P2-5 | `CONTENT.md` | ✅ 草案 `docs/CONTENT.md` | 置き場所・命名規則（B-4）・コマンド表記・ノード粒度（U-6/RV-03）・有利F/ダメージ（RV-04/06）・技辞典（RV-02）・更新手順（RV-07/B-3）・チェック |
| P2-8 | SEO 土台 | ✅ `1726125` | `@astrojs/sitemap`・`public/robots.txt`・canonical/OGP メタ。JSON-LD・Lighthouse は実データ後 |
| RV-05 | タブのキーボード対応 | ✅ `c5014d5` | radio+label → ARIA タブ。roving tabindex・矢印/Home/End・`:focus-visible`・#hash 同期（pushState/hashchange） |
| RV-06 | 始動技フィルタ | ✅ `c5014d5` | `始動` を `start.kind` → 始動技（`comboStarterMove`）。ComboExplorer の #hash 保持 |
| RV-07 | 誤り報告の受け口 | ✅ `1726125` | フッターに GitHub Issues リンク（対象 URL・確認バージョン・再現条件を促す） |
| — | | | |
| P2-2a | **初回公開対象と代表実例の選定** | 🔲 オーナー | 「初回に載せるコンボ・起き攻め」を具体列挙。中央/端・通常/条件付き始動・共通の締め・受け身別・classic限定/両対応 を種類で網羅 |
| — 準備 | ダミー一掃（案B） | ✅ | 旧ダミー 54 件を `tests/fixtures/` へ退避。テストは `vi.mock('../src/data', …fixtures)` / `validateAll(fixtureData)` で回す。`src/content/` は実データ専用（character 1 件のみ）。空データでビルド通過（7 ページ）＋空状態表示 |
| P2-4a | 代表実例の登録・検証（RV-02〜04） | 🔄 batch1〜3 投入済み | **batch1（`1e7359d`）** コア6コンボ＋弱デガジェ〆起き攻め ／ **batch2（`d60afef`）** 実戦寄りの残り＋ガード連携 ／ **batch3** SA1/2/3・ODグランフェッテ・ODデガジェ等7技＋無敵ガード〆/中P始動リーサルSA3/J強K ODグランフェッテ/強Kパニカン SA2（moves24→31・situations14→15・routes24→28・combos12→16）。出典すこれる、技フレームは公式。SA・OD派生を使うルートは modern 入力未確認のため `controlType:'classic'`。**オーナー実機確認待ち** → ダメージ測定・ゲージ内訳（特にODグランフェッテのスピン回復、4777/5000コンボ）・モダン割り当ての確定 → P2-1 に確認状態フィールド追加。**batch4 見送り分**: 中P始動最大4777 / 5000 SA3最大 / 素グランフェッテ＋パニカンコンボ |
| P2-6 | `/register-combo` Skill | ✅ 最小版 `4fe922f` | SKILL.md（手順）＋ `drafts/` ＋ `scripts/promote-draft.ts`（Zod 検証つき）＋ dev 限定 `/manon/preview/`（ドラフト検証表示）。画像/動画解析・「アプリと同じ見た目」のフルプレビューは後続 |
| P2-7 | 実データ整備（初回公開一覧） | ⏳ P2-6 | Skill に依存せず手入力でも進める |
| P2-10 | UX 実機検証（RV-05 の残り） | ⏳ P2-7・共有 URL | スマホ＋キーボードで主要導線を完遂。想定利用者 3〜5 人。全画面フォーカス管理・320/375/390px の横はみ出し |
| P2-11 | `deriveModern()` の精度改善（B-2） | ⬜ 低優先 | ほぼ `moves.inputModern` 手入力前提 |
| P2-12 | 初回公開ゲート確認 → 本番公開 | ⏳ §5 | プレビューでゲート確認後、本番・カスタムドメイン |

### Phase 2 の未決事項（B 項目）

- **B-1** 実データ投入は Skill 中心か手入力の種まき中心か → **P2-4 は手入力、P2-7 以降は Skill** を推奨
- **B-3** フレームデータのパッチ追随フロー（`verifiedVersion` の運用・差分検知）→ `CONTENT.md` に手順、必要なら簡易スクリプト
- **B-4** id / slug 命名規則の確定 → `CONTENT.md` で確定（`kd_after_*` / `route_*` / `oki_*` / `manon-*` / `moveKey=manon-<技略称>`）

---

## 4. 進め方の妥当性レビュー（自己評価）

### 妥当だと考える点

- **2フェーズ制（ダミーで UI 確定 → 本開発）は正解**。実際、フローグラフ表示・起き攻めの特徴表示・クラシック/モダンの扱いで
  データモデルへのフィードバックが多数出た（moves 辞典・wakeup 構造化）。先に全データを入れていたら手戻りが大きかった。
- **schema を Phase 1 のうちに固めた**（A-1〜A-4）のは前倒しとして妥当。ただし第三者レビュー（§2.5）の指摘どおり
  「Phase 1 の設計判断が完了」と「実データ・実利用による UX 検証が完了」は別物。後者は Phase 2 の公開前ゲート（§5）で担保する。
- **3層グラフ ＋ 技辞典**の構造は、共有パーツ（起き攻めと頻出コンボの連結）という当初の狙いを満たしつつ、
  フレームデータの重複を避けられている。
- ~~Content Collections への移行は構造を変えず TS→JSON だけなので低リスク~~ → **撤回**。RV-09 のとおり
  非同期取得・ID 二系統・参照解決・URL 維持・下書き除外・検証タイミングを伴う。索引化で同期導出関数の変更範囲を抑える。

### 調整を推奨する点

1. **Phase 1 を「正式にクローズ」する区切りを設ける。** ← 現在ここ
   §1-A（U-4/R-1/R-2）・§1-B（V-1〜V-6）は決着。RV-01 も修正済み。
   「Phase 1 の設計判断は完了」を宣言し、Phase 2 へ。ただし公開は §5 のゲート後。

2. **Cloudflare Pages 連携（C-1.5）を今やる。**
   GitHub 連携は済んだので設定 5 分。共有 URL があれば localhost 往復なしでレビューでき、
   以降 `main` push のたびに最新が見える。ダミー公開範囲・検索インデックスへの混入に注意し本番と区別（RV-09）。

3. **Phase 2 の頭に「代表実例の検証（P2-4a）」を置く。** 型変更・Collections 移行はその結果で決める。
   RV-02〜04（モダン入力の確認状態・接続の成立条件・ダメージの測定条件）は、5〜10 本の実例で
   型の穴が見えてから固める。Skill（P2-6）を作り込む前に。

4. **SEO（P2-8）・テスト（P2-9）・検証 CLI（P2-0）は本流と並行。**
   P2-0（`validate.mjs` の修復）は今すぐ着手可。テストは RV-01 と既存 graph ロジックから先に。

5. **`register-combo` Skill は「作り込みすぎない」。**
   最初はテキスト入力・正規化・既存パーツ候補・差分プレビュー・承認後反映まで。画像/動画解析は後続。

### 想定リスク

| リスク | 対応 |
|---|---|
| `moves` の実データが膨大でオーナー作業が詰まる | まずダミー登場分＋主要技だけ。全技は「あれば出す」程度に段階投入 |
| ノード粒度の運用（U-6 / RV-03）が実データで破綻 | `CONTENT.md`（P2-5）で基準を明文化。条件が食い違うなら初期は Situation 分割 |
| 未確認データを確定として公開（RV-02/04/07） | 確認状態を型に持たせ、UI で「未確認」を明示。公開前ゲート（§5）で確認 |
| フレームデータの著作権（Capcom IP） | 非商用ファンツールのグレー領域（dustloop 等と同じ扱い）。出典明記・広告なしを維持 |
| Cloudflare Pages のビルドが Windows ローカルと差異 | `npm run build` が CI でも通るか C-1.5 直後に確認。Node バージョンを固定 |
| ゲーム内成立をデータ推定で代替（AI 生成の丸呑み） | 型整合（ID 一致）と実機確認を別管理。実機はオーナー。§2.5 の留意事項 |

---

## 5. 初回公開ゲート（RV-09。すべて満たしてから本番公開）

- [ ] 公開対象のコンボ・起き攻めが具体的に列挙されている
- [ ] そのレシピ・接続・モダン入力・数値の**確認条件**が揃っている
- [ ] 未確認情報を公開する場合、その状態が明示され、確認済みと誤認させない
- [ ] 一覧・フィルタ・詳細で「モダン可」の判定が一致する（RV-01 の回帰含む）
- [ ] ダミー・下書き・開発プレビューが本番掲載対象から除外される
- [ ] スマホとキーボードで「検索→レシピ確認→起き攻め選択」を完遂できる（RV-05）
- [ ] 検証 CLI・重要テスト・型チェック・公開ビルドが通る（RV-08）
- [ ] 本番 URL・リンク・404・メタ情報・プレビューとの差異を確認済み
- [ ] 更新手順・再確認対象の抽出・誤り報告の入口がある（RV-07）

---

## 6. Workers Builds デプロイ（設定済み）

デプロイ方式は **Workers Builds**（Cloudflare の Git 連携）。
`main` に push → Cloudflare が clone → `npm ci` → `npm run build` → `npx wrangler deploy`。
API トークン・GitHub Secrets・GitHub Actions は不要（Cloudflare の GitHub App が認証を持つ）。

### 設定済みの内容（cloudflare-api MCP で作成、2026-09-10）

| 項目 | 値 |
|---|---|
| Worker 名 | `sf6-combo-viewer`（script_tag `baecde0b317b4a008a603a151a5d3f3b`）※初回ビルドまではプレースホルダ |
| Repo connection | `manji6/sf6-combo_viewer`（GitHub App `manji6`） |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Build variables | `NODE_VERSION=22` |
| Build caching | 有効 |

- `npm run build` は `astro:build:start` フックで `validateAll` を走らせるので、壊れた
  データ（存在しない参照・chain 不連続など）はデプロイ前に落ちる。
- テストも回したい場合は build command を `npm test && npm run build` に変更（MCP or ダッシュボード）。

### custom domain（`sf6.amanohashi.date`）

`wrangler.jsonc` の `routes[].custom_domain` に定義済み。初回 `wrangler deploy` 実行時に
Cloudflare が DNS レコードと証明書を自動作成する（zone `amanohashi.date` は同一アカウントで
active 確認済み。証明書発行に数分）。

### 初回デプロイ

`main` に push すれば Workers Builds が走る。ビルド状況は
`GET /accounts/{account_id}/builds/workers/{script_tag}/builds` or ダッシュボードで確認。

---

## 7. ダメージ計算ロジック（クラシック確定・監査運用中）

**2026-09-13 更新：クラシック操作の計算ロジックは確定・実装済み。** 現状の状況は変わった:
- `src/lib/damage/`（`calculate.ts` / `ruleset.ts` / `types.ts`）に純粋関数の計算器を実装。
- 実装の仕組みは **[DAMAGE-CALCULATION-MECHANISM.md](DAMAGE-CALCULATION-MECHANISM.md)** に言語化済み（段階補正・始動補正・
  コンボ補正・即時補正・DR乗算補正・SA最低保証・PC倍率・SA3固有ボーナス・補正切り、公式サイトの用語対応込み）。
- オーナーが対戦画面で確認した実測値との答え合わせを繰り返して確定（community記事の候補値をそのまま採用したのではない）。
  当初の設計調査メモは `docs/archive/DAMAGE-CALCULATION-DESIGN.md` / `docs/archive/DAMAGE-CALCULATION-RESEARCH-2026-09-12.md` に保存。
- 検証: `npm run damage:audit`（CLI）／ `http://localhost:4321/damage-audit/`（開発時のみ、本番404）。
  実戦コンボ21件中17件が完全一致、残り4件も「強/弱ロン・ポワンの多段本質」という同一の既知制限で説明済み（MECHANISM.md §5）。
- **未着手**: モダン簡易入力の補正計算（意図的に後回し）、公開ページのダメージ表示への接続（現状は監査専用、
  `Route.damage` / `Combo.damageOverride` の手入力値がそのまま表示され続けている）。

### 7.1 実装タスク・依存関係（更新）

| ID | 作業 | 担当の目安 | 依存 | 状態 | 完了条件 |
|---|---|---|---|---|---|
| DC-0 | 設計評価・参考資料の確認 | 開発・レビュー | なし | ✅ | `docs/archive/DAMAGE-CALCULATION-DESIGN.md` |
| DC-1 | 計算順・丸め・例外の確定、正解例採取 | オーナー＋開発 | オーナーの実測値提供 | ✅ | クラシック21コンボの実測値で確認済み（MECHANISM.md） |
| DC-2 | スキーマ・結果型 | 開発 | DC-1 | ✅ | `src/lib/damage/types.ts`（`CalculationResult` / `HitBreakdown`） |
| DC-3 | 直列コンボ用計算器＋単体テスト | 開発 | DC-1・DC-2 | ✅ | `tests/damage.test.ts` 83件（damage関連はこのうち一部）。全体テストは §「現在地」参照 |
| DC-4 | マノンの状態依存・SA 条件（メダル・PC・SA3固有ボーナス等） | オーナー＋開発 | DC-3 | ✅（クラシックのみ） | モダン入力別の確認は未着手 |
| DC-5 | ブランカの SA2・設置・遅延ヒット | オーナー＋開発 | DC-3 | 🔄 | 電気サンダー・ローリングキャノン連携等の主要ケースは確認済み。爆弾設置の着弾ダメージ・遅延ヒットは未検証 |
| DC-6 | 一覧／詳細／Skill 統合・公開表示への接続 | 開発 | DC-3〜5 が対象コンボで揃ってから | ⬜ | 監査専用から公開表示に切り替える。表示条件、ソート、実測比較、未対応表示が一致。check/build 成功 |
| DC-7 | モダン簡易入力の補正計算 | オーナー＋開発 | DC-3 | 🔄 | `controlType:'modern'` を実装済み（SPボタン簡易入力×0.8、MECHANISM.md §4.9）。SA1〜3・CA のモダン入力は全キャラ共通コマンドとしてオーナー確認済み・設定済み。個別技（弱ロン・ポワン等、モダン自動選択されない技）は `inputModern` 未確認のままで、それらを含むコンボは incomplete になる。実測値による裏取りはまだ無い |

DC-6（公開表示への接続）は、対象コンボがある程度揃ってからオーナー判断で着手する。
DC-7 の残作業: 残る個別技の `inputModern` を確認して埋める。可能ならオーナーの対戦画面でモダン実測値を確認して裏取りする。
それまでは監査ツール（CLI／`/damage-audit/`）での並行確認を続ける。
