export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-0 border-b border-border mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-2.5 px-[18px] text-xs font-medium border-none bg-transparent cursor-pointer transition-all duration-200 -mb-px ${
            activeTab === tab.id
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-muted border-b-2 border-transparent hover:text-text-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
