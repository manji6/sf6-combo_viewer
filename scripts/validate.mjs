// データ整合性チェック（Phase 1 版）。`node scripts/validate.mjs`
import { validateAll } from '../src/lib/graph/derive.ts';

const errors = validateAll();
if (errors.length === 0) {
  console.log('OK: データ整合性に問題なし');
  process.exit(0);
}
console.error(`検証エラー ${errors.length} 件:`);
for (const e of errors) console.error(' - ' + e);
process.exit(1);
