// データ整合性チェック（CLI）。`npm run validate`
// vite-node で実行する（import.meta.glob と TS 解決のため）。
import process from 'node:process';
import { validateAll } from '../src/lib/graph/derive';

const errors = validateAll();
if (errors.length === 0) {
  console.log('OK: データ整合性に問題なし');
  process.exit(0);
}
console.error(`検証エラー ${errors.length} 件:`);
for (const e of errors) console.error(' - ' + e);
process.exit(1);
