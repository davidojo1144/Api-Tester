import { METHOD_COLORS } from '../utils/helpers'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function UrlBar({ method, endpoint, onMethodChange, onEndpointChange }) {
  return (
    <div className="flex border border-border rounded-[10px] overflow-hidden bg-bg-input transition-all duration-200 focus-within:border-border-focus focus-within:shadow-[0_0_0_3px_var(--color-accent-glow)]">
      <select
        id="httpMethod"
        value={method}
        onChange={(e) => onMethodChange(e.target.value)}
        className={`w-[120px] min-w-[120px] bg-bg-input border-none border-r border-border rounded-none font-semibold cursor-pointer py-3 px-3.5 text-[13px] outline-none ${METHOD_COLORS[method]}`}
        style={{ borderRight: '1px solid var(--color-border)' }}
      >
        {METHODS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <input
        id="endpoint"
        type="text"
        value={endpoint}
        onChange={(e) => onEndpointChange(e.target.value)}
        placeholder="/api/v1/users"
        className="flex-1 bg-transparent border-none rounded-none py-3 px-3.5 text-[13px] font-mono text-text-primary outline-none placeholder:text-text-muted"
      />
    </div>
  )
}
