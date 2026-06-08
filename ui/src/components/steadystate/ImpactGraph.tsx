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
      className="flex flex-col items-center justify-center rounded-xl border-2 border-[#F59E0B]/50 bg-[#F59E0B]/10 text-center px-2"
    >
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#F59E0B', border: '2px solid #d97706', width: 8, height: 8 }}
      />
      <span className="text-[11px] font-bold text-[#F59E0B] leading-tight">{name}()</span>
      <span className="text-[9px] text-[#F59E0B]/60 mt-0.5 leading-tight px-2 truncate max-w-full">
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
      className="flex flex-col items-center justify-center rounded-xl border-2 border-[#3B82F6]/50 bg-[#3B82F6]/10 text-center px-2"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#60A5FA', border: '2px solid #2563eb', width: 8, height: 8 }}
      />
      <span className="text-[10px] font-bold text-[#60A5FA] leading-tight">{testId}</span>
      <span className="text-[9px] text-[#60A5FA]/60 mt-0.5 leading-tight px-1 truncate max-w-full">
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
    markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 16, height: 16 },
    style: { stroke: '#344563', strokeWidth: 1.5 },
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <span className="text-sm text-[#64748B]">No impact data found</span>
      <code className="text-xs text-[#64748B] font-mono bg-[#151E30] border border-[#24324A] px-3 py-1.5 rounded-lg">
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
    <div className="flex flex-col h-full rounded-xl border border-[#24324A] bg-[#121827] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#24324A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-[#F8FAFC]">Impact graph</span>
          {impact && (
            <>
              <span className="text-[#24324A] text-sm">·</span>
              <span className="text-xs text-[#64748B]">
                {impact.changed_symbols.length} symbol
                {impact.changed_symbols.length !== 1 ? 's' : ''} →{' '}
                {impact.affected_tests.length} test
                {impact.affected_tests.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/50" />
            <span className="text-xs text-[#64748B]">Code</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 rounded-sm bg-[#3B82F6]/20 border border-[#3B82F6]/50" />
            <span className="text-xs text-[#64748B]">Test</span>
          </div>
        </div>
      </div>

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
            style={{ background: '#0B1020' }}
          >
            <Background variant={BackgroundVariant.Dots} color="#24324A" gap={18} size={1} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
