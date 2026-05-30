import { useState, useCallback, useRef, useEffect } from 'react'
import Header from './components/Header'
import Card from './components/Card'
import EnvToggle from './components/EnvToggle'
import UrlBar from './components/UrlBar'
import KVPairEditor from './components/KVPairEditor'
import Tabs from './components/Tabs'
import ResponseViewer from './components/ResponseViewer'
import HistoryList from './components/HistoryList'
import CollectionsList from './components/CollectionsList'

// Modals
import EnvironmentModal from './components/EnvironmentModal'
import SaveRequestModal from './components/SaveRequestModal'
import ImportCurlModal from './components/ImportCurlModal'

import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { 
  loadHistory, saveHistory, 
  loadConfig, saveConfig,
  loadCollections, saveCollections,
  loadEnvironments, saveEnvironments,
  replaceVariables, exportAllData, importData
} from './utils/helpers'

const REQUEST_TABS = [
  { id: 'params', label: 'Query Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
]

const SIDEBAR_TABS = [
  { id: 'history', label: 'History' },
  { id: 'collections', label: 'Collections' },
]

// Load persisted state once on module init
const persistedConfig = loadConfig()

export default function App() {
  // Modals state
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Environment
  const [currentEnv, setCurrentEnv] = useState(persistedConfig?.currentEnv || 'dev')
  const envUrls = useRef(persistedConfig?.envUrls || { dev: '', prod: '' })
  const [environments, setEnvironments] = useState(() => loadEnvironments())

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

  // History & Collections
  const [activeSidebarTab, setActiveSidebarTab] = useState('history')
  const [history, setHistory] = useState(() => {
    const loaded = loadHistory()
    return Array.isArray(loaded) ? loaded : []
  })
  const [collections, setCollections] = useState(() => loadCollections())
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(null)

  // ── Keyboard Shortcuts ──
  useKeyboardShortcuts({
    onSend: () => !loading && sendRequest(),
    onSave: () => setIsSaveModalOpen(true),
    onFocusUrl: () => document.getElementById('endpoint')?.focus()
  })

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

  const handleSaveEnvironments = (newEnvs) => {
    setEnvironments(newEnvs)
    saveEnvironments(newEnvs)
  }

  // Add to history
  const addToHistory = useCallback((method, url, status, time, responseData) => {
    setHistory((prev) => {
      const next = [{ method, url, status, time, ts: Date.now(), response: responseData }, ...prev].slice(0, 30)
      saveHistory(next)
      return next
    })
    setActiveHistoryIndex(null)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
    setActiveHistoryIndex(null)
  }, [])

  // Load from history or collections
  const loadSavedRequest = useCallback((item, index = null) => {
    if (!item) return
    
    // For history, it might have response data
    if (item.response) setResponse(item.response)
    else setResponse(null)

    setActiveHistoryIndex(index)

    try {
      const urlObj = new URL(item.url)
      setBaseUrl(urlObj.origin)
      setEndpoint(urlObj.pathname)
      setMethod(item.method)

      const newParams = []
      urlObj.searchParams.forEach((v, k) => {
        newParams.push({ key: k, value: v, id: Date.now() + Math.random() })
      })
      setParams(newParams)
    } catch {
      setEndpoint(item.url)
      setMethod(item.method)
    }

    if (item.headers) setHeaders(item.headers)
    if (item.body) setRequestBody(item.body)
    if (item.token) setAccessToken(item.token)

  }, [])

  // Collections
  const handleSaveCollection = (name, collectionFolder) => {
    const newReq = {
      id: Date.now(),
      name,
      collection: collectionFolder,
      method,
      url: baseUrl.replace(/\/+$/, '') + endpoint,
      headers,
      body: requestBody,
      token: accessToken
    }
    const next = [...collections, newReq]
    setCollections(next)
    saveCollections(next)
  }

  const handleDeleteCollection = (id) => {
    const next = collections.filter(c => c.id !== id)
    setCollections(next)
    saveCollections(next)
  }

  // Import/Export
  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        if (importData(event.target.result)) {
          window.location.reload() // Reload to apply all state
        } else {
          alert('Failed to import backup. Invalid format.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // Send request
  const sendRequest = useCallback(async () => {
    const trimmedBase = baseUrl.replace(/\/+$/, '')
    if (!trimmedBase && !endpoint) return

    const envVars = environments[currentEnv] || []

    // Build URL and Replace Variables
    let rawUrl = trimmedBase + endpoint
    const kvParams = params.filter((p) => p.key.trim())
    if (kvParams.length > 0) {
      const searchParams = new URLSearchParams()
      kvParams.forEach((p) => searchParams.append(replaceVariables(p.key, envVars), replaceVariables(p.value, envVars)))
      rawUrl += '?' + searchParams.toString()
    }
    const url = replaceVariables(rawUrl, envVars)

    // Build headers
    const reqHeaders = {}
    headers.filter((h) => h.key.trim()).forEach((h) => {
      reqHeaders[replaceVariables(h.key, envVars)] = replaceVariables(h.value, envVars)
    })
    
    const rawToken = accessToken.trim()
    if (rawToken) {
      const token = replaceVariables(rawToken, envVars)
      reqHeaders['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`
    }

    // Build body
    let body = undefined
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json'
      body = replaceVariables(requestBody.trim(), envVars)
    }

    setLoading(true)
    setActiveHistoryIndex(null)
    const startTime = performance.now()

    try {
      const res = await fetch(url, { method, headers: reqHeaders, body })
      const elapsed = Math.round(performance.now() - startTime)
      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const isHtml = contentType.includes('text/html')
      const isImage = contentType.startsWith('image/')

      let data
      let displayText
      let blobUrl = null

      if (isJson) {
        data = await res.json()
        displayText = JSON.stringify(data, null, 2)
      } else if (isImage) {
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
        displayText = '[Image Data]'
      } else {
        displayText = await res.text()
      }

      const resHeaders = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        body: displayText,
        time: elapsed,
        headers: resHeaders,
        isJson,
        isHtml,
        isImage,
        blobUrl
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
  }, [baseUrl, endpoint, method, accessToken, params, headers, requestBody, addToHistory, currentEnv, environments])

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <Header 
        onOpenEnv={() => setIsEnvModalOpen(true)}
        onImportCurl={() => setIsImportModalOpen(true)}
        onExportData={exportAllData}
        onImportData={handleImportData}
      />

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
              placeholder="Bearer token or {{token}}"
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
      <Card 
        title="Request"
        headerRight={
          <button 
            onClick={() => setIsSaveModalOpen(true)}
            className="text-[11px] bg-accent/10 text-accent border border-accent/20 rounded-[6px] py-1.5 px-3 cursor-pointer transition-all duration-200 hover:bg-accent hover:text-white"
          >
            Save Request
          </button>
        }
      >
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
      <div className="flex gap-2 mb-4">
        <button
          id="sendBtn"
          onClick={sendRequest}
          disabled={loading}
          className="flex-1 py-3.5 text-sm font-semibold bg-gradient-to-br from-accent to-purple-500 border-none rounded-[10px] text-white cursor-pointer transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_6px_24px_var(--color-accent-glow)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
        >
          {loading && <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin-custom" />}
          <span className={loading ? 'opacity-80' : ''}>
            {loading ? 'Sending...' : 'Send Request'}
          </span>
        </button>
      </div>

      {/* Response */}
      <Card title="Response">
        <ResponseViewer response={response} />
      </Card>

      {/* Sidebar (History & Collections) */}
      <Card>
        <div className="flex items-center justify-between border-b border-border mb-4">
          <Tabs tabs={SIDEBAR_TABS} activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab} />
          {activeSidebarTab === 'history' && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[11px] bg-transparent border border-border rounded-[6px] text-text-muted py-1.5 px-3 mb-4 cursor-pointer transition-all duration-200 hover:border-status-error hover:text-status-error"
            >
              Clear History
            </button>
          )}
        </div>

        {activeSidebarTab === 'history' ? (
          <HistoryList
            history={history}
            onSelect={(idx) => loadSavedRequest(history[idx], idx)}
            onClear={clearHistory}
            activeIndex={activeHistoryIndex}
          />
        ) : (
          <CollectionsList 
            collections={collections}
            onSelect={loadSavedRequest}
            onDelete={handleDeleteCollection}
          />
        )}
      </Card>

      {/* Modals */}
      <EnvironmentModal 
        isOpen={isEnvModalOpen} 
        onClose={() => setIsEnvModalOpen(false)} 
        currentEnv={currentEnv}
        environments={environments}
        onSave={handleSaveEnvironments}
      />

      <SaveRequestModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        defaultMethod={method}
        defaultEndpoint={endpoint}
        onSave={handleSaveCollection}
      />

      <ImportCurlModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={loadSavedRequest}
      />
    </div>
  )
}
