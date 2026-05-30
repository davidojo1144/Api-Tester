export default function KVPairEditor({ pairs, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', addLabel = '+ Add' }) {
  const addPair = () => {
    onChange([...pairs, { key: '', value: '', id: Date.now() }])
  }

  const removePair = (id) => {
    onChange(pairs.filter((p) => p.id !== id))
  }

  const updatePair = (id, field, val) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)))
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {pairs.map((pair) => (
          <div key={pair.id} className="flex gap-2 items-center animate-fade-slide">
            <input
              type="text"
              placeholder={keyPlaceholder}
              value={pair.key}
              onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
              className="flex-1 text-[13px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none transition-all duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted"
            />
            <input
              type="text"
              placeholder={valuePlaceholder}
              value={pair.value}
              onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
              className="flex-1 text-[13px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none transition-all duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted"
            />
            <button
              onClick={() => removePair(pair.id)}
              className="w-[34px] h-[34px] min-w-[34px] bg-status-error/10 border border-transparent rounded-[6px] text-status-error text-base cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-status-error hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addPair}
        className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-medium bg-transparent border border-dashed border-border rounded-[6px] text-text-secondary cursor-pointer transition-all duration-200 hover:border-accent hover:text-accent hover:bg-accent/5 mt-2"
      >
        {addLabel}
      </button>
    </div>
  )
}
