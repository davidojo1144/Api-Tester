import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function SaveRequestModal({ isOpen, onClose, onSave, defaultMethod, defaultEndpoint }) {
  const [name, setName] = useState('')
  const [collection, setCollection] = useState('My Requests')

  // Suggest a default name based on endpoint
  useEffect(() => {
    if (isOpen) {
      const endpointName = defaultEndpoint.split('?')[0].split('/').pop() || 'Request'
      setName(`${defaultMethod} ${endpointName}`)
    }
  }, [isOpen, defaultMethod, defaultEndpoint])

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), collection.trim() || 'My Requests')
    onClose()
  }

  return (
    <Modal title="Save Request" isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Request Name</label>
          <input 
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Get User Profile"
            className="w-full text-[13px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Collection / Folder</label>
          <input 
            type="text"
            value={collection}
            onChange={e => setCollection(e.target.value)}
            placeholder="e.g. Authentication API"
            className="w-full text-[13px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
          />
        </div>
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
          disabled={!name.trim()}
          className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-purple-500 border border-transparent rounded-[6px] cursor-pointer shadow-[0_2px_10px_var(--color-accent-glow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Request
        </button>
      </div>
    </Modal>
  )
}
