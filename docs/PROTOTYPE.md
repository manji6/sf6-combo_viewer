# Phase 1 プロトタイプ — レビューガイド

UI/UX 確認用のプロトタイプです。**マノンのデータはすべてダミー（仮）**。
コマンド・ダメージ・フレーム・起き攻めの中身は正確ではありません。UI と操作感の確認が目的です。

仕様・設計・実装・変更履歴の全体は **`docs/SPEC.md`** を参照。

> スキーマ決定 **A-1〜A-4**（`moves` 技辞典 / `wakeup` の構造化 / `position` 運用ルール / セットプレイのフル一本は
> 非 `Combo`）と **U-7**（コマンド表記の公式配色）は実装済み。詳細は `SPEC.md` §3.0 / §3.7 / §2.3。

## 起動

```
npm install
npm run dev      # http://localhost:4321   （CLAUDE.md 記載どおり astro dev --background 推奨）
```

## 見てほしいところ

| 画面 | URL | 確認ポイント |
|---|---|---|
| トップ | `/` | 導線・第一印象。ヘッダーの「キャラクター ▾」ホバー |
| マノン ハブ | `/manon/` | コンボ一覧のフィルタ／ソート（絞り込んでリロード＝URL 復元）、「コンボ」と「セットプレイ」の定義説明 |
| **コンボフロー** | `/manon/combos/manon-mid-5mp-drc-ranversement/` | 1 手＝1 ノードで左→右。別の締め（SA3）が分岐、締めのダウンから破線で起き攻め。ツールバーの**クラシック/モダン切替**（このコンボは両対応）と**全画面** |
| クラシックのみコンボ | `/manon/combos/manon-punish-5hp-rondpoint/` | 「モダン」ボタンが disabled。「操作: クラシックのみ」 |
| **起き攻めフロー** | `/manon/situations/kd_after_degage_light_mid/` | 起点から破線で 6 択（DR・微歩き・前ステップ・様子見）。各枠に**初回行動後の有利F**（緑バッジ）・**起き上がり方**・◯有効/×苦手/⚠注意・リスク。見出しに `wakeupNote`。モダンにするとクラシック限定の択が消える |
| フレーム消費技の例 | `/manon/situations/kd_after_ranversement_mid/` | 「5弱P 空振り → 前ステップ マネージュ・ドレ」 |
| パーツ詳細 | `/manon/routes/oki_dr2mk_from_degage_light/` | 択の特徴（frameAdvantage / 受け身対応 含む）、手順のクラシック/モダン小トグル、周辺の相関 |
| 相関グラフ（全体マップ） | `/manon/graph/` | 状況とパーツの全体像。「起き攻め」の辺を隠すとコンボの骨組みだけ見える |
| 表記の見方 | `/guide/notation/` | アイコン ⇄ テキスト切替（ヘッダーのトグル、設定は記憶） |

## データを足すときに見るファイル

1. `src/data/types.ts` … 構造の仕様（唯一の正）
2. `src/data/dummy/routes.ts` … 実例が一番豊富（starter / ender / okizeme＋properties＋wakeup / 非DR始動 / クラシック限定）
3. `src/data/dummy/situations.ts` … 状況ノード（advantage / wakeupNote / opponentState）
4. `src/data/dummy/combos.ts` … コンボは routeChain（パーツID列）だけ
5. `src/data/dummy/moves.ts` … 技辞典（発生・硬直差・ダメージ・クラシック/モダン入力）。step は `moveKey` で参照
6. `src/lib/graph/derive.ts` の `validateAll()` … 守るべき整合性ルール

Phase 2 でこれらは `src/content/{situations,routes,combos,moves}/manon/*.json` ＋ Zod に移行（TS 配列 → JSON ファイル群）。
