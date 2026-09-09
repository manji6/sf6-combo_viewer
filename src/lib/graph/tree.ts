import type { Route, Situation } from '../../data/types';
import { getSituation } from '../../data';
import { outgoingRoutes } from './derive';

export interface TreeNode {
  situation: Situation;
  /** ルートからの深さ（0 = 起点） */
  depth: number;
  /** このノードへ到達したパーツ（起点は null） */
  viaRoute: Route | null;
  children: TreeNode[];
  /** 経路上で同じノードに戻った（ループ）。展開しない */
  cycle: boolean;
  /** 別の枝で既に展開済みのノード。重複を避けて展開しない */
  repeated: boolean;
  /** maxDepth 到達で打ち切った（さらに先がある） */
  truncated: boolean;
}

export interface TreeOptions {
  /** 起点からの最大深さ。既定 3 */
  maxDepth?: number;
}

/**
 * 置き攻けの樹形図を組み立てる。完全再帰だが、有限に描画するため
 *  - 経路上で同じノードに戻ったら cycle（ループ）で打ち切り
 *  - 別の枝で既に展開したノードは repeated で打ち切り（同じ展開の繰り返しを防ぐ）
 *  - maxDepth を超えたら truncated で打ち切り（「この先を見る」リンク）
 */
export function buildSetplayTree(rootSituationId: string, opts: TreeOptions = {}): TreeNode {
  const maxDepth = opts.maxDepth ?? 3;
  const expanded = new Set<string>();

  function walk(situationId: string, depth: number, path: string[], viaRoute: Route | null): TreeNode {
    const situation = getSituation(situationId);
    const node: TreeNode = {
      situation,
      depth,
      viaRoute,
      children: [],
      cycle: path.includes(situationId) && depth > 0,
      repeated: false,
      truncated: false,
    };
    if (node.cycle) return node;

    const outs = outgoingRoutes(situationId);
    if (outs.length === 0) return node;

    if (depth > 0 && expanded.has(situationId)) {
      node.repeated = true;
      return node;
    }
    expanded.add(situationId);

    if (depth >= maxDepth) {
      node.truncated = true;
      return node;
    }

    const nextPath = [...path, situationId];
    node.children = outs.map((r) => walk(r.to, depth + 1, nextPath, r));
    return node;
  }

  return walk(rootSituationId, 0, [], null);
}
