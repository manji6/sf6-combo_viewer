# Phase 1 プロトタイプ — レビューガイド

UI/UX 確認用のプロトタイプです。**マノンのデータはすべてダミー（仮）**。
コマンド・ダメージ・フレーム・置き攻けの中身は正確ではありません。UI と操作感の確認が目的です。

## 起動

```
npm install
npm run dev      # http://localhost:4321
```

## 見てほしいところ

| 画面 | URL | 確認ポイント |
|---|---|---|
| トップ | `/` | 導線・第一印象 |
| マノン ハブ | `/manon/` | コンボ一覧のフィルタ／ソート、URL 同期（絞り込んでリロード）、「セットプレイ」タブ |
| コンボ詳細 | `/manon/combos/manon-mid-5mp-drc-ranversement/` | レシピの「連携パーツ」境界マーカー、経路ノード、「この後の置き攻け」、「このパーツを使う他のコンボ」逆引き |
| 置き攻け樹形図 | `/manon/situations/kd_after_degage_light_mid/` | 4 択の分岐カード（強い／弱い／使いどき／ガード時）、リスク色帯、完全再帰・ループ（↩）・重複（⇢）・深さ打ち切りの表示 |
| パーツ詳細 | `/manon/routes/oki_dr2mk_from_degage_light/` | 択の特徴、接続元／先ノード、同起点・同着地点の他パーツ |
| 相関グラフ | `/manon/graph/` | ノード＝状況／矢印＝パーツ、pan/zoom、クリック遷移、辺の種類フィルタ。「4強P → 中ランヴェルセ が繋がる浮き」に複数パーツが集まる様子 |
| 表記の見方 | `/guide/notation/` | アイコン ⇄ テキスト切替（右上トグル、設定は記憶） |

## データモデル（3層グラフ）

- `src/data/dummy/situations.ts` — 状況ノード
- `src/data/dummy/routes.ts` — パーツ（辺）＝再利用単位、置き攻けの「択の特徴」を保持
- `src/data/dummy/combos.ts` — 名前付き経路（route の連結）
- `src/data/types.ts` — 型定義

連結の肝: 置き攻けの `oki_dr2mk_from_degage_light` と頻出コンボ内の `starter_5mp_drc_2mp_mid` が
**同じノード `juggle_can_4hp_ranversement`** に到達し、その先の締めパーツ `route_4hp_ranversement_mid` を共有する。

## 実装メモ

- Astro（静的出力）+ Tailwind v4 + Preact（相関グラフの島のみ）
- コマンド表記: `src/lib/notation/` で numpad 正準表記をパース → アイコン／テキスト両方を DOM 出力し CSS で切替
- 樹形図: `src/lib/graph/tree.ts` でビルド時に再帰（ループ・重複・深さで打ち切り）、`SetplayTree.astro` で描画（JS 不要）
- グラフ導出・検証: `src/lib/graph/derive.ts`（`validateAll()` がビルド時に警告）

## Phase 1 で確定させたいこと → Phase 2 へ

- 樹形図の情報量・深さ・折りたたみの初期状態
- 「択の特徴」に持たせる項目（strongVs / weakVs / useWhen / onBlock / risk で十分か）
- 相関グラフの必要性・粒度・操作性
- コンボ一覧のフィルタ項目の過不足
- ノード粒度の運用ルール（どこまでを同一ノードにまとめるか）
