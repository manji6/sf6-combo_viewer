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
}

interface PNode {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function nodeW(label: string) {
  return Math.max(90, Math.min(210, 26 + label.length * 12));
}

export default function SystemMap({ elements, center, height = 520 }: Props) {
  const vpRef = useRef<HTMLDivElement>(null);
  const [uid] = useState(() => 'sm' + Math.random().toString(36).slice(2, 7));
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [hiddenKinds, setHiddenKinds] = useState<Set<string>>(new Set());
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const fitted = useRef(false);

  const layout = useMemo(() => {
    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({ rankdir: 'LR', nodesep: 18, ranksep: 70, marginx: 16, marginy: 16 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const n of elements.nodes) g.setNode(n.data.id, { width: nodeW(n.data.label), height: 30 });
    for (const e of elements.edges) g.setEdge(e.data.source, e.data.target, {}, e.data.id);
    dagre.layout(g);
    const nodes: PNode[] = elements.nodes.map((n) => {
      const p = g.node(n.data.id);
      const w = nodeW(n.data.label);
      return { id: n.data.id, label: n.data.label, kind: n.data.kind, x: p.x - w / 2, y: p.y - 15, w, h: 30 };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const gg = g.graph();
    return { nodes, byId, width: (gg.width ?? 400) + 32, height: (gg.height ?? 300) + 32 };
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
              const sx = a.x + a.w;
              const sy = a.y + a.h / 2;
              const tx = b.x;
              const ty = b.y + b.h / 2;
              const dx = Math.max(30, Math.abs(tx - sx) * 0.5);
              return (
                <path
                  key={e.data.id}
                  data-nav
                  d={`M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke={EDGE_COLOR[e.data.kind] ?? '#888'}
                  stroke-width={1.5}
                  opacity={dim ? 0.08 : 0.75}
                  marker-end={`url(#${uid}-${e.data.kind})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => (window.location.href = `/manon/routes/${e.data.id}/`)}
                />
              );
            })}
            {layout.nodes.map((n) => (
              <g
                key={n.id}
                data-nav
                transform={`translate(${n.x} ${n.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => (window.location.href = `/manon/situations/${n.id}/`)}
              >
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
                  x={n.w / 2 + 2}
                  y={n.h / 2}
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="var(--text)"
                  style={{ fontSize: '10px', fontFamily: 'var(--font-pixel)' }}
                >
                  {n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p class="sm-hint">
        ドラッグで移動・ホイールで拡大縮小。丸枠＝状況ノード、矢印＝パーツ。クリックで各詳細へ。
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
        .sm-hint { margin:0; padding:.45rem .8rem; font-size:.7rem; color:var(--text-faint); border-top:1px solid var(--border); background:var(--bg-raised); }
      `}</style>
    </div>
  );
}
