// ドメインスキーマ（Zod）。データ形状の唯一の正。型は z.infer で導出する。
// JSON レコード（src/content/**）と content.config.ts の両方がこれを使う。
// 各レコードは .strict() とし、スキーマに無いキーは検証エラーにする（未知フィールドを
// 黙って捨てない。R07: 2026-09-12 レビュー）。
import { z } from 'zod';

export const characterIdSchema = z.enum(['manon', 'blanka']);

export const positionSchema = z.enum(['midscreen', 'near_corner', 'corner', 'anywhere']);

export const opponentStateSchema = z.enum([
  'neutral',
  'standing_hit',
  'crouch_hit',
  'juggle',
  'air',
  'wall_splat',
  'knockdown_soft',
  'knockdown_hard',
  'blockstun',
]);

export const situationKindSchema = z.enum([
  'neutral',
  'hit',
  'juggle',
  'knockdown',
  'blockstring',
  'okiStart',
]);

export const routeKindSchema = z.enum([
  'starter',
  'combo_route',
  'okizeme',
  'ender',
  'conversion',
]);

export const riskSchema = z.enum(['低', '中', '高']);
export const controlTypeSchema = z.enum(['classic', 'both']);
export const stepActionSchema = z.enum([
  'walk',
  'walk_back',
  'dash',
  'dash_back',
  'whiff',
  'feint',
  'wait',
]);
export const moveCategorySchema = z.enum(['normal', 'unique', 'special', 'super', 'throw', 'common']);

export const videoSchema = z
  .object({ youtubeId: z.string(), start: z.number() })
  .strict()
  .nullable();

// ★1〜5。小数・0・999 等の意味のない値を弾く（R07: 2026-09-12 レビュー）
export const difficultySchema = z.number().int().min(1).max(5);
// ダメージ・ゲージ消費等の非負量。マイナス値は入力ミスとして弾く
export const nonNegativeSchema = z.number().nonnegative();

export const situationSchema = z
  .object({
    id: z.string(),
    character: characterIdSchema,
    label: z.string(),
    kind: situationKindSchema,
    position: positionSchema,
    opponentState: opponentStateSchema,
    // 数値フレームまたは自由記述の状態説明。「相手復帰まで」等の前提は表示側（lib/ui.ts の
    // parseAdvantage）が advantage の書式と situation.kind から判断する。報酬（メダル等）は
    // reward に分離し、advantage に混在させない（R03: 2026-09-12 レビュー）。
    advantage: z.string().optional(),
    // 報酬・状態変化（例:「メダル獲得 +1」）。フレーム有利とは別概念。
    reward: z.string().optional(),
    wakeupNote: z.string().optional(),
    tags: z.array(z.string()),
    notes: z.string().optional(),
  })
  .strict();

export const stepSchema = z
  .object({
    move: z.string(),
    command: z.string(),
    action: stepActionSchema.optional(),
    commandModern: z.string().optional(),
    moveKey: z.string().optional(),
    cancel: z.boolean().optional(),
    note: z.string().optional(),
  })
  .strict();

export const moveSchema = z
  .object({
    key: z.string(),
    character: characterIdSchema,
    name: z.string(),
    category: moveCategorySchema,
    inputClassic: z.string(),
    inputModern: z.string().nullable(),
    inputModernPrecise: z.string().optional(),
    startup: z.number().nullable(),
    active: z.string().nullable(),
    recovery: z.string().nullable(),
    onHit: z.string().nullable(),
    onBlock: z.string().nullable(),
    cancel: z.string().nullable(),
    damage: nonNegativeSchema.nullable(),
    comboScaling: z.string().nullable().optional(),
    driveGainHit: z.number().nullable().optional(),
    driveLossBlock: z.number().nullable().optional(),
    driveLossPunishCounter: z.number().nullable().optional(),
    superGain: z.number().nullable().optional(),
    attribute: z.array(z.string()).optional(),
    notes: z.string().optional(),
    verifiedVersion: z.string(),
  })
  .strict();

