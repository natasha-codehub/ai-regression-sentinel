import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const MD_COMPONENTS: Components = {
  h2: ({ children }) => (
    <h2 className="text-slate-200 text-sm font-semibold mt-4 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-xs text-slate-400 leading-relaxed mb-2">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-4 space-y-1 mb-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-4 space-y-1 mb-2">{children}</ol>
  ),
  li: ({ children }) => <li className="text-xs text-slate-400 leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="text-slate-200 font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded text-[11px] font-mono">
      {children}
    </code>
  ),
  hr: () => <hr className="border-slate-800 my-3" />,
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <span className="text-slate-500 text-sm">No PR comment found</span>
      <code className="text-xs text-slate-600 font-mono bg-slate-800 px-3 py-1.5 rounded">
        Run scripts/run_steady_state.py to generate this
      </code>
    </div>
  )
}

interface Props {
  markdown: string | null
}

export default function PRCommentPanel({ markdown }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!markdown) return
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          Generated PR Comment
        </span>
        <button
          onClick={handleCopy}
          disabled={!markdown}
          className={`
            text-xs font-mono px-2.5 py-1 rounded border transition-all duration-200
            ${copied
              ? 'border-emerald-700 text-emerald-400'
              : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!markdown ? (
          <EmptyState />
        ) : (
          <ReactMarkdown components={MD_COMPONENTS}>{markdown}</ReactMarkdown>
        )}
      </div>
    </div>
  )
}
