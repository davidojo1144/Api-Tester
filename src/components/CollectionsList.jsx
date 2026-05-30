import { useState } from 'react'
import { METHOD_COLORS } from '../utils/helpers'

export default function CollectionsList({ collections, onSelect, onDelete }) {
  const [openFolders, setOpenFolders] = useState({})

  if (!collections || collections.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted">
        <p className="text-[13px]">No saved collections</p>
      </div>
    )
  }

  const toggleFolder = (folderName) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }))
  }

  // Group collections by folder
  const grouped = collections.reduce((acc, curr) => {
    const folder = curr.collection || 'My Requests'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(curr)
    return acc
  }, {})

  return (
    <div>
      {Object.entries(grouped).map(([folder, items]) => {
        const isOpen = openFolders[folder] !== false // Default open
        return (
          <div key={folder} className="mb-2">
            <div 
              className="flex items-center gap-2 py-2 px-3 bg-bg-tertiary border border-border rounded-[6px] cursor-pointer hover:border-border-hover mb-1"
              onClick={() => toggleFolder(folder)}
            >
              <span className="text-[12px] text-text-muted">{isOpen ? '▼' : '▶'}</span>
              <span className="text-[13px] font-semibold text-text-primary">📁 {folder}</span>
              <span className="ml-auto text-[11px] text-text-muted bg-bg-input px-1.5 py-0.5 rounded-full">{items.length}</span>
            </div>

            {isOpen && (
              <div className="pl-4 flex flex-col gap-1 mt-1 border-l border-border ml-2">
                {items.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    className="flex items-center group py-2 px-3 border border-transparent rounded-[6px] cursor-pointer hover:bg-accent/5 hover:border-accent/30 transition-all"
                  >
                    <div 
                      className="flex-1 flex items-center gap-3 overflow-hidden"
                      onClick={() => onSelect(item)}
                    >
                      <span className={`text-[11px] font-bold min-w-[45px] font-mono ${METHOD_COLORS[item.method]}`}>
                        {item.method}
                      </span>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[13px] font-medium text-text-secondary truncate">{item.name}</span>
                        <span className="text-[11px] text-text-muted font-mono truncate">{item.url}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-[4px] transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                      title="Delete Request"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