export const routePropertiesSchema = z
  .object({
    frameAdvantage: z
      .object({ frames: z.string(), note: z.string().optional() })
      .strict()
      .optional(),
    wakeup: z
      .object({
        coverage: z.enum(['both', 'quick', 'back']),
        quickRise: z.string().optional(),
        backTech: z.string().optional(),
        note: z.string().optional(),
      })
      .strict()
      .optional(),
    strongVs: z.array(z.string()).optional(),
    weakVs: z.array(z.string()).optional(),
    useWhen: z.string().optional(),
    onBlock: z.string().optional(),
    caution: z.string().optional(),
    risk: riskSchema.optional(),
  })
  .strict();

export const routeResourcesSchema = z
  .object({
    driveCost: nonNegativeSchema,
    superCost: nonNegativeSchema,
    saLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  })
  .strict();

// ダメージ数値の確からしさ（R05: 2026-09-12 レビュー）。未指定は 'measured' 扱い
// （オーナー実機確認・動画内の申告値など、これまで通りの数値）。
// 'estimated' は各技の基礎値合計等で、コンボ補正・実機確認が未反映の目安値。
export const damageConfidenceSchema = z.enum(['measured', 'estimated']);

export const routeSchema = z
  .object({
    id: z.string(),
    character: characterIdSchema,
    from: z.string(),
    to: z.string(),
    kind: routeKindSchema,
    label: z.string(),
    steps: z.array(stepSchema),
    resources: routeResourcesSchema,
    damage: nonNegativeSchema,
    damageConfidence: damageConfidenceSchema.optional(),
    difficulty: difficultySchema,
    constraints: z.string().optional(),
    properties: routePropertiesSchema.optional(),
    controlType: controlTypeSchema,
    tags: z.array(z.string()),
    video: videoSchema.optional(),
    notes: z.string().optional(),
  })
  .strict();

export const comboSchema = z
  .object({
    slug: z.string(),
    character: characterIdSchema,
    name: z.string(),
    situationLabel: z.string(),
    routeChain: z.array(z.string()),
    startFrom: z.string(),
    endAt: z.string(),
    damageOverride: nonNegativeSchema.nullable().optional(),
    // マノン特有: メダル保持数(Lv1〜5)で マネージュ・ドレ／ランヴェルセ／SA3・CA のダメージが変動する。
    // damageOverride にはメダルLv1（下限）の実測値を入れ、変動幅をこの注記で示す。
    damageNote: z.string().optional(),
    // damageOverride の確からしさ（未指定は 'measured'）。route 側が estimated でも
    // combo が実測 override を持てば measured に上書きできる
    damageConfidence: damageConfidenceSchema.optional(),
    driveCostOverride: nonNegativeSchema.nullable().optional(),
    difficulty: difficultySchema,
    tags: z.array(z.string()),
    video: videoSchema.optional(),
    description: z.string().optional(),
  })
  .strict();

export const characterSchema = z
  .object({
    id: characterIdSchema,
    name: z.string(),
    nameEn: z.string(),
    tagline: z.string(),
    accent: z.string(),
  })
  .strict();

// ── 導出型 ──────────────────────────────
export type CharacterId = z.infer<typeof characterIdSchema>;
export type Position = z.infer<typeof positionSchema>;
export type OpponentState = z.infer<typeof opponentStateSchema>;
export type SituationKind = z.infer<typeof situationKindSchema>;
export type RouteKind = z.infer<typeof routeKindSchema>;
export type Risk = z.infer<typeof riskSchema>;
export type ControlType = z.infer<typeof controlTypeSchema>;
export type StepAction = z.infer<typeof stepActionSchema>;
export type DamageConfidence = z.infer<typeof damageConfidenceSchema>;
export type MoveCategory = z.infer<typeof moveCategorySchema>;
export type Situation = z.infer<typeof situationSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Move = z.infer<typeof moveSchema>;
export type RouteProperties = z.infer<typeof routePropertiesSchema>;
export type RouteResources = z.infer<typeof routeResourcesSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Combo = z.infer<typeof comboSchema>;
export type Character = z.infer<typeof characterSchema>;
