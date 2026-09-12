import { routes, situations } from '../../data';
import type { CharacterId, Position, RouteKind, SituationKind } from '../../data/types';

export interface GraphNodeData {
  id: string;
  label: string;
  kind: SituationKind;
  position: Position;
  tags: string[];
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: RouteKind;
}

export interface GraphElements {
  nodes: { data: GraphNodeData }[];
  edges: { data: GraphEdgeData }[];
}

/** 指定キャラの全ノード・全辺（相関グラフ用） */
export function fullGraph(character: CharacterId): GraphElements {
  return {
    nodes: situations
      .filter((s) => s.character === character)
      .map((s) => ({
        data: { id: s.id, label: s.label, kind: s.kind, position: s.position, tags: s.tags },
      })),
    edges: routes
      .filter((r) => r.character === character)
      .map((r) => ({
        data: { id: r.id, source: r.from, target: r.to, label: r.label, kind: r.kind },
      })),
  };
}

/** 指定ノードの周辺サブグラフ（詳細ページのミニグラフ用） */
export function neighborhood(centerId: string, hops = 1): GraphElements & { center: string } {
  const nodeIds = new Set<string>([centerId]);
  let frontier = new Set<string>([centerId]);

  for (let h = 0; h < hops; h++) {
    const next = new Set<string>();
    for (const r of routes) {
      if (frontier.has(r.from) && !nodeIds.has(r.to)) next.add(r.to);
      if (frontier.has(r.to) && !nodeIds.has(r.from)) next.add(r.from);
    }
    next.forEach((id) => nodeIds.add(id));
    frontier = next;
  }

  const nodes = situations
    .filter((s) => nodeIds.has(s.id))
    .map((s) => ({
      data: { id: s.id, label: s.label, kind: s.kind, position: s.position, tags: s.tags },
    }));
  const edges = routes
    .filter((r) => nodeIds.has(r.from) && nodeIds.has(r.to))
    .map((r) => ({
      data: { id: r.id, source: r.from, target: r.to, label: r.label, kind: r.kind },
    }));

  return { nodes, edges, center: centerId };
}

export const KIND_COLOR: Record<SituationKind, string> = {
  neutral: '#8a8f98',
  hit: '#4aa3ff',
  juggle: '#b07cff',
  knockdown: '#ff7a59',
  blockstring: '#5bd1c9',
  okiStart: '#ff5a5a',
};

export const EDGE_KIND_COLOR: Record<RouteKind, string> = {
  starter: '#8a8f98',
  combo_route: '#4aa3ff',
  okizeme: '#ff7a59',
  ender: '#46d17a',
  conversion: '#b07cff',
};
