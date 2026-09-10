# コンテンツ作成ガイド（草案 / P2-5）

実データ（コンボ・起き攻め・技）を追加・更新するときの手順とルール。
形状の正は `src/data/schema.ts`（Zod）。このファイルは「どう書くか」の運用ルール。

> 草案。実例を数本入れて（P2-4a / P2-7）から確定する。RV-03 / RV-06 / RV-07 の方針を含む。

## 1. ファイルの置き場所

```
src/content/
  characters/manon/<id>.json      … キャラ
  situations/manon/<id>.json       … 状況ノード
  routes/manon/<id>.json           … パーツ（辺）
  combos/manon/<slug>.json         … 名前付きコンボ
  moves/manon/<key>.json           … 技辞典
```

1 レコード 1 ファイル。ファイル名 = レコードの id / slug / key と一致させる。

## 2. id / slug / key の命名規則（B-4）

| 種類 | 規則 | 例 |
|---|---|---|
| Situation `id` | `<状況>_<修飾>` snake_case | `kd_after_degage_light_mid` / `neutral_mid` / `juggle_can_4hp_ranversement` |
| Route `id` | `<役割>_<内容>` snake_case。起き攻めは `oki_` 接頭 | `starter_2mk_mid` / `route_4hp_ranversement_mid` / `oki_dr2mk_from_degage_light` |
| Combo `slug` | `manon-<場所>-<始動>-<締め>` kebab-case（URL になる） | `manon-mid-5mp-drc-ranversement` |
| Move `key` | `manon-<技略称>` kebab-case。強度は末尾 | `manon-5mp` / `manon-ranversement-m` / `manon-rondpoint-od` |

`moveKey` はこの Move `key` を指す。

## 3. コマンド表記（`command`）

- numpad 正準表記で保存: `5MP` `2MK` `236MP` `214LK` `[4]6HK` `j.HK` `63214P` `DR` `DRC` `LPLK`
- OD: `236KK` / `236PP`（ボタン2つ）。単独 OD 接頭は `OD236MP`
- PC / CH は `PC 5HP` のように前置
- **技コマンドでない操作**は `action` を付ける（`command` はダミーでよい）:
  - `walk` 微歩き / `walk_back` 様子見（微後ろ歩き） / `dash` 前ステップ（`66`）/ `dash_back` バックステップ / `whiff` 空振り（`command` は実際の技） / `wait` 何もしない
  - `action` 付き step はフレームを出さない。`moveKey` は不要
- モダン入力は原則 `moveKey` 経由（`moves.inputModern`）。step 個別に上書きしたいときだけ `commandModern`

## 4. 状況ノードの粒度（U-6 / RV-03）

**既定は「統合」**。ノード = 「そこから取れる選択肢セットが意味的に同じゲーム状況」。

- 数フレーム差・多少の補正差など「どのルートが可能かを変えない」違い → 同一ノード。条件は Route の `constraints` に短く書く
- **選択肢セットそのものが変わるとき**（パニカン限定ルート、端限定ルート、受け身で繋がり方が変わる 等）→ ノードを分割する
  （高度な条件評価器は当面作らない。分割で対応）
- 共有ノードを作るときは「各到達経路 × 後続 Route」で成立を確認する。未確認の連結を「無条件で成立するルート」として公開しない

### `position`（A-3）
- ほとんどは `midscreen` か `corner`。まずこの2つで考える
- `near_corner` = 端付近（多少の距離調整が効くが厳密な端限定ではない）。乱用しない
- `anywhere` = 位置を問わず同じ択

### `opponentState` と受け身
- `knockdown_soft` = 受け身可 → 起き攻め Route に `properties.wakeup`（`coverage` / `quickRise` / `backTech`）を書く
- `knockdown_hard` = 受け身不可（強制ダウン）→ Route に `wakeup` を書かない

## 5. 有利フレーム（`properties.frameAdvantage`）（RV-06）

- `{ frames: "+2", note: "2中K持続当て" }`。`frames` は符号付き数値のみ（表示側で `F` を付ける）
- 測定対象を `note` に明記する（「重ねをガードされた後」「前ステ後、相手の起き上がりまで」等）。受け身別の値は基本「後ろ受け身」を代表値に
- ガード後の値と、まだ攻め継続中の有利は別物として扱う（並べ替え・色判定を混ぜない）

## 5.5 Dゲージ消費（`resources.driveCost`）

**1 パーツで消費した本数を入れる。** 内訳:

| 行動 | 消費 |
|---|---|
| CDR（キャンセルドライブラッシュ。技をキャンセルして出すラッシュ。レシピ表記「CDR」「CR」） | **3 本** |
| 生ドライブラッシュ（キャンセルでない。レシピ表記「DR」「ラッシュ」「生ラッシュ」） | **1 本** |
| OD 必殺技（PP / KK） | **2 本** |
| ドライブインパクト | 1 本 |
| ドライブパリィ | 0（ヒット時に回復） |

コンボ合計は各パーツの `driveCost` の和（`driveCostOverride` で上書き可）。

## 6. ダメージ（RV-04）

- Route の `damage` は「そのパーツ単体の目安」
- Combo の合計は Route の和（`damageOverride` で上書き可）
- **未確認の合計値を実測値として表示・ソートしない。0 ダメージ扱いにしない**（P2-1 で確認状態フィールドを追加予定）

### 6.1 メダル変動ダメージ（マノン特有）

マノンは**メダル保持数（Lv1〜5）**で マネージュ・ドレ／ランヴェルセ／SA3・CA のダメージが変動する（他キャラにない仕様）。
これらで〆るコンボは1つの固定値にならない。

- `combo.damageOverride` には **メダルLv1（下限）の実測値**を入れる（ニュートラルからの基本ケース。ソート・フィルタもこの値）
- `combo.damageNote`（string, optional）に変動を明記する
  - 実測済み: `"メダルLv1: 4,508 / Lv5: 4,808（メダル保持数で SA3 分が変動）"`
  - 実測前: `"メダル保持数で〆のランヴェルセ分が変動（表示値は素点合計＝実測前）"`
- UI: 一覧カードはダメージに `±` を付け注記を1行、詳細ページはダメージ値の下に注記
- 対象の技: `manon-manege-l/h/od`・`manon-ranversement-l/m/h/od`・`manon-sa3`（グラン・フェッテ自体は固定 800）

## 7. 技辞典（`moves`）（RV-02）

- 出典 = 公式フレームデータ / コマンドリスト（`streetfighter.com/6/ja-jp/character/manon/frame` ・ `.../movelist`）
- `verifiedVersion` に確認したゲームバージョンを必ず入れる
- `inputModern`: モダンに存在しない技は `null`。モダンでも motion 入力が通る場合は `inputModernPrecise`
- **未確認の入力を架空の値で埋めない**。`null` ＋ `notes` で状態を残す

## 8. 更新手順（技が変わったとき）（RV-07 / B-3）

1. 変更候補の抽出: 変わった `moveKey` から `Route`（steps.moveKey）→ `Combo`（routeChain）を逆引き
2. 影響一覧を作る（起き攻めルート・到達 Situation への波及も含む）
3. 再確認: 実機でレシピ・数値・接続を確認
4. 公開更新: `verifiedVersion` を更新してコミット

## 9. 追加後のチェック

```
npm run validate     # 参照・chain・重複・宣言と入力の矛盾
npm run test          # 回帰
npm run build         # 検証ゲート込みの本番ビルド
```

`npm run check` は上記＋ `astro check` をまとめて実行する。
