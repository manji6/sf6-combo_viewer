import type { Combo, RouteKind, Situation, SituationKind, Step } from '../../data/types';
import { getCombo, getRoute, getSituation } from '../../data';
import { outgoingRoutes } from './derive';
import { commandToText } from '../notation/parse';

export type FlowNodeType = 'step' | 'outcome' | 'start';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  command?: string;
  move?: string;
  note?: string;
  cancel?: boolean;
  situationId?: string;
  label?: string;
  sitKind?: SituationKind;
  /** 既出ノードへ戻る（ループ）ことを示す */
  loop?: boolean;
  /** これ以上の展開は省略（詳細ページへ） */
  more?: boolean;
  /** 別の枝で展開済み（重複を避けた） */
  repeat?: boolean;
  groupId?: string;
  w: number;
  h: number;
}

export interface FlowGroup {
  id: string;
  label: string;
  routeKind: RouteKind;
  variant: 'primary' | 'branch' | 'okizeme';
  nodeIds: string[];
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  variant: 'flow' | 'branch' | 'okizeme';
}

export interface FlowGraph {
  nodes: FlowNode[];
  groups: FlowGroup[];
  edges: FlowEdge[];
}

const NODE_MIN_W = 118;
const NODE_MAX_W = 240;

function stepSize(st: Step): { w: number; h: number } {
  const text = commandToText(st.command) || st.command;
  const base = 44 + text.length * 11;
  const w = Math.max(NODE_MIN_W, Math.min(NODE_MAX_W, base));
  const h = 64 + (st.note ? 15 : 0);
  return { w, h };
}

function outcomeSize(label: string): { w: number; h: number } {
  const w = Math.max(140, Math.min(220, 40 + label.length * 13));
  return { w, h: 52 };
}

function stepNode(id: string, st: Step, groupId: string): FlowNode {
  const { w, h } = stepSize(st);
  return {
    id,
    type: 'step',
    command: st.command,
    move: st.move,
    note: st.note,
    cancel: st.cancel,
    groupId,
    w,
    h,
  };
}

function outcomeNode(
  id: string,
  situation: Situation,
  opts: { loop?: boolean; more?: boolean; repeat?: boolean } = {},
): FlowNode {
  const { w, h } = outcomeSize(situation.label);
  return {
    id,
    type: 'outcome',
    situationId: situation.id,
    label: situation.label,
    sitKind: situation.kind,
    loop: opts.loop,
    more: opts.more,
    repeat: opts.repeat,
    w,
    h,
  };
}

interface BuildCtx {
  nodes: FlowNode[];
  groups: FlowGroup[];
  edges: FlowEdge[];
  uid: number;
  /** 既に一度展開した状況ノード（重複展開を防ぐグローバル集合） */
  seen: Set<string>;
}

function nextId(ctx: BuildCtx, prefix: string) {
  return `${prefix}_${ctx.uid++}`;
}

/** 1 本のパーツ（route）の step 群をノード化し、末尾ノード id を返す */
function emitRouteSteps(
  ctx: BuildCtx,
  routeId: string,
  variant: FlowGroup['variant'],
  sourceNodeId: string | null,
  firstEdgeVariant: FlowEdge['variant'],
): { firstId: string; lastId: string; groupId: string } {
  const route = getRoute(routeId);
  const groupId = nextId(ctx, `g_${route.id}`);
  const group: FlowGroup = {
    id: groupId,
    label: route.label,
    routeKind: route.kind,
    variant,
    nodeIds: [],
  };
  let prev: string | null = sourceNodeId;
  let firstId = '';
  let lastId = '';
  route.steps.forEach((st, i) => {
    const id = nextId(ctx, 'n');
    ctx.nodes.push(stepNode(id, st, groupId));
    group.nodeIds.push(id);
    if (i === 0) firstId = id;
    lastId = id;
    if (prev) {
      ctx.edges.push({
        id: nextId(ctx, 'e'),
        from: prev,
        to: id,
        variant: i === 0 ? firstEdgeVariant : 'flow',
      });
    }
    prev = id;
  });
  ctx.groups.push(group);
  return { firstId, lastId, groupId };
}

const OKI_MAX_DEPTH_COMBO = 1;
const OKI_MAX_DEPTH_SITUATION = 2;

const EXPANDABLE_KINDS = new Set<RouteKind>(['okizeme', 'ender', 'combo_route', 'conversion']);

/**
 * 状況ノードから先を再帰的に展開する。
 *  - okizeme パーツは破線で分岐（＝置き攻けの択）
 *  - ヒット後の拾い（ender / combo_route）は実線でたどり、次のダウンでまた okizeme を扇状展開
 *  - depth は「置き攻けの段数」。ヒット後の拾いは段を増やさない
 *  - path 内のループは loop、別の枝で展開済みなら repeat、深さ上限は more で打ち切る
 */
