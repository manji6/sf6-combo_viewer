/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import * as dagreNS from '@dagrejs/dagre';
import type { FlowEdge, FlowGraph, FlowGroup, FlowNode } from '../../lib/graph/flow';
import Notation from './Notation';

// @dagrejs/dagre は環境によって default / 名前空間のどちらでも来る
const dagre: typeof import('@dagrejs/dagre') =
  (dagreNS as any).default ?? (dagreNS as any);

interface Props {
  graph: FlowGraph;
  height?: number;
}

interface Placed {
  node: FlowNode;
  x: number; // 左上
  y: number;
  w: number;
  h: number;
}

interface GroupBox {
  group: FlowGroup;
  x: number;
  y: number;
  w: number;
  h: number;
}

const GROUP_PAD = 16;
const GROUP_HEADER = 20;

const ROUTE_KIND_LABEL: Record<string, string> = {
  starter: '始動',
  combo_route: '中継',
  okizeme: '置き攻け',
  ender: '締め',
  conversion: '変換',
};

const SIT_KIND_COLOR: Record<string, string> = {
  neutral: '#8a8f98',
  hit: '#4aa3ff',
  juggle: '#b07cff',
  knockdown: '#ff7a59',
  blockstring: '#5bd1c9',
  okiStart: '#ff5a5a',
};

const OFFSET = 44; // すべてを右下にずらしてグループ枠が負座標に出ないように

function layout(graph: FlowGraph) {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 70, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of graph.nodes) g.setNode(n.id, { width: n.w, height: n.h });
  for (const e of graph.edges) g.setEdge(e.from, e.to, {}, e.id);

  dagre.layout(g);

  const placed: Placed[] = graph.nodes.map((node) => {
    const p = g.node(node.id);
    return {
      node,
      x: p.x - node.w / 2 + OFFSET,
      y: p.y - node.h / 2 + OFFSET,
      w: node.w,
      h: node.h,
    };
  });
  const byId = new Map(placed.map((p) => [p.node.id, p]));

  const groupBoxes: GroupBox[] = graph.groups
    .map((group) => {
      const members = group.nodeIds.map((id) => byId.get(id)).filter(Boolean) as Placed[];
      if (members.length === 0) return null;
      const minX = Math.min(...members.map((m) => m.x));
      const minY = Math.min(...members.map((m) => m.y));
      const maxX = Math.max(...members.map((m) => m.x + m.w));
      const maxY = Math.max(...members.map((m) => m.y + m.h));
      return {
        group,
        x: minX - GROUP_PAD,
        y: minY - GROUP_PAD - GROUP_HEADER,
        w: maxX - minX + GROUP_PAD * 2,
        h: maxY - minY + GROUP_PAD * 2 + GROUP_HEADER,
      };
    })
    .filter(Boolean) as GroupBox[];

  const gg = g.graph();
  return {
    placed,
    byId,
    groupBoxes,
    width: (gg.width ?? 400) + OFFSET * 2,
    height: (gg.height ?? 300) + OFFSET * 2,
  };
}

