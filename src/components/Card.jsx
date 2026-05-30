export default function Card({ title, children, className = '', headerRight }) {
  return (
    <div className={`bg-bg-secondary border border-border rounded-[10px] p-5 mb-4 transition-colors duration-200 hover:border-border-hover ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-3.5">
          {title && (
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-text-muted">
              {title}
            </div>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  )
}
