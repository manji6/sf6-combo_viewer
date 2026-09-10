// drafts/<collection>__<id>.json を src/content/<collection>/manon/<id>.json へ移動する。
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
  const destDir = join(root, 'src', 'content', collection, 'manon');
  mkdirSync(destDir, { recursive: true });
  renameSync(join(draftsDir, f), join(destDir, `${id}.json`));
  console.log(`${collection}/${id}.json ← ${f}`);
  moved++;
}
console.log(`${moved} 件を promote。npm run check で検証してください。`);
process.exit(0);
