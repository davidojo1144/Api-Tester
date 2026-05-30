import { useState } from 'react'
import Tabs from './Tabs'
import { getStatusClass, highlightJson, escapeHtml } from '../utils/helpers'

const RESPONSE_TABS = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
]

export default function ResponseViewer({ response }) {
  const [activeTab, setActiveTab] = useState('body')
  const [copied, setCopied] = useState(false)

  if (!response) {
    return (
      <div className="text-center py-12 text-text-muted">
        <div className="text-[40px] mb-3">📡</div>
        <p className="text-[13px]">Send a request to see the response here</p>
      </div>
    )
  }

  const { status, statusText, body, time, headers, isJson, error } = response

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-2.5 mb-3.5">
          <span className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full text-[13px] font-semibold font-mono bg-status-error/10 text-status-error">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" />
            Error
          </span>
          {time && <span className="text-xs text-text-muted font-mono">{time}ms</span>}
        </div>
        <pre className="bg-bg-input border border-border rounded-[6px] p-4 font-mono text-[12.5px] leading-relaxed max-h-[500px] overflow-auto whitespace-pre-wrap break-words text-status-error">
          {error}
        </pre>
      </div>
    )
  }

  const statusClass = getStatusClass(status)
  const highlighted = isJson ? highlightJson(body) : escapeHtml(body)
  const headersStr = Object.entries(headers || {}).map(([k, v]) => `${k}: ${v}`).join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="animate-fade-slide">
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2.5">
        <span className={`inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full text-[13px] font-semibold font-mono ${statusClass.bg} ${statusClass.text}`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          {status} {statusText}
        </span>
        <span className="text-xs text-text-muted font-mono">{time}ms</span>
      </div>

      <Tabs tabs={RESPONSE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'body' && (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 py-1.5 px-3 text-[11px] font-medium bg-bg-tertiary border border-border rounded-[6px] text-text-secondary cursor-pointer transition-all duration-200 hover:bg-accent hover:text-white hover:border-accent z-10"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <pre
            className="bg-bg-input border border-border rounded-[6px] p-4 font-mono text-[12.5px] leading-relaxed max-h-[500px] overflow-auto whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}

      {activeTab === 'headers' && (
        <pre className="bg-bg-input border border-border rounded-[6px] p-4 font-mono text-[12.5px] leading-relaxed max-h-[500px] overflow-auto whitespace-pre-wrap break-words">
          {headersStr}
        </pre>
      )}
    </div>
  )
}
