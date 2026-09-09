# Phase 1 プロトタイプ — レビューガイド

UI/UX 確認用のプロトタイプです。**マノンのデータはすべてダミー（仮）**。
コマンド・ダメージ・フレーム・起き攻めの中身は正確ではありません。UI と操作感の確認が目的です。

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
| **コンボ詳細（ノードグラフ）** | `/manon/combos/manon-mid-5mp-drc-ranversement/` | ComfyUI 風のフローキャンバス。1 手＝1 ノードで左→右。**別の締め（SA3）が分岐**。締めのダウンから**破線で起き攻めが扇状に**。起き攻めの枠には**その択の特徴（◯有効な相手行動 / ×弱い / ⚠注意点 / リスク）**を表示。ツールバーの「全画面」で画面いっぱい表示。テキスト表記は「テキストで見る」に折りたたみ |
| **起き攻めフロー** | `/manon/situations/kd_after_degage_light_mid/` | 起点から破線で各択（DR だけでなく**微歩き・前ステップ**も）→ ヒット後は実線でコンボ継続 → 次のダウンでまた扇状（ループ／既出／続き で打ち切り）。下に各択の特徴カード。`kd_after_ranversement_mid` には**フレーム消費技（5弱P空振り）**の例あり |
| 連結ハブ | `/manon/situations/juggle_can_4hp_ranversement/` | 起き攻めと頻出コンボが共有する中継ノード |
| パーツ詳細 | `/manon/routes/oki_dr2mk_from_degage_light/` | 択の特徴、接続元／先ノード、同起点・同着地点の他パーツ |
| 相関グラフ（全体俯瞰） | `/manon/graph/` | 状況とパーツの全体像。Cytoscape の別ビュー（コンボ個別のフローとは別物） |
| 表記の見方 | `/guide/notation/` | アイコン ⇄ テキスト切替（右上トグル、設定は記憶） |

## データモデル（3層グラフ）

- `src/data/dummy/situations.ts` — 状況ノード
- `src/data/dummy/routes.ts` — パーツ（辺）＝再利用単位、起き攻めの「択の特徴」を保持
- `src/data/dummy/combos.ts` — 名前付き経路（route の連結）
- `src/data/types.ts` — 型定義

連結の肝: 起き攻めの `oki_dr2mk_from_degage_light` と頻出コンボ内の `starter_5mp_drc_2mp_mid` が
**同じノード `juggle_can_4hp_ranversement`** に到達し、その先の締めパーツ `route_4hp_ranversement_mid` を共有する。

## 実装メモ

- Astro（静的出力）+ Tailwind v4 + Preact（島）
- コマンド表記: `src/lib/notation/` で numpad 正準表記をパース → アイコン／テキスト両方を DOM 出力し CSS で切替
  （Astro 版 `components/notation/Sequence.astro` と Preact 版 `components/islands/Notation.tsx`）
- **コンボ／起き攻めのノードグラフ**: `src/lib/graph/flow.ts` が step 単位の DAG を生成
  （`buildComboFlow` / `buildSituationFlow`、ループ・既出・深さで打ち切り）、
  `components/islands/FlowCanvas.tsx` が `@dagrejs/dagre` で左→右レイアウトして pan/zoom 描画
- 相関グラフ（全体）: `components/islands/RelationGraph.tsx`（Cytoscape + dagre）
- グラフ導出・検証: `src/lib/graph/derive.ts`（`validateAll()` がビルド時に警告）

## Phase 1 で確定させたいこと → Phase 2 へ

- ノードグラフの情報量・深さ（`OKI_MAX_DEPTH_*`）・初期ズーム。択が多い状況（6択など）の見やすさ
- 起き攻け枠に出す特徴項目（`strongVs` / `weakVs` / `caution` / `useWhen` / `onBlock` / `risk`）の粒度
- ノードの中身（コマンドアイコン＋技名＋メモ で十分か）
- 分岐の見せ方（どこまで別ルートを枝として出すか）
- コンボ個別フローと全体相関グラフを両方持つか、片方に寄せるか（`/manon/graph/` は旧 Cytoscape のまま）
- コンボ一覧のフィルタ項目の過不足
- ノード粒度の運用ルール（どこまでを同一ノードにまとめるか）
- 微歩き・前ステップ・フレーム消費技などの「コマンドではない操作」の表記ルール
