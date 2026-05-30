/**
 * Get the Tailwind color class for an HTTP method
 */
export const METHOD_COLORS = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
}

export const METHOD_BG_COLORS = {
  GET: 'bg-method-get/10',
  POST: 'bg-method-post/10',
  PUT: 'bg-method-put/10',
  PATCH: 'bg-method-patch/10',
  DELETE: 'bg-method-delete/10',
}

/**
 * Get status badge class based on HTTP status code
 */
export function getStatusClass(status) {
  if (status < 300) return { text: 'text-status-success', bg: 'bg-status-success/10' }
  if (status < 400) return { text: 'text-status-warning', bg: 'bg-status-warning/10' }
  return { text: 'text-status-error', bg: 'bg-status-error/10' }
}

/**
 * Escape HTML entities
 */
export function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return String(str).replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Highlight JSON syntax with span classes
 */
export function highlightJson(jsonStr) {
  return escapeHtml(jsonStr)
    .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*([eE][+-]?\d+)?)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
}

// ── 24-hour TTL localStorage helpers ──

const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Save data to localStorage with a 24-hour TTL timestamp
 */
export function saveWithTTL(key, data) {
  try {
    const wrapper = { data, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(wrapper))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Load data from localStorage, returning null if expired or missing
 */
export function loadWithTTL(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const wrapper = JSON.parse(raw)

    // Handle old format (raw data without TTL wrapper)
    if (wrapper.savedAt === undefined) {
      // Migrate: remove old data, return fallback
      localStorage.removeItem(key)
      return fallback
    }

    if (Date.now() - wrapper.savedAt > TTL_MS) {
      localStorage.removeItem(key)
      return fallback
    }
    return wrapper.data ?? fallback
  } catch {
    return fallback
  }
}

// ── History (with full response data) ──

const HISTORY_KEY = 'apitest_history'
const CONFIG_KEY = 'apitest_config'

/**
 * Load history from localStorage (24hr TTL)
 */
export function loadHistory() {
  return loadWithTTL(HISTORY_KEY, [])
}

/**
 * Save history to localStorage (max 30 entries, 24hr TTL)
 */
export function saveHistory(history) {
  saveWithTTL(HISTORY_KEY, history.slice(0, 30))
}

/**
 * Load persisted app config from localStorage (24hr TTL)
 */
export function loadConfig() {
  return loadWithTTL(CONFIG_KEY, null)
}

/**
 * Save app config to localStorage (24hr TTL)
 */
export function saveConfig(config) {
  saveWithTTL(CONFIG_KEY, config)
}
