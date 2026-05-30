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

// ── 2-week TTL localStorage helpers ──

const TTL_MS = 14 * 24 * 60 * 60 * 1000 // 2 weeks

export function saveWithTTL(key, data) {
  try {
    const wrapper = { data, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(wrapper))
  } catch {
    // localStorage full or unavailable
  }
}

export function loadWithTTL(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const wrapper = JSON.parse(raw)

    if (wrapper.savedAt === undefined) {
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

// ── State Persistence (History, Config, Collections, Environments) ──

const HISTORY_KEY = 'apitest_history'
const CONFIG_KEY = 'apitest_config'
const COLLECTIONS_KEY = 'apitest_collections'
const ENVS_KEY = 'apitest_envs'

export function loadHistory() { return loadWithTTL(HISTORY_KEY, []) }
export function saveHistory(history) { saveWithTTL(HISTORY_KEY, history.slice(0, 30)) }

export function loadConfig() { return loadWithTTL(CONFIG_KEY, null) }
export function saveConfig(config) { saveWithTTL(CONFIG_KEY, config) }

export function loadCollections() { return loadWithTTL(COLLECTIONS_KEY, []) }
export function saveCollections(collections) { saveWithTTL(COLLECTIONS_KEY, collections) }

export function loadEnvironments() { 
  return loadWithTTL(ENVS_KEY, {
    dev: [],
    prod: []
  }) 
}
export function saveEnvironments(envs) { saveWithTTL(ENVS_KEY, envs) }

// ── Variable Replacement ──

/**
 * Replace {{variable}} in a string with values from the current environment variables
 */
export function replaceVariables(text, envVars = []) {
  if (!text || typeof text !== 'string') return text
  
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const v = envVars.find(env => env.key === key)
    return v && v.value ? v.value : match // keep original if not found
  })
}

// ── Import/Export ──

export function exportAllData() {
  const data = {
    config: loadConfig(),
    history: loadHistory(),
    collections: loadCollections(),
    environments: loadEnvironments(),
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `apitest-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    if (data.config) saveConfig(data.config)
    if (data.history) saveHistory(data.history)
    if (data.collections) saveCollections(data.collections)
    if (data.environments) saveEnvironments(data.environments)
    return true
  } catch (err) {
    console.error('Import failed', err)
    return false
  }
}

// ── cURL Parsing ──

export function parseCurl(curlString) {
  const parsed = {
    method: 'GET',
    url: '',
    headers: [],
    body: '',
    token: ''
  }

  // A very basic regex parser for common cURL flags
  if (!curlString || typeof curlString !== 'string') return parsed
  if (!curlString.trim().toLowerCase().startsWith('curl')) return parsed

  // Extract URL
  const urlMatch = curlString.match(/curl\s+([^'"\s]+|'[^']+'|"[^"]+")/)
  // Or check if url is after some flags
  const anyUrlMatch = curlString.match(/'(https?:\/\/[^']+)'|"(https?:\/\/[^"]+)"|(https?:\/\/[^\s]+)/)
  if (anyUrlMatch) {
    parsed.url = (anyUrlMatch[1] || anyUrlMatch[2] || anyUrlMatch[3]).replace(/['"]/g, '')
  } else if (urlMatch) {
    parsed.url = urlMatch[1].replace(/['"]/g, '')
  }

  // Extract Method
  const methodMatch = curlString.match(/-X\s+([A-Z]+)/) || curlString.match(/--request\s+([A-Z]+)/)
  if (methodMatch) {
    parsed.method = methodMatch[1]
  }

  // Extract Headers
  const headerRegex = /-H\s+("[^"]+"|'[^']+')/g
  let hMatch
  while ((hMatch = headerRegex.exec(curlString)) !== null) {
    const headerStr = hMatch[1].replace(/^["']|["']$/g, '')
    const splitIndex = headerStr.indexOf(':')
    if (splitIndex > 0) {
      const k = headerStr.substring(0, splitIndex).trim()
      const v = headerStr.substring(splitIndex + 1).trim()
      
      if (k.toLowerCase() === 'authorization' && v.toLowerCase().startsWith('bearer ')) {
        parsed.token = v.substring(7)
      } else {
        parsed.headers.push({ key: k, value: v, id: Date.now() + Math.random() })
      }
    }
  }

  // Extract Body
  const dataRegex = /(?:-d|--data|--data-raw)\s+("[^"]+"|'[^']+')/
  const bodyMatch = curlString.match(dataRegex)
  if (bodyMatch) {
    parsed.body = bodyMatch[1].replace(/^["']|["']$/g, '')
    // Default to POST if body exists and method isn't explicitly set
    if (!methodMatch) parsed.method = 'POST'
  }

  return parsed
}
