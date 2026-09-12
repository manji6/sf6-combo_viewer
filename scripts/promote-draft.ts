// drafts/<collection>__<id>.json を src/content/<collection>/<character>/<id>.json へ移動する。
// <character> はレコードの character フィールド（characters コレクションのみ id フィールド）から決める。
// `npm run promote-draft`
import { readdirSync, readFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  characterSchema,
  comboSchema,
  moveSchema,
  routeSchema,
  situationSchema,
} from '../src/data/schema';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const draftsDir = join(root, 'drafts');

const schemas: Record<string, { safeParse: (v: unknown) => { success: boolean; error?: unknown } }> = {
  characters: characterSchema,
  situations: situationSchema,
  routes: routeSchema,
  combos: comboSchema,
  moves: moveSchema,
};

const files = readdirSync(draftsDir).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.log('drafts/ に JSON がありません');
  process.exit(0);
}

let moved = 0;
for (const f of files) {
  const m = f.match(/^([a-z]+)__(.+)\.json$/);
  if (!m) {
    console.error(`スキップ: ${f}（形式 <collection>__<id>.json ではない）`);
    continue;
  }
  const [, collection, id] = m;
  const schema = schemas[collection];
  if (!schema) {
    console.error(`スキップ: ${f}（未知のコレクション ${collection}）`);
    continue;
  }
  const raw = JSON.parse(readFileSync(join(draftsDir, f), 'utf8'));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`検証エラー: ${f}\n${JSON.stringify(parsed.error, null, 2)}`);
    process.exit(1);
  }
  const character = (raw as { character?: string; id?: string }).character
    ?? (collection === 'characters' ? (raw as { id?: string }).id : undefined);
  if (!character) {
    console.error(`スキップ: ${f}（character フィールドが見つからない）`);
    continue;
  }
  const destDir = join(root, 'src', 'content', collection, character);
  mkdirSync(destDir, { recursive: true });
  renameSync(join(draftsDir, f), join(destDir, `${id}.json`));
  console.log(`${collection}/${character}/${id}.json ← ${f}`);
  moved++;
}
console.log(`${moved} 件を promote。npm run check で検証してください。`);
process.exit(0);
