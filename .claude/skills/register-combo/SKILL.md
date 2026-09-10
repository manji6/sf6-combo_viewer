---
name: register-combo
description: テキストのレシピ・技情報から SF6 コンボビューアの 3層グラフ JSON（situations / routes / combos / moves）を作成・更新する。numpad 正準表記への正規化、既存パーツ・ノードの再利用、差分プレビュー、承認後の書き込みまで。
---

# register-combo（最小版）

コンボ・起き攻め・技のデータを `src/content/**/*.json` に追加/更新する作業を支援する。

**形状の正**: `src/data/schema.ts`（Zod）。書き方のルール: `docs/CONTENT.md`。命名規則も `docs/CONTENT.md` §2。

## スコープ（最小版）

- 入力: **テキスト**（レシピ・技名・フレーム・起き攻めの分岐説明）。画像/YouTube 解析は対象外（後続）。
- 出力: `drafts/` に JSON を書く → ユーザー承認 → `npm run promote-draft` で `src/content/` へ移動。

## 手順

1. **取り込み・質問**
   - レシピ・状況・始動・締め・起き攻めの分岐を聞き取る。不足（ダメージ・フレーム・受け身・確認バージョン）は質問する。
   - 「ゲーム内で成立するか」の確認はユーザーに任せる。AI が推定で埋めない（`docs/CONTENT.md` §7）。

2. **正規化**
   - コマンドを numpad 正準表記へ（`5MP` `236MP` `214LK` `63214P` `DR` `DRC` `[4]6HK` `LPLK` 等）。
   - 技コマンドでない操作は `action`（`walk` / `dash` / `whiff` / `wait` …）。`docs/CONTENT.md` §3。

3. **既存の再利用**
   - `src/content/situations/manon/*.json` と `routes/manon/*.json` を読み、**同じ状況・同じパーツがあれば再利用**する。
   - 新規ノードを作るかは `docs/CONTENT.md` §4（既定は統合。選択肢セットが変わるときだけ分割）。
   - 技は `src/content/moves/manon/*.json` を見て `moveKey` で参照。無ければ `moves` レコードも作る。

4. **プレビュー（承認前）**
   - 生成する JSON をまず `drafts/<collection>__<id>.json` に書く（`__` 区切りでコレクションを表す）。
   - `npm run dev` → `http://localhost:4321/manon/_preview/` で、ドラフトの検証結果とダイジェスト（コンボ名／始動・締め／レシピ／合計ダメージ・ゲージ／★／起き攻めの分岐）を確認。
   - ターミナルにも同じダイジェストを出す。「新規ノード X（理由）・既存ノード Y 再利用・新規 route Z・更新 combo W」を明示。

5. **書き込み**
   - ユーザーが承認したら `npm run promote-draft`（`drafts/*.json` → `src/content/<collection>/manon/<id>.json`）。
   - `npm run check`（validate + test + astro check）を実行し、通ることを確認。

## やってはいけないこと

- 未確認の入力・数値を架空の値で埋める（`null` ＋ `notes` で状態を残す）。
- `controlType: 'both'` 宣言なのにモダン入力が未確認の技を含める（`npm run validate` が指摘する）。
- ダミー（既存の仮データ）の数値を「正しい」前提で流用する。
