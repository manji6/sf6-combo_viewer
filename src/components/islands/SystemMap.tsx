/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import * as dagreNS from '@dagrejs/dagre';
import type { GraphElements } from '../../lib/graph/systemmap';

const dagre: typeof import('@dagrejs/dagre') = (dagreNS as any).default ?? (dagreNS as any);

const KIND_COLOR: Record<string, string> = {
  neutral: '#8a8f98',
  hit: '#4aa3ff',
  juggle: '#b07cff',
  knockdown: '#ff7a59',
  blockstring: '#5bd1c9',
  okiStart: '#ff5a5a',
};
const KIND_LABEL: Record<string, string> = {
  neutral: 'ニュートラル',
  hit: 'ヒット',
  juggle: '浮き',
  knockdown: 'ダウン',
  blockstring: 'ガード連携',
  okiStart: '起き攻め起点',
};
const EDGE_COLOR: Record<string, string> = {
  starter: '#8a8f98',
  combo_route: '#4aa3ff',
  okizeme: '#d9a441',
  ender: '#46d17a',
  conversion: '#b07cff',
};
const EDGE_LABEL: Record<string, string> = {
  starter: '始動',
  combo_route: '中継',
  okizeme: '起き攻め',
  ender: '締め',
  conversion: '変換',
};

interface Props {
  elements: GraphElements;
  center?: string;
  height?: number;
  /** ノードクリック時の遷移先に使うキャラ ID（例: 'manon'） */
  characterId: string;
}

