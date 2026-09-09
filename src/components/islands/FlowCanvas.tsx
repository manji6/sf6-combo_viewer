/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import * as dagreNS from '@dagrejs/dagre';
import type { FlowEdge, FlowGraph, FlowGroup, FlowNode } from '../../lib/graph/flow';
import Notation from './Notation';

const dagre: typeof import('@dagrejs/dagre') =
  (dagreNS as any).default ?? (dagreNS as any);

interface Props {
  graph: FlowGraph;
  height?: number;
}

interface Placed {
  node: FlowNode;
  x: number;
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
  headerH: number;
}

const GROUP_PAD = 13;
const OFFSET = 52;

const ROUTE_KIND_LABEL: Record<string, string> = {
  starter: '始動',
  combo_route: '中継',
  okizeme: '起き攻め',
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

/** 起き攻けの枠に出す特徴テキストの行数から高さを見積もる */
function wrapLines(text: string | undefined, perLine = 30): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / perLine));
}
function okizemeHeaderHeight(g: FlowGroup): number {
  let lines = 1; // ヘッダ（種別＋リスク＋詳細）
  lines += wrapLines(g.strongVs?.join('・'));
  lines += wrapLines(g.weakVs?.join('・'));
  lines += wrapLines(g.caution);
  return 14 + lines * 13.5;
}

