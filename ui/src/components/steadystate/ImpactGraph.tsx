import { useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { ChangeImpact, ChangedSymbol, AffectedTest } from '../../hooks/useSteadyStateData'

// ── Custom nodes ──────────────────────────────────────────────────────────────

function CodeSymbolNode({ data }: NodeProps) {
  const { name, file } = data as { name: string; file: string }
  return (
    <div
      style={{ width: 130, height: 72 }}
      className="flex flex-col items-center justify-center rounded-full border-2 border-orange-400/70 bg-orange-500/15 text-center px-2"
    >
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#fb923c', border: '2px solid #c2410c', width: 8, height: 8 }}
      />
      <span className="text-[11px] font-bold text-orange-300 leading-tight">{name}()</span>
      <span className="text-[9px] text-orange-400/60 mt-0.5 leading-tight px-2 truncate max-w-full">
        {file}
      </span>
    </div>
  )
}

function TestNode({ data }: NodeProps) {
  const { testId, filename } = data as { testId: string; filename: string }
  return (
    <div
      style={{ width: 160, height: 56 }}
      className="flex flex-col items-center justify-center rounded border-2 border-blue-400/70 bg-blue-600/15 text-center px-2"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#60a5fa', border: '2px solid #1d4ed8', width: 8, height: 8 }}
      />
      <span className="text-[10px] font-bold text-blue-300 leading-tight">{testId}</span>
      <span className="text-[9px] text-blue-400/60 mt-0.5 leading-tight px-1 truncate max-w-full">
        {filename}
      </span>
    </div>
  )
}

const NODE_TYPES = { code: CodeSymbolNode, test: TestNode }

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(
  symbols: ChangedSymbol[],
  tests: AffectedTest[],
): { nodes: Node[]; edges: Edge[] } {
  const VERT_GAP = 110
  const CODE_X = 30
  const TEST_X = 320
  const TOP_Y = 30

  const nodes: Node[] = [
    ...symbols.map((sym, i) => ({
      id: `code-${i}`,
      type: 'code',
      position: { x: CODE_X, y: TOP_Y + i * VERT_GAP },
      data: { name: sym.name, file: sym.file, symType: sym.type },
    })),
    ...tests.map((t, i) => ({
      id: `test-${i}`,
      type: 'test',
      position: { x: TEST_X, y: TOP_Y + i * VERT_GAP },
      data: { testId: t.test_id, filename: t.test_filename },
    })),
  ]

  const edges: Edge[] = []
  const seen = new Set<string>()

  for (let si = 0; si < symbols.length; si++) {
    const sym = symbols[si]
    const symBase = sym.file.replace(/\.php$/i, '').split('/').pop()?.toLowerCase() ?? ''
    let matched = false

    for (let ti = 0; ti < tests.length; ti++) {
      const test = tests[ti]
      const reason = test.reason.toLowerCase()
      const testFile = test.test_filename.toLowerCase()

      if (
        reason.includes(sym.name.toLowerCase()) ||
        (symBase && (testFile.includes(symBase) || reason.includes(symBase)))
      ) {
        const id = `e-${si}-${ti}`
        if (!seen.has(id)) {
          edges.push(makeEdge(id, `code-${si}`, `test-${ti}`))
          seen.add(id)
          matched = true
        }
      }
    }

    // fallback: connect to all tests if no keyword match
    if (!matched) {
      for (let ti = 0; ti < tests.length; ti++) {
        const id = `e-${si}-${ti}`
        if (!seen.has(id)) {
          edges.push(makeEdge(id, `code-${si}`, `test-${ti}`))
          seen.add(id)
        }
      }
    }
  }

  return { nodes, edges }
}

function makeEdge(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 16, height: 16 },
    style: { stroke: '#475569', strokeWidth: 1.5 },
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <span className="text-slate-500 text-sm">No impact data found</span>
      <code className="text-xs text-slate-600 font-mono bg-slate-800 px-3 py-1.5 rounded">
        Run scripts/run_steady_state.py to generate this
      </code>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  impact: ChangeImpact | null
}

export default function ImpactGraph({ impact }: Props) {
  const graph = useMemo(
    () =>
      impact
        ? buildGraph(impact.changed_symbols, impact.affected_tests)
        : { nodes: [], edges: [] },
    [impact],
  )

  return (
    <div className="flex flex-col h-full rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
            Impact Graph
          </span>
          {impact && (
            <>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-xs text-slate-500">
                {impact.changed_symbols.length} symbol
                {impact.changed_symbols.length !== 1 ? 's' : ''} →{' '}
                {impact.affected_tests.length} test
                {impact.affected_tests.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-400/70" />
            <span className="text-[10px] text-slate-500">Code</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 rounded-sm bg-blue-600/20 border border-blue-400/70" />
            <span className="text-[10px] text-slate-500">Test</span>
          </div>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative">
        {!impact ? (
          <EmptyState />
        ) : (
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            panOnDrag={false}
            style={{ background: '#0f172a' }}
          >
            <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={18} size={1} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
