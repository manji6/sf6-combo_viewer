import type { AstroIntegration } from 'astro';
import { validateAll } from '../lib/graph/derive';

/**
 * ビルド開始時にデータ整合性を検証し、エラーがあればビルドを止める（RV-08）。
 * dev では警告のみ（編集中に落とさない）。
 */
export function validateData(): AstroIntegration {
  return {
    name: 'sf6cv:validate-data',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const errors = validateAll();
        if (errors.length === 0) {
          logger.info(`データ整合性 OK（${errors.length} エラー）`);
          return;
        }
        logger.error(`データ整合性エラー ${errors.length} 件:`);
        for (const e of errors) logger.error(' - ' + e);
        throw new Error(`データ検証に失敗しました（${errors.length} 件）。ビルドを中止します。`);
      },
      'astro:server:setup': ({ logger }) => {
        const errors = validateAll();
        if (errors.length > 0) {
          logger.warn(`データ整合性の警告 ${errors.length} 件（dev のため続行）:`);
          for (const e of errors) logger.warn(' - ' + e);
        }
      },
    },
  };
}
