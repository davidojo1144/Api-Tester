export default function Header({ onOpenEnv, onImportCurl, onExportData, onImportData }) {
  return (
    <div className="flex items-center gap-3.5 mb-8">
      <div className="w-[42px] h-[42px] bg-gradient-to-br from-accent to-purple-500 rounded-[10px] flex items-center justify-center text-xl shadow-[0_4px_20px_var(--color-accent-glow)] shrink-0">
        ⚡
      </div>
      <div className="flex-1">
        <h1 className="text-[22px] font-bold bg-gradient-to-br from-text-primary to-accent bg-clip-text text-transparent">
          API Tester
        </h1>
        <p className="text-[13px] text-text-secondary">Test your endpoints with ease</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenEnv}
          className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-input border border-border rounded-[6px] cursor-pointer transition-colors"
        >
          {`{ } Variables`}
        </button>
        
        {/* Dropdown for Import/Export could go here, but simple buttons are fine for now */}
        <button
          onClick={onImportCurl}
          className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-input border border-border rounded-[6px] cursor-pointer transition-colors"
        >
          Import cURL
        </button>

        <div className="flex bg-bg-tertiary border border-border rounded-[6px] overflow-hidden ml-1">
          <button
            onClick={onImportData}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-input border-none bg-transparent cursor-pointer transition-colors border-r border-border"
            title="Import Data"
          >
            ↓
          </button>
          <button
            onClick={onExportData}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-input border-none bg-transparent cursor-pointer transition-colors"
            title="Export Backup"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
