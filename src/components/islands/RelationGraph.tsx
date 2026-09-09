/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type {
  GraphElements,
  GraphEdgeData,
  GraphNodeData,
} from '../../lib/graph/cytoscape';

cytoscape.use(dagre);

const KIND_COLOR: Record<string, string> = {
  neutral: '#8a8f98',
  hit: '#4aa3ff',
  juggle: '#b07cff',
  knockdown: '#ff7a59',
  blockstring: '#5bd1c9',
  okiStart: '#ff5a5a',
};
const EDGE_COLOR: Record<string, string> = {
  starter: '#8a8f98',
  combo_route: '#4aa3ff',
  okizeme: '#ff7a59',
  ender: '#46d17a',
  conversion: '#b07cff',
};
const KIND_LABEL: Record<string, string> = {
  neutral: 'ニュートラル',
  hit: 'ヒット',
  juggle: '浮き',
  knockdown: 'ダウン',
  blockstring: 'ガード連携',
  okiStart: '置き攻け起点',
};
const EDGE_LABEL: Record<string, string> = {
  starter: '始動',
  combo_route: '中継',
  okizeme: '置き攻け',
  ender: '締め',
  conversion: '変換',
};

interface Props {
  elements: GraphElements;
  center?: string;
  /** ノード / 辺クリックでページ遷移する */
  navigate?: boolean;
  height?: number;
}

export default function RelationGraph({
  elements,
  center,
  navigate = true,
  height = 460,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const edgeKinds = useMemo(
    () => [...new Set(elements.edges.map((e) => e.data.kind))],
    [elements],
  );

  useEffect(() => {
    if (!ref.current) return;
    const cy = cytoscape({
      container: ref.current,
      elements: [
        ...elements.nodes.map((n) => ({ data: { ...n.data } })),
        ...elements.edges.map((e) => ({ data: { ...e.data } })),
      ] as cytoscape.ElementDefinition[],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (n: any) => KIND_COLOR[n.data('kind')] ?? '#888',
            label: 'data(label)',
            color: '#e8eaf0',
            'font-size': 9,
            'font-family': 'monospace',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            width: 16,
            height: 16,
            'border-width': (n: any) => (n.data('id') === center ? 3 : 0),
            'border-color': '#d9a441',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': (e: any) => EDGE_COLOR[e.data('kind')] ?? '#666',
            'target-arrow-color': (e: any) => EDGE_COLOR[e.data('kind')] ?? '#666',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 7,
            'font-family': 'monospace',
            color: '#a2a8b6',
            'text-rotation': 'autorotate',
            'text-background-color': '#14161c',
            'text-background-opacity': 0.7,
            'text-background-padding': '1px',
          },
        },
        {
          selector: '.dim',
          style: { opacity: 0.12 },
        },
      ],
      layout: { name: 'dagre', rankDir: 'LR', nodeSep: 24, rankSep: 90 } as any,
      minZoom: 0.2,
      maxZoom: 2.5,
      wheelSensitivity: 0.25,
    });
    cyRef.current = cy;

    if (navigate) {
      cy.on('tap', 'node', (evt) => {
        const d = evt.target.data() as GraphNodeData;
        window.location.href = `/manon/situations/${d.id}/`;
      });
      cy.on('tap', 'edge', (evt) => {
        const d = evt.target.data() as GraphEdgeData;
        window.location.href = `/manon/routes/${d.id}/`;
      });
      cy.nodes().style('cursor', 'pointer');
      cy.edges().style('cursor', 'pointer');
    }

    if (center) {
      const c = cy.getElementById(center);
      if (c.nonempty()) cy.animate({ center: { eles: c }, zoom: 1 }, { duration: 300 });
    }

    return () => cy.destroy();
  }, [elements, center, navigate]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.edges().forEach((e) => {
      const k = (e.data() as GraphEdgeData).kind;
      e.toggleClass('dim', hidden.has(k));
    });
  }, [hidden]);

  function toggle(k: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  return (
    <div class="rg">
      <div class="rg-bar">
        <div class="rg-legend">
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <span class="lg" key={k}>
              <i style={{ background: KIND_COLOR[k] }} />
              {label}
            </span>
          ))}
        </div>
        <div class="rg-filter">
          <span class="rg-filter-label">辺の種類:</span>
          {edgeKinds.map((k) => (
            <button
              key={k}
              type="button"
              class={`rg-chip ${hidden.has(k) ? 'off' : ''}`}
              style={{ borderColor: EDGE_COLOR[k] }}
              onClick={() => toggle(k)}
            >
              {EDGE_LABEL[k] ?? k}
            </button>
          ))}
          <button type="button" class="rg-chip" onClick={() => cyRef.current?.fit(undefined, 30)}>
            全体表示
          </button>
        </div>
      </div>
      <div class="rg-canvas" ref={ref} style={{ height: `${height}px` }} />
      <p class="rg-hint">
        ドラッグで移動・ホイールで拡大縮小。ノード＝状況、矢印＝パーツ。クリックで各ページへ。
      </p>

      <style>{`
        .rg { border: 2px solid var(--border-strong); background: var(--bg-sunken); }
        .rg-bar { display:flex; flex-wrap:wrap; gap:.6rem 1rem; justify-content:space-between; padding:.6rem .8rem; border-bottom:1px solid var(--border); }
        .rg-legend, .rg-filter { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; font-size:.75rem; color:var(--text-dim); }
        .rg-legend .lg { display:inline-flex; align-items:center; gap:.3em; }
        .rg-legend i { width:10px; height:10px; display:inline-block; }
        .rg-filter-label { color: var(--text-faint); }
        .rg-chip { font-size:.72rem; padding:.15em .55em; border:1px solid var(--border-strong); background:var(--bg-raised); color:var(--text); cursor:pointer; }
        .rg-chip.off { opacity:.4; text-decoration: line-through; }
        .rg-canvas { width:100%; background:var(--bg-sunken); }
        .rg-hint { margin:0; padding:.5rem .8rem; font-size:.72rem; color:var(--text-faint); border-top:1px solid var(--border); }
      `}</style>
    </div>
  );
}