function expand(
  ctx: BuildCtx,
  situationId: string,
  sourceNodeId: string,
  depth: number,
  maxDepth: number,
  path: Set<string>,
) {
  const routes = outgoingRoutes(situationId).filter((r) => EXPANDABLE_KINDS.has(r.kind));
  if (routes.length === 0) return;

  const multiCont =
    routes.filter((r) => r.kind !== 'okizeme').length > 1;

  for (const r of routes) {
    const isOki = r.kind === 'okizeme';
    const variant: FlowGroup['variant'] = isOki
      ? 'okizeme'
      : multiCont
        ? 'branch'
        : 'primary';
    const firstEdge: FlowEdge['variant'] = isOki ? 'okizeme' : multiCont ? 'branch' : 'flow';
    const { lastId } = emitRouteSteps(ctx, r.id, variant, sourceNodeId, firstEdge);

    const out = outcomeNode(nextId(ctx, 'o'), getSituation(r.to));
    ctx.nodes.push(out);
    ctx.edges.push({ id: nextId(ctx, 'e'), from: lastId, to: out.id, variant: 'flow' });

    const nextDepth = depth + (isOki ? 1 : 0);
    const hasNext =
      outgoingRoutes(r.to).filter((x) => EXPANDABLE_KINDS.has(x.kind)).length > 0;

    if (path.has(r.to)) {
      out.loop = true;
    } else if (hasNext && ctx.seen.has(r.to)) {
      out.repeat = true;
    } else if (hasNext && nextDepth >= maxDepth) {
      out.more = true;
    } else if (hasNext) {
      ctx.seen.add(r.to);
      expand(ctx, r.to, out.id, nextDepth, maxDepth, new Set(path).add(r.to));
    }
  }
}

/**
 * コンボを ComfyUI 風のフローグラフに変換する。
 *  - 主経路は step ノードを実線で連結
 *  - 経路途中の分岐（別の締めなど）は実線ブランチ
 *  - 締めのダウンから置き攻けを破線で扇状展開
 */
export function buildComboFlow(comboOrSlug: Combo | string): FlowGraph {
  const combo = typeof comboOrSlug === 'string' ? getCombo(comboOrSlug) : comboOrSlug;
  const ctx: BuildCtx = { nodes: [], groups: [], edges: [], uid: 0, seen: new Set() };
  const chain = combo.routeChain.map(getRoute);

  const startSit = getSituation(combo.startFrom);
  const startId = nextId(ctx, 'start');
  ctx.nodes.push({
    ...outcomeNode(startId, startSit),
    type: 'start',
  });

  let prevLast: string | null = startId;
  let prevEdge: FlowEdge['variant'] = 'flow';
  const visitedSituations = new Set<string>([combo.startFrom]);

  chain.forEach((r, ri) => {
    const { lastId } = emitRouteSteps(ctx, r.id, 'primary', prevLast, prevEdge);

    // 経路途中／末尾の分岐（別の締め・別ルート）
    if (ri >= 1) {
      const alts = outgoingRoutes(r.from).filter(
        (a) => a.id !== r.id && a.kind !== 'okizeme',
      );
      for (const alt of alts) {
        const { lastId: altLast } = emitRouteSteps(ctx, alt.id, 'branch', prevLast, 'branch');
        const altTarget = getSituation(alt.to);
        const altOut = nextId(ctx, 'o');
        ctx.nodes.push(outcomeNode(altOut, altTarget));
        ctx.edges.push({ id: nextId(ctx, 'e'), from: altLast, to: altOut, variant: 'flow' });
      }
    }

    visitedSituations.add(r.to);
    prevLast = lastId;
    prevEdge = 'flow';
  });

  // 締めダウン → 置き攻け（破線・扇状）
  const endSit = getSituation(combo.endAt);
  const endOut = nextId(ctx, 'o');
  ctx.nodes.push(outcomeNode(endOut, endSit));
  if (prevLast) {
    ctx.edges.push({ id: nextId(ctx, 'e'), from: prevLast, to: endOut, variant: 'flow' });
  }
  visitedSituations.forEach((id) => ctx.seen.add(id));
  ctx.seen.add(combo.endAt);
  expand(ctx, combo.endAt, endOut, 0, OKI_MAX_DEPTH_COMBO, new Set(visitedSituations).add(combo.endAt));

  return { nodes: ctx.nodes, groups: ctx.groups, edges: ctx.edges };
}

/** 状況ノードを起点にした置き攻けのフローグラフ */
export function buildSituationFlow(situationId: string): FlowGraph {
  const ctx: BuildCtx = { nodes: [], groups: [], edges: [], uid: 0, seen: new Set([situationId]) };
  const s = getSituation(situationId);
  const startId = nextId(ctx, 'start');
  ctx.nodes.push({ ...outcomeNode(startId, s), type: 'start' });
  expand(ctx, situationId, startId, 0, OKI_MAX_DEPTH_SITUATION, new Set([situationId]));
  return { nodes: ctx.nodes, groups: ctx.groups, edges: ctx.edges };
}