interface PNode {
  id: string;
  label: string;
  lines: string[];
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 40;

/** ラベルを最大2行に折る（・→（ などの区切りを優先） */
function wrapLabel(s: string): string[] {
  if (s.length <= 13) return [s];
  const marks = ['・', ' → ', '→', '（', ' ', '後'];
  let best = -1;
  for (const m of marks) {
    const i = s.indexOf(m, 4);
    if (i > 3 && i < s.length - 2) {
      best = m === '後' ? i + 1 : i + (m === '（' ? 0 : m.length);
      break;
    }
  }
  if (best < 0) best = Math.ceil(s.length / 2);
  const a = s.slice(0, best).trim();
  const b = s.slice(best).trim();
  return [a.length > 18 ? a.slice(0, 17) + '…' : a, b.length > 18 ? b.slice(0, 17) + '…' : b];
}
function nodeSize(lines: string[]) {
  const w = Math.max(...lines.map((l) => l.length));
  return { w: Math.max(110, Math.min(240, 24 + w * 12)), h: lines.length > 1 ? 42 : 28 };
}

export default function SystemMap({ elements, center, height = 520, characterId }: Props) {
  const vpRef = useRef<HTMLDivElement>(null);
  const [uid] = useState(() => 'sm' + Math.random().toString(36).slice(2, 7));
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [hiddenKinds, setHiddenKinds] = useState<Set<string>>(new Set());
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const fitted = useRef(false);

  const layout = useMemo(() => {
    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({
      rankdir: 'LR',
      nodesep: 62,
      ranksep: 190,
      edgesep: 44,
      marginx: PAD,
      marginy: PAD,
      ranker: 'network-simplex',
    });
    g.setDefaultEdgeLabel(() => ({}));
    const meta = new Map<string, { lines: string[]; w: number; h: number }>();
    for (const n of elements.nodes) {
      const lines = wrapLabel(n.data.label);
      const { w, h } = nodeSize(lines);
      meta.set(n.data.id, { lines, w, h });
      g.setNode(n.data.id, { width: w, height: h });
    }
    for (const e of elements.edges) g.setEdge(e.data.source, e.data.target, {}, e.data.id);
    dagre.layout(g);

    const nodes: PNode[] = elements.nodes.map((n) => {
      const p = g.node(n.data.id);
      const m = meta.get(n.data.id)!;
      return {
        id: n.data.id,
        label: n.data.label,
        lines: m.lines,
        kind: n.data.kind,
        x: p.x - m.w / 2,
        y: p.y - m.h / 2,
        w: m.w,
        h: m.h,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));

    // dagre が計算したエッジの経路（平行エッジが分かれる・ノードを避ける）
    const edgePts = new Map<string, { x: number; y: number }[]>();
    for (const e of elements.edges) {
      const ed = g.edge(e.data.source, e.data.target, e.data.id);
      if (ed?.points?.length) edgePts.set(e.data.id, ed.points);
    }

    const gg = g.graph();
    return {
      nodes,
      byId,
      edgePts,
      width: (gg.width ?? 400) + PAD,
      height: (gg.height ?? 300) + PAD,
    };
  }, [elements]);

  const edgeKinds = useMemo(
    () => [...new Set(elements.edges.map((e) => e.data.kind))],
    [elements],
  );

  function fit() {
    const vp = vpRef.current;
    if (!vp) return;
    const k =
      Math.min(1, vp.clientWidth / layout.width, vp.clientHeight / layout.height) || 1;
    setView({
      x: (vp.clientWidth - layout.width * k) / 2,
      y: (vp.clientHeight - layout.height * k) / 2,
      k,
    });
  }

  useLayoutEffect(() => {
    if (!fitted.current) {
      fit();
      fitted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    function onWheel(ev: WheelEvent) {
      ev.preventDefault();
      setView((v) => {
        const r = vp!.getBoundingClientRect();
        const px = ev.clientX - r.left;
        const py = ev.clientY - r.top;
        const f = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
        const k = Math.max(0.2, Math.min(2.4, v.k * f));
        const ratio = k / v.k;
        return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
      });
    }
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, []);

  function onDown(ev: PointerEvent) {
    if ((ev.target as HTMLElement).closest('[data-nav]')) return;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    drag.current = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
  }
  function onMove(ev: PointerEvent) {
    if (!drag.current) return;
    setView((v) => ({
      ...v,
      x: drag.current!.vx + (ev.clientX - drag.current!.x),
      y: drag.current!.vy + (ev.clientY - drag.current!.y),
    }));
  }
  function onUp() {
    drag.current = null;
  }

  function toggleKind(k: string) {
    setHiddenKinds((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  }

  return (
    <div class="sm">
      <div class="sm-bar">
        <div class="sm-legend">
          {Object.entries(KIND_LABEL).map(([k, l]) => (
            <span class="lg" key={k}>
              <i style={{ background: KIND_COLOR[k] }} />
              {l}
            </span>
          ))}
        </div>
        <div class="sm-filter">
          <span>辺:</span>
          {edgeKinds.map((k) => (
            <button
              key={k}
              type="button"
              class={`sm-chip ${hiddenKinds.has(k) ? 'off' : ''}`}
              style={{ borderColor: EDGE_COLOR[k] }}
              onClick={() => toggleKind(k)}
            >
              {EDGE_LABEL[k] ?? k}
            </button>
          ))}
          <button type="button" class="sm-chip" onClick={fit}>
            全体表示
          </button>
        </div>
      </div>

      <div
        class="sm-vp"
        ref={vpRef}
        style={{ height: `${height}px` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <svg
          class="sm-svg"
          width="100%"
          height="100%"
          style={{ touchAction: 'none' }}
        >
          <defs>
            {Object.entries(EDGE_COLOR).map(([k, c]) => (
              <marker
                key={k}
                id={`${uid}-${k}`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0 0 L8 4 L0 8 z" fill={c} />
              </marker>
            ))}
          </defs>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {elements.edges.map((e) => {
              const a = layout.byId.get(e.data.source);
              const b = layout.byId.get(e.data.target);
              if (!a || !b) return null;
              const dim = hiddenKinds.has(e.data.kind);
              const pts = layout.edgePts.get(e.data.id);
              let d: string;
              if (pts && pts.length >= 2) {
                // dagre の経路（折れ線）を二次ベジェで滑らかに。端点はノード縁へ
                const p = pts.map((q) => ({ ...q }));
                p[0] = { x: a.x + a.w, y: a.y + a.h / 2 };
                p[p.length - 1] = { x: b.x, y: b.y + b.h / 2 };
                d = `M ${p[0].x} ${p[0].y}`;
                for (let i = 1; i < p.length - 1; i++) {
                  const xc = (p[i].x + p[i + 1].x) / 2;
                  const yc = (p[i].y + p[i + 1].y) / 2;
                  d += ` Q ${p[i].x} ${p[i].y} ${xc} ${yc}`;
                }
                const e2 = p[p.length - 1];
                d += ` L ${e2.x} ${e2.y}`;
              } else {
                const sx = a.x + a.w;
                const sy = a.y + a.h / 2;
                const tx = b.x;
                const ty = b.y + b.h / 2;
                const dx = Math.max(40, Math.abs(tx - sx) * 0.45);
                d = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
              }
              return (
                <path
                  key={e.data.id}
                  data-nav
                  class="sm-edge"
                  d={d}
                  fill="none"
                  stroke={EDGE_COLOR[e.data.kind] ?? '#888'}
                  stroke-width={1.6}
                  opacity={dim ? 0.05 : 0.5}
                  marker-end={`url(#${uid}-${e.data.kind})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => (window.location.href = `/${characterId}/routes/${e.data.id}/`)}
                >
                  <title>{e.data.label}</title>
                </path>
              );
            })}
            {layout.nodes.map((n) => (
              <g
                key={n.id}
                data-nav
                transform={`translate(${n.x} ${n.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => (window.location.href = `/${characterId}/situations/${n.id}/`)}
              >
                <title>{n.label}</title>
                <rect
                  width={n.w}
                  height={n.h}
                  rx={2}
                  fill="var(--panel)"
                  stroke={n.id === center ? '#d9a441' : KIND_COLOR[n.kind] ?? '#888'}
                  stroke-width={n.id === center ? 3 : 1.5}
                />
                <rect width={5} height={n.h} fill={KIND_COLOR[n.kind] ?? '#888'} />
                <text
                  x={n.w / 2 + 3}
                  text-anchor="middle"
                  fill="var(--text)"
                  style={{ fontSize: '10px', fontFamily: 'var(--font-pixel)' }}
                >
                  {n.lines.map((ln, i) => (
                    <tspan
                      key={i}
                      x={n.w / 2 + 3}
                      y={n.lines.length > 1 ? n.h / 2 - 6 + i * 13 : n.h / 2}
                      dominant-baseline="central"
                    >
                      {ln}
                    </tspan>
                  ))}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p class="sm-hint">
        ドラッグで移動・ホイールで拡大縮小。クリックで各詳細へ。
        「起き攻め」の辺を隠すとコンボの骨組みだけが見えます。
      </p>

      <style>{`
        .sm { border:2px solid var(--border-strong); background:var(--bg-sunken); }
        .sm-bar { display:flex; flex-wrap:wrap; gap:.6rem 1rem; justify-content:space-between; padding:.55rem .8rem; border-bottom:1px solid var(--border); }
        .sm-legend, .sm-filter { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; font-size:.73rem; color:var(--text-dim); }
        .sm-legend .lg { display:inline-flex; align-items:center; gap:.3em; }
        .sm-legend i { width:10px; height:10px; display:inline-block; }
        .sm-filter span { color:var(--text-faint); }
        .sm-chip { font-size:.72rem; padding:.15em .55em; border:1px solid var(--border-strong); background:var(--bg-raised); color:var(--text); cursor:pointer; font-family:var(--font-pixel); }
        .sm-chip.off { opacity:.4; text-decoration:line-through; }
        .sm-vp { position:relative; overflow:hidden; cursor:grab; touch-action:none; background:var(--bg-sunken); }
        .sm-vp:active { cursor:grabbing; }
        .sm-svg { position:absolute; inset:0; display:block; }
        .sm-edge { transition:opacity .1s, stroke-width .1s; }
        .sm-edge:hover { opacity:1 !important; stroke-width:3; }
        .sm-svg g[data-nav]:hover rect:first-of-type { filter:brightness(1.35); }
        .sm-hint { margin:0; padding:.45rem .8rem; font-size:.7rem; color:var(--text-faint); border-top:1px solid var(--border); background:var(--bg-raised); }
      `}</style>
    </div>
  );
}
