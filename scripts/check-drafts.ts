// drafts/ を現在の src/content にマージした状態で validateAll を回す（promote 前の確認）。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { validateAll } from '../src/lib/graph/derive';

const d = 'drafts';
const byColl: Record<string, any[]> = { situations: [], routes: [], combos: [], moves: [] };
for (const f of readdirSync(d).filter((x) => x.endsWith('.json'))) {
  const m = f.match(/^([a-z]+)__(.+)\.json$/);
  if (m && byColl[m[1]]) byColl[m[1]].push(JSON.parse(readFileSync(join(d, f), 'utf8')));
}
const errs = validateAll({
  situations: byColl.situations,
  routes: byColl.routes,
  combos: byColl.combos,
  moves: byColl.moves,
});
if (errs.length === 0) {
  console.log('validateAll OK（下書きマージ時）');
  process.exit(0);
}
console.error(`エラー ${errs.length} 件:`);
for (const e of errs) console.error(' - ' + e);
process.exit(1);
