---
name: register-combo
description: テキストのレシピ・技情報から SF6 コンボビューアの 3層グラフ JSON（situations / routes / combos / moves）を作成・更新する。numpad 正準表記への正規化、既存パーツ・ノードの再利用、差分プレビュー、承認後の書き込みまで。
---

# register-combo（最小版）

コンボ・起き攻め・技のデータを `src/content/**/*.json` に追加/更新する作業を支援する。

**形状の正**: `src/data/schema.ts`（Zod）。書き方のルール: `docs/CONTENT.md`。命名規則も `docs/CONTENT.md` §2。

## スコープ（最小版）

- 入力: **テキスト**（レシピ・技名・フレーム・起き攻めの分岐説明）。画像・動画そのものの解析は不可（動画は視聴できないため、文字起こし・要約テキスト・スクリーンショットを渡してもらう。詳細は下記「入力が動画のとき」）。
- 対象キャラは `src/data/characters.ts`（`characterIdSchema`）を見て確認する。新キャラを増やす場合はまずキャラクター自体の登録が必要（既存 `characters/*.json` を参照）。
- 出力: `drafts/` に JSON を書く → ユーザー承認 → `npm run promote-draft` で `src/content/` へ移動。

## 手順

1. **取り込み・質問**
   - レシピ・状況・始動・締め・起き攻めの分岐を聞き取る。不足（ダメージ・フレーム・受け身・確認バージョン）は質問する。
   - 「ゲーム内で成立するか」の確認はユーザーに任せる。AI が推定で埋めない（`docs/CONTENT.md` §7）。
   - 聞き取り内容に不明・曖昧な語（技名の誤変換、聞き取れないコマンド等）があれば、**一部だけ確認して進めず、見つかった不明点を全てまとめてから**ユーザーに聞く。

2. **正規化**
   - コマンドを numpad 正準表記へ（`5MP` `236MP` `214LK` `63214P` `DR` `DRC` `[4]6HK` `LPLK` 等）。
   - 技コマンドでない操作は `action`（`walk` / `dash` / `whiff` / `feint` / `wait` …）。`docs/CONTENT.md` §3。

3. **既存の再利用**
   - `src/content/situations/<char>/*.json` と `routes/<char>/*.json` を読み、**同じ状況・同じパーツがあれば再利用**する（`<char>` は対象キャラの id）。
   - 新規ノードを作るかは `docs/CONTENT.md` §4（既定は統合。選択肢セットが変わるときだけ分割）。
   - 技は `src/content/moves/<char>/*.json` を見て `moveKey` で参照。無ければ `moves` レコードも作る。
   - id/slug/key の命名は `docs/CONTENT.md` §2（マノン以外は `<char>_` 接頭辞が必須。situations/routes/combos の id はキャラをまたいで一意にする）。
   - モダン対応の可否・入力は公式サイトの frame/movelist ページの Classic/Modern タブを直接見て判定する（実機確認は不要）。詳細は `docs/CONTENT.md` §7。

4. **プレビュー（承認前）**
   - 生成する JSON をまず `drafts/<collection>__<id>.json` に書く（`__` 区切りでコレクションを表す。id はファイル内の id/slug/key と一致させる）。
   - `npm run dev` → `http://localhost:4321/preview/` で、ドラフトの**スキーマ検証**と、既存データとマージした**全体検証**（参照・chain の連続性・character 整合。`npm run promote-draft` と同じロジック）の結果を確認する。既存 id と一致するドラフトは「更新」と表示される。
   - このプレビューは JSON と検証結果の表示までで、アプリと同じ見た目（ComboCard・FlowCanvas 等）では描画しない。レシピ・分岐の見た目を確認したい場合は、ターミナルにコンボ名／始動・締め／レシピ／合計ダメージ・ゲージ／★／起き攻めの分岐をテキストダイジェストとして出す。「新規ノード X（理由）・既存ノード Y 再利用・新規 route Z・更新 combo W」を明示。

5. **書き込み**
   - まず `npm run promote-draft -- --dry-run` で反映内容（新規／更新の一覧）と検証結果だけを確認する。
   - ユーザーが承認したら `npm run promote-draft`（`drafts/*.json` → `src/content/<collection>/<char>/<id>.json`）。全件のスキーマ検証・全体検証を通らない限り 1 件も反映されない（1 件でも不正なら drafts はそのまま残る）。
   - `npm run check`（validate + test + astro check）を実行し、通ることを確認する。

## やってはいけないこと

- 未確認の入力・数値を架空の値で埋める（`null` ＋ `notes` で状態を残す）。
- `controlType: 'both'` 宣言なのにモダン入力が未確認の技を含める（`npm run validate` が指摘する）。
- ダミー（既存の仮データ）の数値を「正しい」前提で流用する。
- 「出典」「オーナー実機確認」「実測」「素点合計」等の制作メモ的な語を公開 JSON のフィールドに書く（`docs/CONTENT.md` §6.1）。状態を残したい場合は `damageConfidence: 'estimated'`（route）や `damageNote`（combo）等、スキーマ上の該当フィールドを使う。