function edgePath(a: Placed, b: Placed): string {
  const sx = a.x + a.w;
  const sy = a.y + a.h / 2;
  const tx = b.x;
  const ty = b.y + b.h / 2;
  const dx = Math.max(40, (tx - sx) * 0.5);
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

export default function FlowCanvas({ graph, height = 520 }: Props) {
  const { placed, byId, groupBoxes, width, height: worldH } = useMemo(() => layout(graph), [graph]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const fitted = useRef(false);

  function fit() {
    const vp = viewportRef.current;
    if (!vp) return;
    const k = Math.min(1, Math.min(vp.clientWidth / width, vp.clientHeight / worldH)) || 1;
    setView({
      x: (vp.clientWidth - width * k) / 2,
      y: (vp.clientHeight - worldH * k) / 2,
      k,
    });
  }

  useLayoutEffect(() => {
    if (!fitted.current) {
      fit();
      fitted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, worldH]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(ev: WheelEvent) {
      ev.preventDefault();
      setView((v) => {
        const rect = vp!.getBoundingClientRect();
        const px = ev.clientX - rect.left;
        const py = ev.clientY - rect.top;
        const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
        const k = Math.max(0.2, Math.min(2.4, v.k * factor));
        const ratio = k / v.k;
        return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
      });
    }
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, []);

  function onPointerDown(ev: PointerEvent) {
    if ((ev.target as HTMLElement).closest('a')) return;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    drag.current = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
  }
  function onPointerMove(ev: PointerEvent) {
    if (!drag.current) return;
    setView((v) => ({
      ...v,
      x: drag.current!.vx + (ev.clientX - drag.current!.x),
      y: drag.current!.vy + (ev.clientY - drag.current!.y),
    }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div class="fc" style={{ height: `${height}px` }}>
      <div class="fc-toolbar">
        <button type="button" onClick={fit}>
          全体表示
        </button>
        <button type="button" onClick={() => setView((v) => ({ ...v, k: Math.min(2.4, v.k * 1.15) }))}>
          ＋
        </button>
        <button type="button" onClick={() => setView((v) => ({ ...v, k: Math.max(0.2, v.k / 1.15) }))}>
          －
        </button>
        <span class="fc-legend">
          <i class="l-flow" />実線=コンボ <i class="l-branch" />分岐 <i class="l-oki" />破線=置き攻け
        </span>
      </div>

      <div
        class="fc-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          class="fc-world"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          }}
        >
          <svg class="fc-edges" width={width} height={worldH} aria-hidden="true">
            <defs>
              {[
                ['flow', '#9aa0ab'],
                ['branch', '#88bbdd'],
                ['okizeme', '#d9a441'],
              ].map(([v, color]) => (
                <marker
                  key={v}
                  id={`fc-arrow-${v}`}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0 0 L8 4 L0 8 z" fill={color} />
                </marker>
              ))}
            </defs>
            {graph.edges.map((e: FlowEdge) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              return (
                <path
                  key={e.id}
                  d={edgePath(a, b)}
                  class={`fc-edge v-${e.variant}`}
                  fill="none"
                  marker-end={`url(#fc-arrow-${e.variant})`}
                />
              );
            })}
          </svg>

          {groupBoxes.map((gb) => (
            <div
              key={gb.group.id}
              class={`fc-group g-${gb.group.variant}`}
              style={{ left: `${gb.x}px`, top: `${gb.y}px`, width: `${gb.w}px`, height: `${gb.h}px` }}
            >
              <span class="fc-group-label">
                <b>{ROUTE_KIND_LABEL[gb.group.routeKind] ?? gb.group.routeKind}</b>
                {gb.group.label}
              </span>
            </div>
          ))}

          {placed.map((p) => (
            <NodeBox key={p.node.id} p={p} />
          ))}
        </div>
      </div>
      <p class="fc-hint">ドラッグで移動・ホイールで拡大縮小。「置き攻け」ノードをクリックすると詳細へ。</p>

      <style>{`
        .fc { border:2px solid var(--border-strong); background:var(--bg-sunken); display:flex; flex-direction:column; }
        .fc-toolbar { display:flex; gap:.4rem; align-items:center; padding:.5rem .7rem; border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .fc-toolbar button { font-family:var(--font-pixel); font-size:.75rem; padding:.2em .6em; border:1px solid var(--border-strong); background:var(--bg-raised); color:var(--text); cursor:pointer; }
        .fc-legend { font-size:.72rem; color:var(--text-faint); display:inline-flex; align-items:center; gap:.35em; margin-left:auto; flex-wrap:wrap; }
        .fc-legend i { width:16px; height:0; display:inline-block; border-top:2px solid var(--text-faint); }
        .fc-legend i.l-flow { border-top-color: var(--text-dim); }
        .fc-legend i.l-branch { border-top-color: #8bd; }
        .fc-legend i.l-oki { border-top-style:dashed; border-top-color: var(--accent); }
        .fc-viewport { position:relative; flex:1; overflow:hidden; cursor:grab; touch-action:none; }
        .fc-viewport:active { cursor:grabbing; }
        .fc-world { position:absolute; top:0; left:0; transform-origin:0 0; }
        .fc-edges { position:absolute; top:0; left:0; overflow:visible; }
        .fc-edge { stroke-width:2; }
        .fc-edge.v-flow { stroke: var(--text-dim); }
        .fc-edge.v-branch { stroke:#8bd; stroke-dasharray:1 0; }
        .fc-edge.v-okizeme { stroke: var(--accent); stroke-dasharray:6 5; }
        .fc-group { position:absolute; border:1px solid var(--border-strong); border-radius:2px; background:color-mix(in srgb, var(--panel) 40%, transparent); }
        .fc-group.g-branch { border-color:#5a7a99; }
        .fc-group.g-okizeme { border-style:dashed; border-color:var(--accent); }
        .fc-group-label { position:absolute; top:2px; left:4px; font-size:.68rem; color:var(--text-dim); background:var(--bg-sunken); border:1px solid var(--border-strong); padding:.05em .4em; white-space:nowrap; display:flex; gap:.4em; max-width:calc(100% - 8px); overflow:hidden; text-overflow:ellipsis; }
        .fc-group-label b { color:var(--accent); font-weight:400; }
        .fc-node { position:absolute; background:var(--panel); border:2px solid var(--border-strong); box-shadow:3px 3px 0 rgba(0,0,0,.3); display:flex; flex-direction:column; overflow:hidden; }
        .fc-node .fc-node-cmd { padding:.3rem .5rem; font-size:1rem; display:flex; align-items:center; justify-content:center; flex:1; }
        .fc-node .fc-node-move { font-size:.68rem; color:var(--text-dim); background:var(--bg-sunken); padding:.1rem .4rem; border-top:1px solid var(--border); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .fc-node .fc-node-note { font-size:.64rem; color:var(--accent); background:var(--bg-sunken); padding:0 .4rem .15rem; text-align:center; }
        .fc-node.n-cancel { border-left-width:5px; border-left-color:var(--accent); }
        .fc-node.n-outcome, .fc-node.n-start { border-color:var(--sitc, var(--accent)); background:var(--bg-raised); align-items:center; justify-content:center; }
        .fc-node.n-outcome a, .fc-node.n-start a { font-family:var(--font-pixel); font-size:.8rem; color:var(--text); text-align:center; padding:.3rem .4rem; display:block; }
        .fc-node.n-start { border-style:double; border-width:4px; }
        .fc-node .fc-badge { position:absolute; top:2px; right:2px; font-size:.6rem; background:var(--accent); color:var(--accent-ink); padding:0 .3em; }
        .fc-node .fc-badge.b-dim { background:var(--border-strong); color:var(--text); }
        .fc-hint { margin:0; padding:.45rem .7rem; font-size:.7rem; color:var(--text-faint); border-top:1px solid var(--border); }
      `}</style>
    </div>
  );
}

function NodeBox({ p }: { p: Placed }) {
  const n = p.node;
  const base: Record<string, string> = {
    left: `${p.x}px`,
    top: `${p.y}px`,
    width: `${p.w}px`,
    height: `${p.h}px`,
  };

  if (n.type === 'step') {
    return (
      <div class={`fc-node n-step ${n.cancel ? 'n-cancel' : ''}`} style={base}>
        <div class="fc-node-cmd">
          <Notation command={n.command!} />
        </div>
        {n.move && <div class="fc-node-move">{n.move}</div>}
        {n.note && <div class="fc-node-note">{n.note}</div>}
      </div>
    );
  }

  const color = n.sitKind ? SIT_KIND_COLOR[n.sitKind] : undefined;
  return (
    <div
      class={`fc-node ${n.type === 'start' ? 'n-start' : 'n-outcome'}`}
      style={{ ...base, ...(color ? { ['--sitc' as any]: color } : {}) }}
    >
      {n.loop && <span class="fc-badge">ループ</span>}
      {n.repeat && <span class="fc-badge b-dim">既出</span>}
      {n.more && <span class="fc-badge">続き →</span>}
      <a href={`/manon/situations/${n.situationId}/`}>{n.label}</a>
    </div>
  );
}
