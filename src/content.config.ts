// Astro コンテンツコレクション定義。
// スキーマは src/data/schema.ts（Zod）が唯一の正。ここはそれを登録するだけ。
//
// 注: アプリの導出処理（derive / flow / 各ページの getStaticPaths）は同期が必要なため、
// 実データの読み込みは src/data/index.ts の import.meta.glob 経由（同期・Zod 検証つき）で行う。
// この content.config.ts は登録と getCollection（非同期 API）用。同じ JSON を指す。
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import {
  characterSchema,
  comboSchema,
  moveSchema,
  routeSchema,
  situationSchema,
} from './data/schema';

const base = (dir: string) => glob({ pattern: '**/*.json', base: `./src/content/${dir}` });

export const collections = {
  characters: defineCollection({ loader: base('characters'), schema: characterSchema }),
  situations: defineCollection({ loader: base('situations'), schema: situationSchema }),
  routes: defineCollection({ loader: base('routes'), schema: routeSchema }),
  combos: defineCollection({ loader: base('combos'), schema: comboSchema }),
  moves: defineCollection({ loader: base('moves'), schema: moveSchema }),
};