function layout(graph: FlowGraph, sizes: Map<string, { w: number; h: number }>) {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 78, marginx: 18, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  // 各ノードが属するグループと、先頭ノードかどうか
  const firstOfGroup = new Map<string, FlowGroup>();
  for (const grp of graph.groups) {
    if (grp.nodeIds[0]) firstOfGroup.set(grp.nodeIds[0], grp);
  }
  const headerHOf = new Map<string, number>();
  for (const grp of graph.groups) {
    headerHOf.set(grp.id, grp.variant === 'okizeme' ? okizemeHeaderHeight(grp) : 14);
  }

  for (const n of graph.nodes) {
    const s = sizes.get(n.id) ?? { w: 150, h: 64 };
    const grp = firstOfGroup.get(n.id);
    // 先頭ノードは上にヘッダ分の余白を確保させる（dagre 用に高さを水増し）
    const extra = grp ? headerHOf.get(grp.id)! + GROUP_PAD : 0;
    g.setNode(n.id, { width: s.w, height: s.h + extra });
  }
  for (const e of graph.edges) g.setEdge(e.from, e.to, {}, e.id);

  dagre.layout(g);

  const placed: Placed[] = graph.nodes.map((node) => {
    const p = g.node(node.id);
    const s = sizes.get(node.id) ?? { w: 150, h: 64 };
    const grp = firstOfGroup.get(node.id);
    const extra = grp ? headerHOf.get(grp.id)! + GROUP_PAD : 0;
    // dagre 中心から、水増し分を除いた実ノードの左上（先頭ノードは下寄せ）
    return {
      node,
      x: p.x - s.w / 2 + OFFSET,
      y: p.y - (s.h + extra) / 2 + extra + OFFSET,
      w: s.w,
      h: s.h,
    };
  });
  const byId = new Map(placed.map((p) => [p.node.id, p]));

  const groupBoxes: GroupBox[] = graph.groups
    .map((group) => {
      const members = group.nodeIds.map((id) => byId.get(id)).filter(Boolean) as Placed[];
      if (!members.length) return null;
      const minX = Math.min(...members.map((m) => m.x));
      const minY = Math.min(...members.map((m) => m.y));
      const maxX = Math.max(...members.map((m) => m.x + m.w));
      const maxY = Math.max(...members.map((m) => m.y + m.h));
      const headerH = headerHOf.get(group.id)!;
      return {
        group,
        x: minX - GROUP_PAD,
        y: minY - GROUP_PAD - headerH,
        w: maxX - minX + GROUP_PAD * 2,
        h: maxY - minY + GROUP_PAD * 2 + headerH,
        headerH,
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
  const dx = Math.max(36, Math.abs(tx - sx) * 0.5);
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

type LayoutState = ReturnType<typeof layout> | null;

export default function FlowCanvas({ graph, height = 520 }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [lay, setLay] = useState<LayoutState>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [full, setFull] = useState(false);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  function fitTo(width: number, worldH: number, mode: 'fit' | 'start' = 'start') {
    const vp = viewportRef.current;
    if (!vp) return;
    if (mode === 'fit') {
      const k = Math.min(1, vp.clientWidth / width, vp.clientHeight / worldH) || 1;
      setView({
        x: (vp.clientWidth - width * k) / 2,
        y: Math.max(8, (vp.clientHeight - worldH * k) / 2),
        k,
      });
      return;
    }
    const k = Math.max(0.5, Math.min(1, (vp.clientHeight - 16) / worldH)) || 1;
    setView({ x: 12, y: Math.max(8, (vp.clientHeight - worldH * k) / 2), k });
  }

  function remeasure() {
    const root = measureRef.current;
    if (!root) return;
    const sizes = new Map<string, { w: number; h: number }>();
    root.querySelectorAll<HTMLElement>('[data-mid]').forEach((el) => {
      const inner = (el.firstElementChild as HTMLElement) ?? el;
      const r = inner.getBoundingClientRect();
      sizes.set(el.dataset.mid!, {
        w: Math.max(110, Math.min(360, Math.ceil(r.width) + 2)),
        h: Math.max(48, Math.ceil(r.height) + 2),
      });
    });
    const result = layout(graph, sizes);
    setLay(result);
    fitTo(result.width, result.height);
  }

  useLayoutEffect(() => {
    remeasure();
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => remeasure());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // 全画面切り替え時に再フィット
  useLayoutEffect(() => {
    if (lay) requestAnimationFrame(() => fitTo(lay.width, lay.height, full ? 'fit' : 'start'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setFull(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        const k = Math.max(0.15, Math.min(2.6, v.k * factor));
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
    <div class={`fc ${full ? 'fc-full' : ''}`} style={full ? undefined : { height: `${height}px` }}>
      <div class="fc-toolbar">
        <button type="button" onClick={() => lay && fitTo(lay.width, lay.height, 'fit')}>
          全体表示
        </button>
        <button type="button" onClick={() => lay && fitTo(lay.width, lay.height, 'start')}>
          先頭へ
        </button>
        <button type="button" onClick={() => setView((v) => ({ ...v, k: Math.min(2.6, v.k * 1.15) }))}>
          ＋
        </button>
        <button type="button" onClick={() => setView((v) => ({ ...v, k: Math.max(0.15, v.k / 1.15) }))}>
          －
        </button>
        <button type="button" class="fc-full-btn" onClick={() => setFull((f) => !f)}>
          {full ? '✕ 閉じる' : '⛶ 全画面'}
        </button>
        <span class="fc-legend">
          <i class="l-flow" />実線=コンボ <i class="l-branch" />分岐 <i class="l-oki" />破線=起き攻め
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
        <div class="fc-measure" ref={measureRef} aria-hidden="true">
          {graph.nodes.map((n) => (
            <div class="fc-mnode" data-mid={n.id} key={n.id}>
              <NodeInner node={n} />
            </div>
          ))}
        </div>

        {lay && (
          <div
            class="fc-world"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
          >
            <svg class="fc-edges" width={lay.width} height={lay.height} aria-hidden="true">
              <defs>
                {[
                  ['flow', '#9aa0ab'],
                  ['branch', '#88bbdd'],
                  ['okizeme', '#d9a441'],
                ].map(([v, color]) => (
                  <marker
                    key={v}
                    id={`fc-a-${v}`}
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
                const a = lay.byId.get(e.from);
                const b = lay.byId.get(e.to);
                if (!a || !b) return null;
                return (
                  <path
                    key={e.id}
                    d={edgePath(a, b)}
                    class={`fc-edge v-${e.variant}`}
                    fill="none"
                    marker-end={`url(#fc-a-${e.variant})`}
                  />
                );
              })}
            </svg>

            {lay.groupBoxes.map((gb) => (
              <div
                key={gb.group.id}
                class={`fc-group g-${gb.group.variant}`}
                style={{
                  left: `${gb.x}px`,
                  top: `${gb.y}px`,
                  width: `${gb.w}px`,
                  height: `${gb.h}px`,
                }}
              >
                {gb.group.variant === 'okizeme' ? (
                  <div class="fc-group-info" style={{ height: `${gb.headerH}px` }}>
                    <div class="gi-head">
                      <span class="gi-kind">起き攻め</span>
                      {gb.group.risk && (
                        <span class={`gi-risk r-${gb.group.risk}`}>リスク{gb.group.risk}</span>
                      )}
                      <a class="gi-link" href={`/manon/routes/${gb.group.routeId}/`}>
                        詳細
                      </a>
                    </div>
                    {gb.group.strongVs?.length ? (
                      <div class="gi-line gi-good">◯ {gb.group.strongVs.join('・')}</div>
                    ) : null}
                    {gb.group.weakVs?.length ? (
                      <div class="gi-line gi-bad">× {gb.group.weakVs.join('・')}</div>
                    ) : null}
                    {gb.group.caution ? (
                      <div class="gi-line gi-warn">⚠ {gb.group.caution}</div>
                    ) : null}
                  </div>
                ) : (
                  <span class="fc-group-label">
                    <b>{ROUTE_KIND_LABEL[gb.group.routeKind] ?? gb.group.routeKind}</b>
                    {gb.group.label}
                  </span>
                )}
              </div>
            ))}

            {lay.placed.map((p) => (
              <div
                key={p.node.id}
                class="fc-pnode"
                style={{ left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${p.h}px` }}
              >
                <NodeInner node={p.node} />
              </div>
            ))}
          </div>
        )}
      </div>
      <p class="fc-hint">
        ドラッグで移動・ホイールで拡大縮小。起き攻けの枠にその択の特徴を表示。ノードのクリックで詳細へ。
      </p>

      <style>{`
        .fc { border:2px solid var(--border-strong); background:var(--bg-sunken); display:flex; flex-direction:column; }
        .fc-full { position:fixed; inset:0; z-index:9999; height:100dvh !important; border:0; }
        .fc-toolbar { display:flex; gap:.4rem; align-items:center; padding:.5rem .7rem; border-bottom:1px solid var(--border); flex-wrap:wrap; background:var(--bg-raised); }
        .fc-toolbar button { font-family:var(--font-pixel); font-size:.75rem; padding:.2em .6em; border:1px solid var(--border-strong); background:var(--bg-raised); color:var(--text); cursor:pointer; }
        .fc-toolbar button:hover { background:var(--panel); }
        .fc-full-btn { color:var(--accent) !important; border-color:var(--accent) !important; }
        .fc-legend { font-size:.72rem; color:var(--text-faint); display:inline-flex; align-items:center; gap:.35em; margin-left:auto; flex-wrap:wrap; }
        .fc-legend i { width:16px; height:0; display:inline-block; border-top:2px solid var(--text-faint); }
        .fc-legend i.l-flow { border-top-color:#9aa0ab; }
        .fc-legend i.l-branch { border-top-color:#88bbdd; }
        .fc-legend i.l-oki { border-top-style:dashed; border-top-color:var(--accent); }
        .fc-viewport { position:relative; flex:1; overflow:hidden; cursor:grab; touch-action:none; background:var(--bg-sunken); }
        .fc-viewport:active { cursor:grabbing; }
        .fc-measure { position:absolute; visibility:hidden; pointer-events:none; left:-99999px; top:0; width:400px; }
        .fc-mnode { display:inline-block; margin:4px; vertical-align:top; }
        .fc-world { position:absolute; top:0; left:0; transform-origin:0 0; }
        .fc-edges { position:absolute; top:0; left:0; overflow:visible; }
        .fc-edge { stroke-width:2; }
        .fc-edge.v-flow { stroke:#9aa0ab; }
        .fc-edge.v-branch { stroke:#88bbdd; }
        .fc-edge.v-okizeme { stroke:var(--accent); stroke-dasharray:6 5; }
        .fc-group { position:absolute; border:1px solid var(--border-strong); border-radius:2px; background:color-mix(in srgb, var(--panel) 35%, transparent); }
        .fc-group.g-branch { border-color:#5a7a99; }
        .fc-group.g-okizeme { border-style:dashed; border-color:var(--accent); background:color-mix(in srgb, var(--accent) 6%, var(--bg-sunken)); }
        .fc-group-label { position:absolute; top:-11px; left:6px; z-index:3; font-size:.66rem; color:var(--text-dim); background:var(--bg-raised); border:1px solid var(--border-strong); padding:.05em .45em; white-space:nowrap; display:flex; gap:.4em; max-width:280px; overflow:hidden; text-overflow:ellipsis; }
        .fc-group-label b { color:var(--accent); font-weight:400; }
        .fc-group-info { position:absolute; top:0; left:0; right:0; padding:4px 8px; overflow:hidden; display:flex; flex-direction:column; gap:1px; }
        .gi-head { display:flex; align-items:center; gap:.35em; font-size:.62rem; }
        .gi-kind { font-family:var(--font-pixel); background:var(--accent); color:var(--accent-ink); padding:0 .35em; }
        .gi-risk { border:1px solid currentColor; padding:0 .3em; }
        .gi-risk.r-低 { color:var(--risk-low); }
        .gi-risk.r-中 { color:var(--risk-mid); }
        .gi-risk.r-高 { color:var(--risk-high); }
        .gi-link { margin-left:auto; font-size:.62rem; color:var(--link); }
        .gi-line { font-size:.63rem; line-height:1.25; color:var(--text-dim); white-space:normal; overflow:hidden; }
        .gi-good { color:var(--risk-low); }
        .gi-bad { color:var(--risk-high); }
        .gi-warn { color:var(--risk-mid); }

        .fc-pnode { position:absolute; }
        .fc-pnode > .fc-node { width:100%; height:100%; }
        .fc-mnode > .fc-node { width:max-content; max-width:360px; }

        .fc-node { background:var(--panel); border:2px solid var(--border-strong); box-shadow:3px 3px 0 rgba(0,0,0,.3); display:flex; flex-direction:column; overflow:hidden; }
        .fc-node-cmd { padding:.35rem .6rem; font-size:1.02rem; white-space:nowrap; display:flex; align-items:center; justify-content:center; flex:1; }
        .fc-node-move { font-size:.66rem; color:var(--text-dim); background:var(--bg-sunken); padding:.12rem .45rem; border-top:1px solid var(--border); text-align:center; white-space:nowrap; }
        .fc-node-note { font-size:.62rem; color:var(--accent); background:var(--bg-sunken); padding:0 .45rem .16rem; text-align:center; white-space:nowrap; }
        .fc-node.n-cancel { border-left-width:5px; border-left-color:var(--accent); }
        .fc-node.n-outcome, .fc-node.n-start { border-color:var(--sitc, var(--accent)); background:var(--bg-raised); align-items:stretch; }
        .fc-node.n-outcome a, .fc-node.n-start a { font-family:var(--font-pixel); font-size:.78rem; color:var(--text); text-align:center; padding:.4rem .5rem; display:flex; align-items:center; justify-content:center; flex:1; white-space:nowrap; }
        .fc-node.n-start { border-style:double; border-width:4px; }
        .fc-node.n-outcome { position:relative; }
        .fc-badge { position:absolute; top:-9px; right:-6px; font-size:.58rem; background:var(--accent); color:var(--accent-ink); padding:0 .35em; border:1px solid var(--accent-ink); }
        .fc-badge.b-dim { background:var(--border-strong); color:var(--text); border-color:var(--bg); }
        .fc-hint { margin:0; padding:.45rem .7rem; font-size:.7rem; color:var(--text-faint); border-top:1px solid var(--border); background:var(--bg-raised); }
      `}</style>
    </div>
  );
}

function NodeInner({ node: n }: { node: FlowNode }) {
  if (n.type === 'step') {
    return (
      <div class={`fc-node n-step ${n.cancel ? 'n-cancel' : ''}`}>
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
      style={color ? { ['--sitc' as any]: color } : undefined}
    >
      {n.loop && <span class="fc-badge">ループ</span>}
      {n.repeat && <span class="fc-badge b-dim">既出</span>}
      {n.more && <span class="fc-badge">続き →</span>}
      <a href={`/manon/situations/${n.situationId}/`}>{n.label}</a>
    </div>
  );
}
