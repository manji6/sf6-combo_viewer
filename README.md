# SF6 コンボ・セットプレイビューア

Street Fighter 6 のコンボと**セットプレイ（起き攻めの分岐択）**を、状況ノード（situations）と
技の連なり（routes）の有向グラフとして表現する Astro 製の静的サイト。公開先:
<https://sf6.amanohashi.date>。

仕様の正は [`docs/SPEC.md`](docs/SPEC.md)、作業リストは [`docs/ROADMAP.md`](docs/ROADMAP.md)、
データ入稿ルールは [`docs/CONTENT.md`](docs/CONTENT.md)。データ登録は
[`register-combo` Skill](.claude/skills/register-combo/SKILL.md) を使う。

## 構成

- Astro（静的出力）+ TypeScript strict + Tailwind v4 + Preact islands（グラフ表示のみ）。
- データは `src/content/{situations,routes,combos,moves,characters}/<character>/*.json`
  （1 レコード 1 ファイル）。形状の正は Zod スキーマ（`src/data/schema.ts`）。
- ビルド時に `astro:build:start` フックでデータ全体の検証（`scripts/validate.ts`）を走らせ、
  壊れたデータではビルドを失敗させる。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動（`localhost:4321`） |
| `npm run build` | 本番ビルド（`./dist/`）。ビルド前にデータ検証が走る |
| `npm run validate` | データ整合性チェックのみ実行 |
| `npm run test` | vitest（notation パーサ・graph 導出・UI ヘルパー等） |
| `npm run check` | `validate` → `test` → `astro check` をまとめて実行。**PR・公開前に必ず通す** |
| `npm run promote-draft` | `drafts/*.json` を検証してから `src/content/` へ反映（`-- --dry-run` で反映せず確認のみ） |
| `npm run deploy` | `astro build && wrangler deploy`（Cloudflare Workers Static Assets） |

Cloudflare へは Workers Builds（Git 連携）で `main` push → 自動ビルド・デプロイ。

## データを追加・修正する

手作業で JSON を編集してもよいが、通常は `register-combo` Skill
（`.claude/skills/register-combo/SKILL.md`）経由で `drafts/` → プレビュー確認
（`http://localhost:4321/preview/`、dev 限定）→ `npm run promote-draft` の順で進める。
