// ダメージ計算エンジン（候補ルール、DC-1 未確定）の答え合わせ用スクリプト。
// 既存の手入力ダメージ（damageOverride / Route.damage の合計）と、
// src/lib/damage の計算結果を並べて比較する。表示・データは一切変更しない。
//
// 使い方:
//   npm run damage:audit                    全コンボを一覧比較
//   npm run damage:audit -- manon           slug に "manon" を含むものだけ
//   npm run damage:audit -- --hits          差が大きい上位のヒット内訳も表示
//   npm run damage:audit -- manon-jump --hits   絞り込み＋内訳
import process from 'node:process';
import { combos } from '../src/data';
import { flattenCombo } from '../src/lib/graph/derive';
import { calculateComboDamage } from '../src/lib/damage';

const args = process.argv.slice(2);
const showHits = args.includes('--hits');
const filter = args.find((a) => !a.startsWith('--'));

const targets = combos
  .filter((c) => !filter || c.slug.includes(filter))
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (targets.length === 0) {
  console.log('対象コンボが見つかりません。');
  process.exit(0);
}

interface Row {
  slug: string;
  character: string;
  confidence: string;
  recorded: number;
  calculated: number;
  diff: number;
  status: string;
  issues: number;
}

const rows: Row[] = [];
for (const combo of targets) {
  const flat = flattenCombo(combo);
  const calc = calculateComboDamage(combo);
  rows.push({
    slug: combo.slug,
    character: combo.character,
    confidence: flat.damageConfidence,
    recorded: flat.totalDamage,
    calculated: calc.totalDamage,
    diff: calc.totalDamage - flat.totalDamage,
    status: calc.status,
    issues: calc.issues.length,
  });
}

rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(
  pad('slug', 42) + pad('char', 8) + pad('確度', 10) + pad('記録値', 8) + pad('計算値', 8) + pad('差', 8) + pad('状態', 10) + '問題',
);
console.log('-'.repeat(100));
for (const r of rows) {
  console.log(
    pad(r.slug, 42) +
      pad(r.character, 8) +
      pad(r.confidence, 10) +
      pad(r.recorded, 8) +
      pad(r.calculated, 8) +
      pad(r.diff, 8) +
      pad(r.status, 10) +
      (r.issues > 0 ? `${r.issues}件` : ''),
  );
}

const exact = rows.filter((r) => r.diff === 0).length;
const withIssues = rows.filter((r) => r.issues > 0).length;
console.log('-'.repeat(100));
console.log(
  `${rows.length} 件中 一致 ${exact} 件・不一致 ${rows.length - exact - withIssues}件・計算不能(issues) ${withIssues} 件`,
);
console.log(
  '※ ここでの「一致」は候補ルール（未確定）と手入力値がたまたま揃っただけの場合を含む。オーナー確認用の目安。',
);

if (showHits) {
  console.log('\n=== ヒット内訳（差が大きい順、上位10件） ===');
  for (const r of rows.slice(0, 10)) {
    const combo = combos.find((c) => c.slug === r.slug)!;
    const calc = calculateComboDamage(combo);
    console.log(`\n[${r.slug}] 記録値=${r.recorded} 計算値=${r.calculated} 差=${r.diff}`);
    for (const h of calc.hits) {
      console.log(
        `  #${h.stepIndex} ${h.move.padEnd(10)} base=${h.baseDamage} stage=${h.stage} ` +
          `${h.finalPercent}% => ${h.damage}  [${h.appliedRules.join(', ')}]`,
      );
    }
    for (const issue of calc.issues) {
      console.log(`  ! ${issue.message}`);
    }
  }
}
