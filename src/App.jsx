import { useState, useCallback, useRef, useEffect } from 'react'
import Header from './components/Header'
import Card from './components/Card'
import EnvToggle from './components/EnvToggle'
import UrlBar from './components/UrlBar'
import KVPairEditor from './components/KVPairEditor'
import Tabs from './components/Tabs'
import ResponseViewer from './components/ResponseViewer'
import HistoryList from './components/HistoryList'
import { loadHistory, saveHistory, loadConfig, saveConfig } from './utils/helpers'

const REQUEST_TABS = [
  { id: 'params', label: 'Query Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
]

// Load persisted state once on module init
const persistedConfig = loadConfig()

export default function App() {
  // Environment
  const [currentEnv, setCurrentEnv] = useState(persistedConfig?.currentEnv || 'dev')
  const envUrls = useRef(persistedConfig?.envUrls || { dev: '', prod: '' })

  // Request config
  const [baseUrl, setBaseUrl] = useState(persistedConfig?.baseUrl || '')
  const [method, setMethod] = useState(persistedConfig?.method || 'GET')
  const [endpoint, setEndpoint] = useState(persistedConfig?.endpoint || '')
  const [accessToken, setAccessToken] = useState(persistedConfig?.accessToken || '')
  const [showToken, setShowToken] = useState(false)

  // Request details
  const [activeRequestTab, setActiveRequestTab] = useState('params')
  const [params, setParams] = useState(persistedConfig?.params || [])
  const [headers, setHeaders] = useState(persistedConfig?.headers || [])
  const [requestBody, setRequestBody] = useState(persistedConfig?.requestBody || '')

  // Response
  const [response, setResponse] = useState(persistedConfig?.lastResponse || null)
  const [loading, setLoading] = useState(false)

  // History (with full response data)
  const [history, setHistory] = useState(() => {
    const loaded = loadHistory()
    return Array.isArray(loaded) ? loaded : []
  })

  // Active history index (to highlight the selected item)
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(null)

  // ── Persist config on every change ──
  useEffect(() => {
    saveConfig({
      currentEnv,
      envUrls: envUrls.current,
      baseUrl,
      method,
      endpoint,
      accessToken,
      params,
      headers,
      requestBody,
      lastResponse: response,
    })
  }, [currentEnv, baseUrl, method, endpoint, accessToken, params, headers, requestBody, response])

  // Environment toggle
  const handleEnvToggle = useCallback((env) => {
    envUrls.current[currentEnv] = baseUrl
    setCurrentEnv(env)
    setBaseUrl(envUrls.current[env] || '')
  }, [currentEnv, baseUrl])

  // Add to history (now includes full response data)
  const addToHistory = useCallback((method, url, status, time, responseData) => {
    setHistory((prev) => {
      const next = [{ method, url, status, time, ts: Date.now(), response: responseData }, ...prev].slice(0, 30)
      saveHistory(next)
      return next
    })
    setActiveHistoryIndex(null)
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
    setActiveHistoryIndex(null)
  }, [])

  // Load from history — now also restores the response
  const loadFromHistory = useCallback((index) => {
    const item = history[index]
    if (!item) return

    // Restore the response body
    if (item.response) {
      setResponse(item.response)
    }

    // Highlight the selected history item
    setActiveHistoryIndex(index)

    // Restore URL and method
    try {
      const urlObj = new URL(item.url)
      setBaseUrl(urlObj.origin)
      setEndpoint(urlObj.pathname)
      setMethod(item.method)

      // Restore query params
      const newParams = []
      urlObj.searchParams.forEach((v, k) => {
        newParams.push({ key: k, value: v, id: Date.now() + Math.random() })
      })
      setParams(newParams)
    } catch {
      setEndpoint(item.url)
    }
  }, [history])

  // Send request
  const sendRequest = useCallback(async () => {
    const trimmedBase = baseUrl.replace(/\/+$/, '')
    if (!trimmedBase && !endpoint) return

    // Build URL
    let url = trimmedBase + endpoint
    const kvParams = params.filter((p) => p.key.trim())
    if (kvParams.length > 0) {
      const searchParams = new URLSearchParams()
      kvParams.forEach((p) => searchParams.append(p.key, p.value))
      url += '?' + searchParams.toString()
    }

    // Build headers
    const reqHeaders = {}
    headers.filter((h) => h.key.trim()).forEach((h) => {
      reqHeaders[h.key] = h.value
    })
    const token = accessToken.trim()
    if (token) {
      reqHeaders['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`
    }

    // Build body
    let body = undefined
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json'
      body = requestBody.trim()
    }

    setLoading(true)
    setActiveHistoryIndex(null)
    const startTime = performance.now()

    try {
      const res = await fetch(url, { method, headers: reqHeaders, body })
      const elapsed = Math.round(performance.now() - startTime)
      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      let data
      let displayText
      if (isJson) {
        data = await res.json()
        displayText = JSON.stringify(data, null, 2)
      } else {
        displayText = await res.text()
      }

      // Collect response headers
      const resHeaders = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        body: displayText,
        time: elapsed,
        headers: resHeaders,
        isJson,
      }

      setResponse(responseData)
      addToHistory(method, url, res.status, elapsed, responseData)
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime)
      const responseData = { error: err.message, time: elapsed }
      setResponse(responseData)
      addToHistory(method, url, 'ERR', elapsed, responseData)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, endpoint, method, accessToken, params, headers, requestBody, addToHistory])

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <Header />

      {/* Configuration */}
      <Card title="Configuration">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Environment
            </label>
            <EnvToggle currentEnv={currentEnv} onToggle={handleEnvToggle} />
          </div>
          <div>
            <label htmlFor="baseUrl" className="block text-xs font-medium text-text-secondary mb-1.5">
              Base URL
            </label>
            <input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full text-[13px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none transition-all duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted"
            />
          </div>
        </div>
        <div>
          <label htmlFor="accessToken" className="block text-xs font-medium text-text-secondary mb-1.5">
            Access Token <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <div className="relative">
            <input
              id="accessToken"
              type={showToken ? 'text' : 'password'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Bearer token or API key"
              className="w-full text-[13px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 pr-16 outline-none transition-all duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-text-muted bg-bg-tertiary border border-border rounded px-2 py-1 cursor-pointer transition-all duration-200 hover:text-text-secondary hover:border-border-hover"
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </Card>

      {/* Request URL */}
      <Card title="Request">
        <UrlBar
          method={method}
          endpoint={endpoint}
          onMethodChange={setMethod}
          onEndpointChange={setEndpoint}
        />
      </Card>

      {/* Params / Headers / Body */}
      <Card>
        <Tabs tabs={REQUEST_TABS} activeTab={activeRequestTab} onTabChange={setActiveRequestTab} />

        {activeRequestTab === 'params' && (
          <KVPairEditor
            pairs={params}
            onChange={setParams}
            keyPlaceholder="Key"
            valuePlaceholder="Value"
            addLabel="+ Add Parameter"
          />
        )}

        {activeRequestTab === 'headers' && (
          <KVPairEditor
            pairs={headers}
            onChange={setHeaders}
            keyPlaceholder="Header Name"
            valuePlaceholder="Header Value"
            addLabel="+ Add Header"
          />
        )}

        {activeRequestTab === 'body' && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Request Body <span className="text-text-muted font-normal">(JSON)</span>
            </label>
            <textarea
              id="requestBody"
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={8}
              placeholder={'{ "key": "value" }'}
              className="w-full font-mono text-[12.5px] text-text-primary bg-bg-input border border-border rounded-[6px] py-2.5 px-3.5 outline-none transition-all duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted resize-y min-h-[100px] leading-relaxed"
            />
          </div>
        )}
      </Card>

      {/* Send Button */}
      <button
        id="sendBtn"
        onClick={sendRequest}
        disabled={loading}
        className="w-full py-3.5 text-sm font-semibold bg-gradient-to-br from-accent to-purple-500 border-none rounded-[10px] text-white cursor-pointer transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_6px_24px_var(--color-accent-glow)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mb-4 flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin-custom" />
        )}
        <span className={loading ? 'opacity-80' : ''}>
          {loading ? 'Sending...' : 'Send Request'}
        </span>
      </button>

      {/* Response */}
      <Card title="Response">
        <ResponseViewer response={response} />
      </Card>

      {/* History */}
      <Card
        title="History"
        headerRight={
          history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[11px] bg-transparent border border-border rounded-[6px] text-text-muted py-1.5 px-3 cursor-pointer transition-all duration-200 hover:border-status-error hover:text-status-error"
            >
              Clear
            </button>
          )
        }
      >
        <HistoryList
          history={history}
          onSelect={loadFromHistory}
          onClear={clearHistory}
          activeIndex={activeHistoryIndex}
        />
      </Card>
    </div>
  )
}
