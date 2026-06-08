import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { Copy, Check } from 'lucide-react'

const MD_COMPONENTS: Components = {
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mt-3 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-xs text-[#94A3B8] leading-relaxed mb-2">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-4 space-y-1 mb-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-4 space-y-1 mb-2">{children}</ol>
  ),
  li: ({ children }) => <li className="text-xs text-[#94A3B8] leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="text-[#F8FAFC] font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="text-[#94A3B8] italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-[#151E30] text-[#60A5FA] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#24324A]">
      {children}
    </code>
  ),
  hr: () => <hr className="border-[#24324A] my-3" />,
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <span className="text-sm text-[#64748B]">No PR comment found</span>
      <code className="text-xs text-[#64748B] font-mono bg-[#151E30] border border-[#24324A] px-3 py-1.5 rounded-lg">
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
    <div className="flex flex-col h-full rounded-xl border border-[#24324A] bg-[#121827] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#24324A] flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-[#F8FAFC]">Generated PR comment</span>
        <button
          onClick={handleCopy}
          disabled={!markdown}
          className={`
            flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-200
            ${copied
              ? 'border-[#22C55E]/30 text-[#22C55E] bg-[#22C55E]/10'
              : 'border-[#24324A] text-[#64748B] hover:border-[#3B82F6]/40 hover:text-[#94A3B8]'
            }
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
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
