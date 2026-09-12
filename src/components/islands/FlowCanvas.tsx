/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import * as dagreNS from '@dagrejs/dagre';
import type { FlowEdge, FlowGraph, FlowGroup, FlowNode } from '../../lib/graph/flow';
import { WAKEUP_COVERAGE_SHORT } from '../../lib/ui';
import Notation from './Notation';

const dagre: typeof import('@dagrejs/dagre') =
  (dagreNS as any).default ?? (dagreNS as any);

interface Props {
  graph: FlowGraph;
  /** モダン操作版のグラフ（あれば クラシック⇄モダン トグルを表示） */
  graphModern?: FlowGraph;
  height?: number;
  /** ノード/エッジのリンク先 URL に使うキャラ ID（例: 'manon'） */
  characterId: string;
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

/** 操作チップ左の 1 文字（lib/ui.ts の STEP_ACTION と対応） */
const STEP_ACTION_TAG: Record<string, string> = {
  walk: '歩',
  walk_back: '歩',
  dash: '走',
  dash_back: '走',
  whiff: '空',
  wait: '見',
};

/** 起き攻めの枠に出す特徴テキストの行数から高さを見積もる */
function wrapLines(text: string | undefined, perLine = 30): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / perLine));
}
const OKI_MIN_W = 300; // 起き攻め枠の最小幅（特徴テキストが折り返しても読める幅）
const OKI_LINE_CHARS = 22;
function okizemeHeaderHeight(g: FlowGroup): number {
  let lines = 1; // ヘッダ（種別＋有利F＋受け身＋リスク＋詳細）
  lines += wrapLines(g.strongVs?.join('・'), OKI_LINE_CHARS);
  lines += wrapLines(g.weakVs?.join('・'), OKI_LINE_CHARS);
  lines += wrapLines(g.caution, OKI_LINE_CHARS);
  return 24 + lines * 15;
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

  // 起き攻めグループの先頭ノードは、上にヘッダ余白・幅は特徴テキストが読める最小幅を dagre に確保させる
  const inflate = (nodeId: string) => {
    const grp = firstOfGroup.get(nodeId);
    if (!grp) return { top: 0, extraW: 0 };
    const top = headerHOf.get(grp.id)! + GROUP_PAD;
    const s = sizes.get(nodeId) ?? { w: 150, h: 64 };
    const extraW = grp.variant === 'okizeme' ? Math.max(0, OKI_MIN_W - s.w) : 0;
    return { top, extraW };
  };

  for (const n of graph.nodes) {
    const s = sizes.get(n.id) ?? { w: 150, h: 64 };
    const { top, extraW } = inflate(n.id);
    g.setNode(n.id, { width: s.w + extraW, height: s.h + top });
  }
  for (const e of graph.edges) g.setEdge(e.from, e.to, {}, e.id);

  dagre.layout(g);

  const placed: Placed[] = graph.nodes.map((node) => {
    const p = g.node(node.id);
    const s = sizes.get(node.id) ?? { w: 150, h: 64 };
    const { top, extraW } = inflate(node.id);
    // dagre 中心から、水増し分を除いた実ノード（先頭ノードは左下寄せ、ヘッダは上に確保）
    return {
      node,
      x: p.x - (s.w + extraW) / 2 + OFFSET,
      y: p.y - (s.h + top) / 2 + top + OFFSET,
      w: s.w,
      h: s.h,
    };
  });
  const byId = new Map(placed.map((p) => [p.node.id, p]));

  const boxFor = (group: FlowGroup): GroupBox | null => {
    const members = group.nodeIds.map((id) => byId.get(id)).filter(Boolean) as Placed[];
    if (!members.length) return null;
    const minX = Math.min(...members.map((m) => m.x));
    const minY = Math.min(...members.map((m) => m.y));
    const maxX = Math.max(...members.map((m) => m.x + m.w));
    const maxY = Math.max(...members.map((m) => m.y + m.h));
    const headerH = headerHOf.get(group.id)!;
    let w = maxX - minX + GROUP_PAD * 2;
    // 起き攻め枠は特徴テキストが読める幅を確保（dagre 側で先頭ノード幅を水増し済み）
    if (group.variant === 'okizeme') w = Math.max(w, OKI_MIN_W + GROUP_PAD * 2);
    return {
      group,
      x: minX - GROUP_PAD,
      y: minY - GROUP_PAD - headerH,
      w,
      h: maxY - minY + GROUP_PAD * 2 + headerH,
      headerH,
    };
  };

  let groupBoxes = graph.groups.map(boxFor).filter(Boolean) as GroupBox[];

  // 枠の重なりを縦方向にほどく（左→右・上→下の順に、下側の枠を押し下げる）
  const GAP = 16;
  const xOverlap = (a: GroupBox, b: GroupBox) => a.x < b.x + b.w && b.x < a.x + a.w;
  const order = [...groupBoxes].sort((a, b) => a.x - b.x || a.y - b.y);
  for (let i = 1; i < order.length; i++) {
    const box = order[i];
    for (let j = 0; j < i; j++) {
      const prev = order[j];
      if (!xOverlap(box, prev)) continue;
      const needTop = prev.y + prev.h + GAP;
      if (box.y < needTop) {
        const shift = needTop - box.y;
        box.y += shift;
        for (const id of box.group.nodeIds) {
          const p = byId.get(id);
          if (p) p.y += shift;
        }
      }
    }
  }
  // ノード座標が動いたので枠を作り直す（headerH は保持）
  groupBoxes = graph.groups
    .map((grp) => {
      const b = boxFor(grp);
      return b;
    })
    .filter(Boolean) as GroupBox[];

  const gg = g.graph();
  const contentBottom = Math.max(
    0,
    ...placed.map((p) => p.y + p.h),
    ...groupBoxes.map((b) => b.y + b.h),
    gg.height ?? 300,
  );
  const contentRight = Math.max(
    0,
    ...placed.map((p) => p.x + p.w),
    ...groupBoxes.map((b) => b.x + b.w),
    gg.width ?? 400,
  );
  return {
    placed,
    byId,
    groupBoxes,
    width: contentRight + OFFSET,
    height: contentBottom + OFFSET,
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

export default function FlowCanvas({ graph, graphModern, height = 520, characterId }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [lay, setLay] = useState<LayoutState>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [full, setFull] = useState(false);
  const [modern, setModern] = useState(false);
  const [uid] = useState(() => 'fc' + Math.random().toString(36).slice(2, 8));
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const hasModern = !!graphModern;
  const activeGraph = modern && graphModern ? graphModern : graph;

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
    const result = layout(activeGraph, sizes);
    setLay(result);
    fitTo(result.width, result.height);
  }

  useLayoutEffect(() => {
    remeasure();
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => remeasure());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGraph]);

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
    <div
      class={`fc ${full ? 'fc-full' : ''}`}
      data-control={modern ? 'modern' : 'classic'}
      style={full ? undefined : { height: `${height}px` }}
    >
      <div class="fc-toolbar">
        <span class="fc-ctl" role="group" aria-label="操作タイプ">
          <button
            type="button"
            class={!modern ? 'on' : ''}
            onClick={() => setModern(false)}
          >
            クラシック
          </button>
          <button
            type="button"
            class={modern ? 'on' : ''}
            disabled={!hasModern}
            title={hasModern ? undefined : 'このコンボはクラシックのみ'}
            onClick={() => hasModern && setModern(true)}
          >
            モダン
          </button>
        </span>
        <span class="fc-tbsep" />

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
          {activeGraph.nodes.map((n) => (
            <div class="fc-mnode" data-mid={n.id} key={n.id}>
              <NodeInner node={n} characterId={characterId} />
            </div>
          ))}
        </div>

        {lay && (
          <div
            class="fc-world"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
          >
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
                      {gb.group.frameAdvantage && (
                        <span class="gi-frame">初回行動後 {gb.group.frameAdvantage}</span>
                      )}
                      {gb.group.wakeupCoverage && (
                        <span class="gi-wake-badge">
                          受け身:{WAKEUP_COVERAGE_SHORT[gb.group.wakeupCoverage]}
                        </span>
                      )}
                      {gb.group.risk && (
                        <span class={`gi-risk r-${gb.group.risk}`}>リスク{gb.group.risk}</span>
                      )}
                      <a class="gi-link" href={`/${characterId}/routes/${gb.group.routeId}/`}>
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

            <svg class="fc-edges" width={lay.width} height={lay.height} aria-hidden="true">
              <defs>
                {[
                  ['flow', '#9aa0ab'],
                  ['branch', '#88bbdd'],
                  ['okizeme', '#d9a441'],
                ].map(([v, color]) => (
                  <marker
                    key={v}
                    id={`${uid}-${v}`}
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
              {activeGraph.edges.map((e: FlowEdge) => {
                const a = lay.byId.get(e.from);
                const b = lay.byId.get(e.to);
                if (!a || !b) return null;
                return (
                  <path
                    key={e.id}
                    d={edgePath(a, b)}
                    class={`fc-edge v-${e.variant}`}
                    fill="none"
                    marker-end={`url(#${uid}-${e.variant})`}
                  />
                );
              })}
            </svg>

            {lay.placed.map((p) => (
              <div
                key={p.node.id}
                class="fc-pnode"
                style={{ left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${p.h}px` }}
              >
                <NodeInner node={p.node} characterId={characterId} />
              </div>
            ))}
          </div>
        )}
      </div>
      <p class="fc-hint">
        ドラッグで移動・ホイールで拡大縮小。起き攻めの枠にその択の特徴を表示。ノードのクリックで詳細へ。
      </p>

      <style>{`
        .fc { border:2px solid var(--border-strong); background:var(--bg-sunken); display:flex; flex-direction:column; }
        .fc-full { position:fixed; inset:0; z-index:9999; height:100dvh !important; border:0; }
        .fc-toolbar { display:flex; gap:.4rem; align-items:center; padding:.5rem .7rem; border-bottom:1px solid var(--border); flex-wrap:wrap; background:var(--bg-raised); }
        .fc-toolbar button { font-family:var(--font-pixel); font-size:.75rem; padding:.2em .6em; border:1px solid var(--border-strong); background:var(--bg-raised); color:var(--text); cursor:pointer; }
        .fc-toolbar button:hover { background:var(--panel); }
        .fc-full-btn { color:var(--accent) !important; border-color:var(--accent) !important; }
        .fc-ctl { display:inline-flex; }
        .fc-ctl button { font-family:var(--font-pixel); font-size:.75rem; padding:.2em .6em; border:1px solid var(--border-strong); background:var(--bg-raised); color:var(--text-dim); cursor:pointer; }
        .fc-ctl button:first-child { border-right-width:1px; }
        .fc-ctl button.on { background:var(--accent); color:var(--accent-ink); border-color:var(--accent); }
        .fc-ctl button:disabled { opacity:.4; cursor:not-allowed; }
        .fc-tbsep { width:1px; align-self:stretch; background:var(--border); margin:0 .3rem; }
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
        .fc-edges { position:absolute; top:0; left:0; overflow:visible; pointer-events:none; }
        .fc-edge { stroke-width:2; }
        .fc-edge.v-flow { stroke:#9aa0ab; }
        .fc-edge.v-branch { stroke:#88bbdd; }
        .fc-edge.v-okizeme { stroke:var(--accent); stroke-dasharray:6 5; }
        .fc-group { position:absolute; border:1px solid var(--border-strong); border-radius:2px; background:rgba(128,128,128,.05); }
        .fc-group.g-branch { border-color:#5a7a99; }
        .fc-group.g-okizeme { border-style:dashed; border-color:var(--accent); background:rgba(217,164,65,.06); }
        .fc-group-label { position:absolute; top:-11px; left:6px; z-index:3; font-size:.66rem; color:var(--text-dim); background:var(--bg-raised); border:1px solid var(--border-strong); padding:.05em .45em; white-space:nowrap; display:flex; gap:.4em; max-width:280px; overflow:hidden; text-overflow:ellipsis; }
        .fc-group-label b { color:var(--accent); font-weight:400; }
        .fc-group-info { position:absolute; top:0; left:0; right:0; padding:5px 8px; overflow:hidden; display:flex; flex-direction:column; gap:2px; }
        .gi-head { display:flex; align-items:center; gap:.35em; font-size:.66rem; margin-bottom:1px; }
        .gi-kind { font-family:var(--font-pixel); background:var(--accent); color:var(--accent-ink); padding:.05em .4em; }
        .gi-risk { border:1px solid currentColor; padding:0 .3em; font-weight:700; }
        .gi-risk.r-低 { color:var(--risk-low); }
        .gi-risk.r-中 { color:var(--risk-mid); }
        .gi-risk.r-高 { color:var(--risk-high); }
        .gi-link { margin-left:auto; font-size:.66rem; color:var(--link); font-weight:700; }
        .gi-frame { font-family:var(--font-pixel); font-size:.66rem; background:var(--btn-dr); color:#08160c; padding:.05em .4em; font-weight:700; }
        :root[data-theme='light'] .gi-frame { color:#fff; }
        .gi-wake-badge { font-size:.63rem; border:1px solid var(--border-strong); color:var(--text-dim); padding:0 .3em; border-radius:3px; white-space:nowrap; }
        .gi-line { font-size:.68rem; line-height:1.3; color:var(--text); white-space:normal; overflow:hidden; }
        .gi-line b { font-weight:700; }
        .gi-good { color:var(--risk-low); }
        .gi-bad { color:var(--risk-high); }
        .gi-warn { color:var(--risk-mid); }

        .fc-pnode { position:absolute; }
        .fc-pnode > .fc-node { width:100%; height:100%; }
        .fc-mnode > .fc-node { width:max-content; max-width:360px; }

        .fc-node { background:var(--panel); border:2px solid var(--border-strong); box-shadow:3px 3px 0 rgba(0,0,0,.3); display:flex; flex-direction:column; overflow:hidden; }
        .fc-node-cmd { padding:.35rem .6rem; font-size:1.02rem; white-space:nowrap; display:flex; align-items:center; justify-content:center; flex:1; }
        .fc-node.n-action { border-style:dashed; }
        .fc-action { display:inline-flex; align-items:center; gap:.4em; font-size:.82rem; color:var(--text-dim); font-family:var(--font-body); }
        .fc-action-tag { display:inline-flex; align-items:center; justify-content:center; width:1.6em; height:1.6em; border-radius:3px; background:var(--border-strong); color:var(--bg); font-family:var(--font-pixel); font-size:.8em; font-weight:700; }
        .fc-action[data-a='whiff'] .fc-action-tag { background:var(--text-faint); }
        .fc-node-move { font-size:.66rem; color:var(--text-dim); background:var(--bg-sunken); padding:.12rem .45rem; border-top:1px solid var(--border); text-align:center; white-space:nowrap; }
        .fc-node-note { font-size:.62rem; color:var(--accent); background:var(--bg-sunken); padding:0 .45rem .16rem; text-align:center; white-space:nowrap; }
        .fc-node.n-cancel { border-left-width:5px; border-left-color:var(--accent); }
        .fc-node.n-outcome, .fc-node.n-start { border-color:var(--sitc, var(--accent)); background:var(--bg-raised); align-items:stretch; }
        .fc-node.n-outcome a, .fc-node.n-start a { font-family:var(--font-pixel); font-size:.78rem; color:var(--text); text-align:center; padding:.4rem .5rem; display:flex; align-items:center; justify-content:center; flex:1; white-space:nowrap; }
        .fc-node.n-start { border-style:double; border-width:4px; }
        .fc-oc-strip { font-size:.6rem; font-family:var(--font-pixel); text-align:center; padding:.08em 0; border-bottom:1px solid var(--border); background:var(--accent); color:var(--accent-ink); white-space:nowrap; }
        .fc-oc-strip.s-dim { background:var(--border-strong); color:var(--text); }
        .fc-oc-adv { font-size:.62rem; font-family:var(--font-pixel); color:var(--text-dim); background:var(--bg-sunken); border-top:1px solid var(--border); padding:.1em .3em; text-align:center; white-space:nowrap; }
        .fc-hint { margin:0; padding:.45rem .7rem; font-size:.7rem; color:var(--text-faint); border-top:1px solid var(--border); background:var(--bg-raised); }
      `}</style>
    </div>
  );
}

function NodeInner({ node: n, characterId }: { node: FlowNode; characterId: string }) {
  if (n.type === 'step') {
    return (
      <div class={`fc-node n-step ${n.cancel ? 'n-cancel' : ''} ${n.action ? 'n-action' : ''}`}>
        <div class="fc-node-cmd">
          {n.action ? (
            <span class="fc-action" data-a={n.action}>
              <span class="fc-action-tag">{STEP_ACTION_TAG[n.action]}</span>
              {n.actionLabel}
            </span>
          ) : (
            <Notation command={n.command!} commandModern={n.commandModern} />
          )}
        </div>
        {!n.action && n.move && <div class="fc-node-move">{n.move}</div>}
        {n.note && <div class="fc-node-note">{n.note}</div>}
      </div>
    );
  }
  const color = n.sitKind ? SIT_KIND_COLOR[n.sitKind] : undefined;
  const strip = n.loop
    ? { cls: 's-loop', text: '↩ ループ' }
    : n.repeat
      ? { cls: 's-dim', text: '⇢ 既出（同じ展開）' }
      : n.more
        ? { cls: 's-more', text: 'この先の起き攻め →' }
        : null;
  return (
    <div
      class={`fc-node ${n.type === 'start' ? 'n-start' : 'n-outcome'}`}
      style={color ? { ['--sitc' as any]: color } : undefined}
    >
      {strip && <div class={`fc-oc-strip ${strip.cls}`}>{strip.text}</div>}
      <a href={`/${characterId}/situations/${n.situationId}/`}>{n.label}</a>
      {n.advantage && <div class="fc-oc-adv">相手復帰まで {n.advantage}</div>}
    </div>
  );
}
