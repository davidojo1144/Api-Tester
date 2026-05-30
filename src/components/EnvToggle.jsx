export default function EnvToggle({ currentEnv, onToggle }) {
  return (
    <div className="flex bg-bg-input border border-border rounded-[6px] overflow-hidden">
      {['dev', 'prod'].map((env) => (
        <button
          key={env}
          onClick={() => onToggle(env)}
          className={`flex-1 py-2 px-4 text-xs font-semibold border-none cursor-pointer transition-all duration-200 uppercase tracking-[0.5px] ${
            currentEnv === env
              ? 'bg-accent text-white shadow-[0_2px_10px_var(--color-accent-glow)]'
              : 'bg-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          {env}
        </button>
      ))}
    </div>
  )
}
