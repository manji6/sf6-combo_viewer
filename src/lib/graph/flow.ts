import type {
  Combo,
  Risk,
  RouteKind,
  Situation,
  SituationKind,
  Step,
} from '../../data/types';
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
  /** okizeme の枠に表示する「この択の特徴」。パーツページへのリンクにも使う */
  routeId: string;
  strongVs?: string[];
  weakVs?: string[];
  caution?: string;
  useWhen?: string;
  onBlock?: string;
  risk?: Risk;
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
  const p = route.properties;
  const group: FlowGroup = {
    id: groupId,
    label: route.label,
    routeKind: route.kind,
    variant,
    nodeIds: [],
    routeId: route.id,
    strongVs: p?.strongVs,
    weakVs: p?.weakVs,
    caution: p?.caution,
    useWhen: p?.useWhen,
    onBlock: p?.onBlock,
    risk: p?.risk,
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
 * `sourceNode`（＝ある状況を表す outcome ノード）から先を再帰的に展開する。
 *  - okizeme パーツは破線で分岐（＝起き攻めの択）
 *  - ヒット後の拾い（ender / combo_route）は実線でたどり、次のダウンでまた okizeme を扇状展開
 *  - depth は「起き攻めの段数」。ヒット後の拾いは段を増やさない
 *  - ループは loop、別の枝で展開済みなら repeat、深さ上限は more を sourceNode に立てて打ち切る
 */
function expandFrom(
  ctx: BuildCtx,
  situationId: string,
  sourceNode: FlowNode,
  depth: number,
  maxDepth: number,
  path: Set<string>,
) {
  const routes = outgoingRoutes(situationId).filter((r) => EXPANDABLE_KINDS.has(r.kind));
  if (routes.length === 0) return;

  if (path.has(situationId)) {
    sourceNode.loop = true;
    return;
  }
  if (ctx.seen.has(situationId)) {
    sourceNode.repeat = true;
    return;
  }

  const oks = routes.filter((r) => r.kind === 'okizeme');
  const conts = routes.filter((r) => r.kind !== 'okizeme');
  const canOki = depth < maxDepth;

  if (oks.length > 0 && !canOki && conts.length === 0) {
    sourceNode.more = true;
    return;
  }

  ctx.seen.add(situationId);
  const nextPath = new Set(path).add(situationId);

  const multiCont = conts.length > 1;
  for (const c of conts) {
    const { lastId } = emitRouteSteps(
      ctx,
      c.id,
      multiCont ? 'branch' : 'primary',
      sourceNode.id,
      multiCont ? 'branch' : 'flow',
    );
    const child = outcomeNode(nextId(ctx, 'o'), getSituation(c.to));
    ctx.nodes.push(child);
    ctx.edges.push({ id: nextId(ctx, 'e'), from: lastId, to: child.id, variant: 'flow' });
    expandFrom(ctx, c.to, child, depth, maxDepth, nextPath);
  }

  if (oks.length > 0) {
    if (!canOki) {
      sourceNode.more = true;
    } else {
      for (const ok of oks) {
        const { lastId } = emitRouteSteps(ctx, ok.id, 'okizeme', sourceNode.id, 'okizeme');
        const child = outcomeNode(nextId(ctx, 'o'), getSituation(ok.to));
        ctx.nodes.push(child);
        ctx.edges.push({ id: nextId(ctx, 'e'), from: lastId, to: child.id, variant: 'flow' });
        expandFrom(ctx, ok.to, child, depth + 1, maxDepth, nextPath);
      }
    }
  }
}

/**
 * コンボを ComfyUI 風のフローグラフに変換する。
 *  - 主経路は step ノードを実線で連結
 *  - 経路途中の分岐（別の締めなど）は実線ブランチ
 *  - 締めのダウンから起き攻めを破線で扇状展開
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

  let prevLast = startId;
  const midSituations: string[] = [combo.startFrom];
  const branchTerminals: { node: FlowNode; situationId: string }[] = [];

  chain.forEach((r, ri) => {
    const { lastId } = emitRouteSteps(ctx, r.id, 'primary', prevLast, 'flow');

    // 経路途中／末尾の分岐（この地点から出る別の締め・別ルート）
    if (ri >= 1) {
      const alts = outgoingRoutes(r.from).filter((a) => a.id !== r.id && a.kind !== 'okizeme');
      for (const alt of alts) {
        const { lastId: altLast } = emitRouteSteps(ctx, alt.id, 'branch', prevLast, 'branch');
        const altOut = outcomeNode(nextId(ctx, 'o'), getSituation(alt.to));
        ctx.nodes.push(altOut);
        ctx.edges.push({ id: nextId(ctx, 'e'), from: altLast, to: altOut.id, variant: 'flow' });
        branchTerminals.push({ node: altOut, situationId: alt.to });
      }
    }

    if (ri < chain.length - 1) midSituations.push(r.to);
    prevLast = lastId;
  });

  // 締めのダウン
  const endOut = outcomeNode(nextId(ctx, 'o'), getSituation(combo.endAt));
  ctx.nodes.push(endOut);
  ctx.edges.push({ id: nextId(ctx, 'e'), from: prevLast, to: endOut.id, variant: 'flow' });

  // コンボ本線が通ったノードは「既出」扱いにして、扇状展開の重複を防ぐ
  midSituations.forEach((id) => ctx.seen.add(id));

  // 締め（と別の締め）から起き攻めを破線で扇状展開
  expandFrom(ctx, combo.endAt, endOut, 0, OKI_MAX_DEPTH_COMBO, new Set());
  for (const bt of branchTerminals) {
    expandFrom(ctx, bt.situationId, bt.node, 0, OKI_MAX_DEPTH_COMBO, new Set());
  }

  return { nodes: ctx.nodes, groups: ctx.groups, edges: ctx.edges };
}

/** 状況ノードを起点にした起き攻めのフローグラフ */
export function buildSituationFlow(situationId: string): FlowGraph {
  const ctx: BuildCtx = { nodes: [], groups: [], edges: [], uid: 0, seen: new Set() };
  const startNode: FlowNode = { ...outcomeNode(nextId(ctx, 'start'), getSituation(situationId)), type: 'start' };
  ctx.nodes.push(startNode);
  expandFrom(ctx, situationId, startNode, 0, OKI_MAX_DEPTH_SITUATION, new Set());
  return { nodes: ctx.nodes, groups: ctx.groups, edges: ctx.edges };
}
