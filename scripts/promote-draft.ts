// drafts/<collection>__<id>.json を src/content/<collection>/<character>/<id>.json へ移動する。
// <character> はレコードの character フィールド（characters コレクションのみ id フィールド）から決める。
//
// R06（2026-09-12 レビュー）対応: 以前は 1 件ずつ検証→即 rename していたため、
// 途中のファイルが不正だとそれ以前のファイルだけ本データへ移動済みになった。
// 今は「全件のスキーマ検証 → 既存データとマージした仮想データセットで validateAll」を
// すべて通ってから初めてファイルを動かす（1 件でも不正なら 1 件も反映しない）。
// 既存レコードと同じ id/slug/key を持つドラフトは「更新」として仮想データセットに
// マージする（重複 ID 扱いにしない）。
//
// `npm run promote-draft` / `npm run promote-draft -- --dry-run`（反映せず結果だけ表示）
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { characters, combos, moves, routes, situations } from '../src/data';
import { validateAll } from '../src/lib/graph/derive';
import {
  characterSchema,
  comboSchema,
  moveSchema,
  routeSchema,
  situationSchema,
} from '../src/data/schema';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const draftsDir = join(root, 'drafts');
const dryRun = process.argv.includes('--dry-run');

type AnySchema = {
  safeParse: (v: unknown) => {
    success: boolean;
    data?: unknown;
    error?: { issues: { path: PropertyKey[]; message: string }[] };
  };
};
const SCHEMAS: Record<string, AnySchema> = {
  characters: characterSchema,
  situations: situationSchema,
  routes: routeSchema,
  combos: comboSchema,
  moves: moveSchema,
};
// コレクションごとの識別キーと、既存データ配列（更新か新規かの判定・マージに使う）
const ID_FIELD: Record<string, string> = {
  characters: 'id',
  situations: 'id',
  routes: 'id',
  combos: 'slug',
  moves: 'key',
};
const EXISTING: Record<string, Record<string, unknown>[]> = {
  characters,
  situations,
  routes,
  combos,
  moves,
};

if (!existsSync(draftsDir)) {
  console.log('drafts/ がありません');
  process.exit(0);
}
const files = readdirSync(draftsDir).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.log('drafts/ に JSON がありません');
  process.exit(0);
}

interface Planned {
  file: string;
  collection: string;
  id: string;
  character: string;
  data: Record<string, unknown>;
  isUpdate: boolean;
}

const errors: string[] = [];
const planned: Planned[] = [];

for (const f of files) {
  const m = f.match(/^([a-z]+)__(.+)\.json$/);
  if (!m) {
    errors.push(`${f}: ファイル名が <collection>__<id>.json ではない`);
    continue;
  }
  const [, collection, idFromFilename] = m;
  const schema = SCHEMAS[collection];
  if (!schema) {
    errors.push(`${f}: 未知のコレクション「${collection}」`);
    continue;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(draftsDir, f), 'utf8'));
  } catch (e) {
    errors.push(`${f}: JSON 解析エラー（${(e as Error).message}）`);
    continue;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error!.issues
      .map((i) => `      ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    errors.push(`${f}: スキーマ検証エラー\n${detail}`);
    continue;
  }
  const data = parsed.data as Record<string, unknown>;
  const idField = ID_FIELD[collection];
  const id = data[idField] as string | undefined;
  if (!id) {
    errors.push(`${f}: ${idField} フィールドが無い`);
    continue;
  }
  if (id !== idFromFilename) {
    errors.push(`${f}: ファイル名の id（${idFromFilename}）と中身の ${idField}（${id}）が不一致`);
    continue;
  }
  const character = (data.character as string | undefined) ?? (collection === 'characters' ? id : undefined);
  if (!character) {
    errors.push(`${f}: character フィールドが見つからない`);
    continue;
  }
  const isUpdate = EXISTING[collection].some((r) => r[idField] === id);
  planned.push({ file: f, collection, id, character, data, isUpdate });
}

if (errors.length > 0) {
  console.error(`検証エラー ${errors.length} 件。1 件も反映しません:\n`);
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}

// 既存データ ＋ ドラフトの仮想データセット（同じ id/slug/key のドラフトは既存を置き換える＝更新）。
// これで全参照・chain・character 整合等を実際に反映される形と同じ条件で検証できる。
function merge<T extends Record<string, unknown>>(
  collection: string,
  existing: T[],
): T[] {
  const idField = ID_FIELD[collection];
  const byId = new Map(existing.map((r) => [r[idField], r]));
  for (const p of planned.filter((d) => d.collection === collection)) {
    byId.set(p.id, p.data as T);
  }
  return [...byId.values()];
}

const mergedDs = {
  situations: merge('situations', situations),
  routes: merge('routes', routes),
  combos: merge('combos', combos),
  moves: merge('moves', moves),
};
const graphErrors = validateAll(mergedDs);
if (graphErrors.length > 0) {
  console.error(`全体検証エラー ${graphErrors.length} 件（drafts 反映後を仮組みして検証）。1 件も反映しません:\n`);
  for (const e of graphErrors) console.error(' - ' + e);
  process.exit(1);
}

const creates = planned.filter((p) => !p.isUpdate);
const updates = planned.filter((p) => p.isUpdate);
console.log(`検証OK: ${planned.length} 件（新規 ${creates.length} 件・更新 ${updates.length} 件）`);
for (const p of planned) {
  console.log(`  ${p.isUpdate ? '更新' : '新規'}: ${p.collection}/${p.character}/${p.id}.json ← ${p.file}`);
}

if (dryRun) {
  console.log('\n--dry-run のため反映していません。');
  process.exit(0);
}

for (const p of planned) {
  const destDir = join(root, 'src', 'content', p.collection, p.character);
  mkdirSync(destDir, { recursive: true });
  renameSync(join(draftsDir, p.file), join(destDir, `${p.id}.json`));
}
console.log(`\n${planned.length} 件を promote しました。npm run check で最終確認してください。`);
process.exit(0);
