// ドメインスキーマ（Zod）。データ形状の唯一の正。型は z.infer で導出する。
// JSON レコード（src/content/**）と content.config.ts の両方がこれを使う。
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
  .nullable();

export const situationSchema = z.object({
  id: z.string(),
  character: characterIdSchema,
  label: z.string(),
  kind: situationKindSchema,
  position: positionSchema,
  opponentState: opponentStateSchema,
  advantage: z.string().optional(),
  wakeupNote: z.string().optional(),
  tags: z.array(z.string()),
  notes: z.string().optional(),
});

export const stepSchema = z.object({
  move: z.string(),
  command: z.string(),
  action: stepActionSchema.optional(),
  commandModern: z.string().optional(),
  moveKey: z.string().optional(),
  cancel: z.boolean().optional(),
  note: z.string().optional(),
});

export const moveSchema = z.object({
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
  damage: z.number().nullable(),
  comboScaling: z.string().nullable().optional(),
  driveGainHit: z.number().nullable().optional(),
  driveLossBlock: z.number().nullable().optional(),
  driveLossPunishCounter: z.number().nullable().optional(),
  superGain: z.number().nullable().optional(),
  attribute: z.array(z.string()).optional(),
  notes: z.string().optional(),
  verifiedVersion: z.string(),
});

export const routePropertiesSchema = z.object({
  frameAdvantage: z
    .object({ frames: z.string(), note: z.string().optional() })
    .optional(),
  wakeup: z
    .object({
      coverage: z.enum(['both', 'quick', 'back']),
      quickRise: z.string().optional(),
      backTech: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
  strongVs: z.array(z.string()).optional(),
  weakVs: z.array(z.string()).optional(),
  useWhen: z.string().optional(),
  onBlock: z.string().optional(),
  caution: z.string().optional(),
  risk: riskSchema.optional(),
});

export const routeResourcesSchema = z.object({
  driveCost: z.number(),
  superCost: z.number(),
  saLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
});

export const routeSchema = z.object({
  id: z.string(),
  character: characterIdSchema,
  from: z.string(),
  to: z.string(),
  kind: routeKindSchema,
  label: z.string(),
  steps: z.array(stepSchema),
  resources: routeResourcesSchema,
  damage: z.number(),
  difficulty: z.number(),
  constraints: z.string().optional(),
  properties: routePropertiesSchema.optional(),
  controlType: controlTypeSchema,
  tags: z.array(z.string()),
  video: videoSchema.optional(),
  notes: z.string().optional(),
});

export const comboSchema = z.object({
  slug: z.string(),
  character: characterIdSchema,
  name: z.string(),
  situationLabel: z.string(),
  routeChain: z.array(z.string()),
  startFrom: z.string(),
  endAt: z.string(),
  damageOverride: z.number().nullable().optional(),
  // マノン特有: メダル保持数(Lv1〜5)で マネージュ・ドレ／ランヴェルセ／SA3・CA のダメージが変動する。
  // damageOverride にはメダルLv1（下限）の実測値を入れ、変動幅をこの注記で示す。
  damageNote: z.string().optional(),
  driveCostOverride: z.number().nullable().optional(),
  difficulty: z.number(),
  tags: z.array(z.string()),
  video: videoSchema.optional(),
  description: z.string().optional(),
});

export const characterSchema = z.object({
  id: characterIdSchema,
  name: z.string(),
  nameEn: z.string(),
  tagline: z.string(),
  accent: z.string(),
});

// ── 導出型 ──────────────────────────────
export type CharacterId = z.infer<typeof characterIdSchema>;
export type Position = z.infer<typeof positionSchema>;
export type OpponentState = z.infer<typeof opponentStateSchema>;
export type SituationKind = z.infer<typeof situationKindSchema>;
export type RouteKind = z.infer<typeof routeKindSchema>;
export type Risk = z.infer<typeof riskSchema>;
export type ControlType = z.infer<typeof controlTypeSchema>;
export type StepAction = z.infer<typeof stepActionSchema>;
export type MoveCategory = z.infer<typeof moveCategorySchema>;
export type Situation = z.infer<typeof situationSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Move = z.infer<typeof moveSchema>;
export type RouteProperties = z.infer<typeof routePropertiesSchema>;
export type RouteResources = z.infer<typeof routeResourcesSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Combo = z.infer<typeof comboSchema>;
export type Character = z.infer<typeof characterSchema>;
