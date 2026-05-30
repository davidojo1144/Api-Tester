import { useEffect } from 'react'

export function useKeyboardShortcuts({ onSend, onSave, onFocusUrl }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      if (isCmdOrCtrl) {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSend && onSend()
        }
        
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          onSave && onSave()
        }

        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault()
          onFocusUrl && onFocusUrl()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSend, onSave, onFocusUrl])
}
