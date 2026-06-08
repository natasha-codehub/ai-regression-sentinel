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
      diffViewerBackground: '#0f172a',
      gutterBackground: '#0f172a',
      gutterColor: '#475569',
      gutterBorderColor: '#1e293b',
      addedBackground: 'rgba(20,83,45,0.35)',
      addedGutterBackground: 'rgba(20,83,45,0.55)',
      removedBackground: 'rgba(127,29,29,0.35)',
      removedGutterBackground: 'rgba(127,29,29,0.55)',
      wordAddedBackground: 'rgba(20,83,45,0.75)',
      wordRemovedBackground: 'rgba(127,29,29,0.75)',
      addedColor: '#86efac',
      removedColor: '#fca5a5',
      defaultColor: '#94a3b8',
      diffViewerTitleBackground: '#1e293b',
      diffViewerTitleColor: '#64748b',
      diffViewerTitleBorderColor: '#334155',
      codeFoldBackground: '#1e293b',
      codeFoldGutterBackground: '#1e293b',
      codeFoldContentColor: '#475569',
    },
  },
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 rounded-lg border border-slate-800 bg-slate-900/40 text-center px-6">
      <span className="text-slate-500 text-sm">No diff available</span>
      <code className="text-xs text-slate-600 font-mono bg-slate-800 px-3 py-1.5 rounded">
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
    <div className="flex flex-col h-full rounded-lg border border-slate-700 border-t-2 border-t-violet-500 bg-zinc-900 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700 flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-slate-200">Diff</span>
        <span className="text-slate-600 text-xs">·</span>
        <span className="text-xs text-slate-400">
          {files.length} file{files.length !== 1 ? 's' : ''} changed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {files.map((file, i) => (
          <div key={i} className={i > 0 ? 'mt-1 border-t border-slate-800' : ''}>
            <div className="px-4 py-1.5 bg-slate-800/50 sticky top-0 z-10">
              <span className="text-xs font-mono text-amber-300">{file.filename}</span>
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
