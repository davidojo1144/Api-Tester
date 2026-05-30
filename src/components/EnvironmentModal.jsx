import { useState, useEffect } from 'react'
import Modal from './Modal'
import KVPairEditor from './KVPairEditor'

export default function EnvironmentModal({ isOpen, onClose, currentEnv, environments, onSave }) {
  const [localEnvs, setLocalEnvs] = useState(environments)
  const [activeTab, setActiveTab] = useState(currentEnv)

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalEnvs(environments)
      setActiveTab(currentEnv)
    }
  }, [isOpen, environments, currentEnv])

  const handleSave = () => {
    onSave(localEnvs)
    onClose()
  }

  const updatePairs = (pairs) => {
    setLocalEnvs(prev => ({
      ...prev,
      [activeTab]: pairs
    }))
  }

  return (
    <Modal title="Environment Variables" isOpen={isOpen} onClose={onClose}>
      <div className="mb-4">
        <p className="text-[13px] text-text-secondary mb-4">
          Define variables to reuse across requests. Use them via <code className="bg-bg-input px-1 py-0.5 rounded text-accent">{`{{variable_name}}`}</code> syntax.
        </p>

        {/* Custom inline tabs for Dev / Prod within Modal */}
        <div className="flex gap-2 mb-4">
          {['dev', 'prod'].map(env => (
            <button
              key={env}
              onClick={() => setActiveTab(env)}
              className={`flex-1 py-2 text-xs font-semibold rounded-[6px] uppercase tracking-[0.5px] transition-all cursor-pointer border ${
                activeTab === env 
                  ? 'bg-accent text-white border-accent' 
                  : 'bg-transparent text-text-muted border-border hover:border-text-muted'
              }`}
            >
              {env}
            </button>
          ))}
        </div>

        <KVPairEditor
          pairs={localEnvs[activeTab] || []}
          onChange={updatePairs}
          keyPlaceholder="Variable Name (e.g. token)"
          valuePlaceholder="Value"
          addLabel="+ Add Variable"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-transparent border border-border rounded-[6px] cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-purple-500 border border-transparent rounded-[6px] cursor-pointer shadow-[0_2px_10px_var(--color-accent-glow)] transition-colors"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  )
}
