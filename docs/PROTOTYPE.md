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
| **コンボ詳細（ノードグラフ）** | `/manon/combos/manon-mid-5mp-drc-ranversement/` | ComfyUI 風のフローキャンバス。1 手＝1 ノードで左→右、パーツごとにグループ枠。**別の締め（SA3）が分岐**。締めのダウンから**破線で置き攻けが扇状に**。ドラッグ移動／ホイール拡大。テキスト表記は「テキストで見る」に折りたたみ |
| **置き攻けフロー** | `/manon/situations/kd_after_degage_light_mid/` | 起点から破線で 4 択 → ヒット後は実線でコンボ継続 → 次のダウンでまた 4 択（完全再帰、ループ／既出／続き で打ち切り）。下に各択の特徴カード（強い／弱い／使いどき／ガード時） |
| 連結ハブ | `/manon/situations/juggle_can_4hp_ranversement/` | 置き攻けと頻出コンボが共有する中継ノード |
| パーツ詳細 | `/manon/routes/oki_dr2mk_from_degage_light/` | 択の特徴、接続元／先ノード、同起点・同着地点の他パーツ |
| 相関グラフ（全体俯瞰） | `/manon/graph/` | 状況とパーツの全体像。Cytoscape の別ビュー（コンボ個別のフローとは別物） |
| 表記の見方 | `/guide/notation/` | アイコン ⇄ テキスト切替（右上トグル、設定は記憶） |

## データモデル（3層グラフ）

- `src/data/dummy/situations.ts` — 状況ノード
- `src/data/dummy/routes.ts` — パーツ（辺）＝再利用単位、置き攻けの「択の特徴」を保持
- `src/data/dummy/combos.ts` — 名前付き経路（route の連結）
- `src/data/types.ts` — 型定義

連結の肝: 置き攻けの `oki_dr2mk_from_degage_light` と頻出コンボ内の `starter_5mp_drc_2mp_mid` が
**同じノード `juggle_can_4hp_ranversement`** に到達し、その先の締めパーツ `route_4hp_ranversement_mid` を共有する。

## 実装メモ

- Astro（静的出力）+ Tailwind v4 + Preact（島）
- コマンド表記: `src/lib/notation/` で numpad 正準表記をパース → アイコン／テキスト両方を DOM 出力し CSS で切替
  （Astro 版 `components/notation/Sequence.astro` と Preact 版 `components/islands/Notation.tsx`）
- **コンボ／置き攻けのノードグラフ**: `src/lib/graph/flow.ts` が step 単位の DAG を生成
  （`buildComboFlow` / `buildSituationFlow`、ループ・既出・深さで打ち切り）、
  `components/islands/FlowCanvas.tsx` が `@dagrejs/dagre` で左→右レイアウトして pan/zoom 描画
- 相関グラフ（全体）: `components/islands/RelationGraph.tsx`（Cytoscape + dagre）
- グラフ導出・検証: `src/lib/graph/derive.ts`（`validateAll()` がビルド時に警告）

## Phase 1 で確定させたいこと → Phase 2 へ

- ノードグラフの情報量・深さ（`OKI_MAX_DEPTH_*`）・初期ズーム
- ノードの中身（コマンドアイコン＋技名＋メモ で十分か。フレームやゲージ消費も出すか）
- 分岐の見せ方（どこまで別ルートを枝として出すか）
- コンボ個別フローと全体相関グラフを両方持つか、片方に寄せるか
- 「択の特徴」の項目（strongVs / weakVs / useWhen / onBlock / risk）
- コンボ一覧のフィルタ項目の過不足
- ノード粒度の運用ルール（どこまでを同一ノードにまとめるか）
