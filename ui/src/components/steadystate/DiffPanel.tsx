import ReactDiffViewer from 'react-diff-viewer-continued'

interface ParsedFile {
  filename: string
  oldText: string
  newText: string
}

function parsePatch(raw: string): ParsedFile[] {
  const files: ParsedFile[] = []
  const sections = raw.split(/(?=^diff --git )/m).filter((s) => s.trim())

  for (const section of sections) {
    const plusMatch = section.match(/^\+\+\+ b\/(.+)$/m)
    if (!plusMatch) continue
    const filename = plusMatch[1].trim().split('/').pop() ?? 'unknown'

    const lines = section.split('\n')
    const hunkLineIdx = lines.findIndex((l) => l.startsWith('@@'))
    if (hunkLineIdx === -1) continue

    const oldLines: string[] = []
    const newLines: string[] = []

    for (let i = hunkLineIdx; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('@@')) continue
      if (line.startsWith('\\ ')) continue

      if (line.startsWith('-')) {
        oldLines.push(line.slice(1))
      } else if (line.startsWith('+')) {
        newLines.push(line.slice(1))
      } else {
        const ctx = line.startsWith(' ') ? line.slice(1) : line
        oldLines.push(ctx)
        newLines.push(ctx)
      }
    }

    files.push({ filename, oldText: oldLines.join('\n'), newText: newLines.join('\n') })
  }

  return files
}

const DIFF_STYLES = {
  variables: {
    dark: {
      diffViewerBackground: '#0f1824',
      gutterBackground: '#0f1824',
      gutterColor: '#475569',
      gutterBorderColor: '#24324A',
      addedBackground: 'rgba(34,197,94,0.08)',
      addedGutterBackground: 'rgba(34,197,94,0.15)',
      removedBackground: 'rgba(239,68,68,0.08)',
      removedGutterBackground: 'rgba(239,68,68,0.15)',
      wordAddedBackground: 'rgba(34,197,94,0.25)',
      wordRemovedBackground: 'rgba(239,68,68,0.25)',
      addedColor: '#86efac',
      removedColor: '#fca5a5',
      defaultColor: '#94A3B8',
      diffViewerTitleBackground: '#121827',
      diffViewerTitleColor: '#64748B',
      diffViewerTitleBorderColor: '#24324A',
      codeFoldBackground: '#121827',
      codeFoldGutterBackground: '#121827',
      codeFoldContentColor: '#475569',
    },
  },
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 rounded-xl border border-dashed border-[#24324A] bg-[#121827] text-center px-6">
      <span className="text-sm text-[#64748B]">No diff available</span>
      <code className="text-xs text-[#64748B] font-mono bg-[#151E30] border border-[#24324A] px-3 py-1.5 rounded-lg">
        Run scripts/run_steady_state.py to generate this
      </code>
    </div>
  )
}

interface Props {
  diffText: string | null
}

export default function DiffPanel({ diffText }: Props) {
  if (!diffText) return <EmptyState />

  const files = parsePatch(diffText)

  return (
    <div className="flex flex-col h-full rounded-xl border border-[#24324A] bg-[#0f1824] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#24324A] flex items-center gap-2.5 shrink-0 bg-[#121827]">
        <span className="text-sm font-semibold text-[#F8FAFC]">Diff</span>
        <span className="text-[#24324A] text-sm">·</span>
        <span className="text-xs text-[#64748B]">
          {files.length} file{files.length !== 1 ? 's' : ''} changed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {files.map((file, i) => (
          <div key={i} className={i > 0 ? 'mt-1 border-t border-[#24324A]' : ''}>
            <div className="px-4 py-1.5 bg-[#151E30] sticky top-0 z-10">
              <span className="text-xs font-mono text-[#F59E0B]">{file.filename}</span>
            </div>
            <div className="text-xs">
              <ReactDiffViewer
                oldValue={file.oldText}
                newValue={file.newText}
                splitView={false}
                useDarkTheme={true}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                styles={DIFF_STYLES as any}
                hideLineNumbers={false}
                showDiffOnly={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
