import { useState, useEffect } from 'react'
import Modal from './Modal'
import { parseCurl } from '../utils/helpers'

export default function ImportCurlModal({ isOpen, onClose, onImport }) {
  const [curlString, setCurlString] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCurlString('')
      setError('')
    }
  }, [isOpen])

  const handleImport = () => {
    if (!curlString.trim()) {
      setError('Please paste a cURL command')
      return
    }

    try {
      const parsed = parseCurl(curlString)
      if (!parsed.url) {
        setError('Could not extract URL from cURL command')
        return
      }
      onImport(parsed)
      onClose()
    } catch (e) {
      setError('Failed to parse cURL command')
    }
  }

  return (
    <Modal title="Import from cURL" isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-text-secondary">
          Paste a raw cURL command below to automatically populate the Method, URL, Headers, and Body.
        </p>

        <div>
          <textarea 
            value={curlString}
            onChange={e => {
              setCurlString(e.target.value)
              setError('')
            }}
            placeholder="curl -X POST https://api.example.com/v1/data \
  -H 'Authorization: Bearer token' \
  -d '{&quot;key&quot;: &quot;value&quot;}'"
            rows={8}
            className="w-full text-[12px] font-mono text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] resize-y whitespace-pre"
            autoFocus
          />
          {error && <p className="text-status-error text-[11px] font-medium mt-2">{error}</p>}
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
          onClick={handleImport}
          className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-purple-500 border border-transparent rounded-[6px] cursor-pointer shadow-[0_2px_10px_var(--color-accent-glow)] transition-colors"
        >
          Import
        </button>
      </div>
    </Modal>
  )
}
