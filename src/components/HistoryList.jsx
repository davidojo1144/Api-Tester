import { METHOD_COLORS, getStatusClass } from '../utils/helpers'

export default function HistoryList({ history, onSelect, onClear, activeIndex }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted">
        <p className="text-[13px]">No requests yet</p>
      </div>
    )
  }

  return (
    <div>
      {history.map((item, index) => {
        const statusClass = item.status === 'ERR'
          ? { text: 'text-status-error' }
          : getStatusClass(item.status)

        return (
          <div
            key={item.ts}
            onClick={() => onSelect(index)}
            className={`flex items-center gap-3 py-2.5 px-3.5 border rounded-[6px] cursor-pointer transition-all duration-200 mb-1.5 hover:border-accent hover:bg-accent/5 ${
              activeIndex === index
                ? 'border-accent bg-accent/5 shadow-[0_0_0_1px_var(--color-accent-glow)]'
                : 'border-border'
            }`}
          >
            <span className={`text-[11px] font-bold min-w-[55px] text-center font-mono ${METHOD_COLORS[item.method]}`}>
              {item.method}
            </span>
            <span className="flex-1 text-xs text-text-secondary font-mono whitespace-nowrap overflow-hidden text-ellipsis">
              {item.url}
            </span>
            <span className={`text-xs font-semibold font-mono ${statusClass.text}`}>
              {item.status}
            </span>
            <span className="text-xs text-text-muted font-mono">{item.time}ms</span>
          </div>
        )
      })}
    </div>
  )
}
