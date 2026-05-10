import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, Undo2, Redo2, BookOpen, Hash, LayoutGrid, Download, HelpCircle, Eye, Link } from 'lucide-react'
import { encodeWorkflowForURL } from '../../utils/importExport'
import useWorkflowStore from '../../stores/workflowStore'
import useAppStore from '../../stores/appStore'
import useLibraryStore from '../../stores/libraryStore'
import useVariableStore from '../../stores/variableStore'
import useUiStore from '../../stores/uiStore'
import { applyAutoLayout } from '../../utils/autoLayout'
import LibraryModal from '../library/LibraryModal'
import GlobalVariablesPanel from '../panels/GlobalVariablesPanel'
import HelpModal from '../help/HelpModal'

const Sep = () => <div className="w-px h-5 bg-white/25 mx-0.5 flex-shrink-0" />

const FLOW_FILTERS = [
  { key: 'workflow', label: 'Workflow',    color: '#64748b' },
  { key: 'sample',   label: 'Sample',      color: '#3b82f6' },
  { key: 'reagent',  label: 'Reagent',     color: '#8b5cf6' },
  { key: 'labware',  label: 'Labware',     color: '#06b6d4' },
  { key: 'data',     label: 'Data / Info', color: '#009688' },
]

export default function TopBar({ workflowId, isMobile = false }) {
  const { nodes, edges, undo, redo, canUndo, canRedo, loadWorkflow } = useWorkflowStore()
  const appStore = useAppStore()
  const libraryStore = useLibraryStore()
  const varStore = useVariableStore()
  const { visibleFlows, toggleFlow, setAllFlows } = useUiStore()
  const wf = appStore.workflows.find((w) => w.id === workflowId)

  const [name, setName] = useState(wf?.name ?? '')
  const [showLibrary, setShowLibrary] = useState(false)
  const [showWfVars, setShowWfVars] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showViewFilter, setShowViewFilter] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setName(wf?.name ?? '') }, [wf?.name])

  const handleNameBlur = () => appStore.updateWorkflowMeta(workflowId, { name })

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
  }, [undo, redo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleSaveAndBack = () => {
    appStore.saveWorkflow(workflowId, { nodes, edges, variables: varStore.variables })
    appStore.goToCover()
  }

  const handleExport = () => {
    const json = appStore.exportWorkflowJSON(workflowId, libraryStore)
    if (!json) return
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(wf?.name ?? 'workflow').replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    const json = appStore.exportWorkflowJSON(workflowId, libraryStore)
    if (!json) return
    const encoded = encodeWorkflowForURL(json)
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?wf=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleAutoLayout = () => {
    if (!nodes.length) return
    loadWorkflow({ nodes: applyAutoLayout(nodes, edges), edges, workflowName: wf?.name })
  }

  const _canUndo = canUndo()
  const _canRedo = canRedo()
  const wfVarCount = varStore.variables.length

  const ghost = 'inline-flex items-center gap-1.5 h-8 px-2.5 text-sm rounded text-white hover:bg-white/15 transition-colors select-none'
  const outline = 'inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-white/35 text-white hover:bg-white/15 transition-colors select-none'
  const disabled = 'inline-flex items-center gap-1.5 h-8 px-2.5 text-sm rounded text-white/30 cursor-not-allowed select-none'
  const primary = 'inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded bg-white text-[#CC0000] font-semibold hover:bg-red-50 transition-colors select-none'

  if (isMobile) {
    return (
      <div className="h-12 bg-[#CC0000] flex items-center px-3 gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <button onClick={handleSaveAndBack} className="inline-flex items-center justify-center w-8 h-8 text-white hover:bg-white/15 transition-colors rounded">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-white truncate flex-1">{name}</span>
        <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-sm">View only</span>
        <button onClick={handleShare} className={copied ? primary : outline} title="Copy share link">
          <Link size={14} /> {copied ? 'Copied!' : 'Share'}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="h-12 bg-[#CC0000] flex items-center px-3 gap-1 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <button onClick={handleSaveAndBack} className={ghost}>
          <ChevronLeft size={16} /> Back
        </button>
        <Sep />
        <button onClick={undo} disabled={!_canUndo} title="Undo (Ctrl+Z)" className={_canUndo ? ghost : disabled}>
          <Undo2 size={16} strokeWidth={2.5} />
        </button>
        <button onClick={redo} disabled={!_canRedo} title="Redo (Ctrl+Y)" className={_canRedo ? ghost : disabled}>
          <Redo2 size={16} strokeWidth={2.5} />
        </button>
        <Sep />
        <input
          value={name} onChange={(e) => setName(e.target.value)} onBlur={handleNameBlur}
          className="h-8 border border-white/30 rounded px-2.5 text-sm text-white bg-white/10 placeholder-white/50 focus:outline-none focus:border-white focus:bg-white/20 w-44"
          placeholder="Workflow name..."
        />
        <div className="flex-1" />
        <button onClick={() => setShowWfVars(true)} className={outline}>
          <Hash size={14} /> Workflow Vars
          {wfVarCount > 0 && (
            <span className="bg-white text-[#CC0000] text-xs px-1.5 rounded-sm font-semibold leading-4">{wfVarCount}</span>
          )}
        </button>
        <button onClick={() => setShowLibrary(true)} className={outline}>
          <BookOpen size={14} /> Library
        </button>
        <button onClick={handleAutoLayout} className={outline}>
          <LayoutGrid size={14} /> Auto Layout
        </button>
        {/* View filter dropdown */}
        <div className="relative">
          <button onClick={() => setShowViewFilter(v => !v)} className={outline}>
            <Eye size={14} /> View
          </button>
          {showViewFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowViewFilter(false)} />
              <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2" style={{ width: 210 }}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Show Flows</span>
                  <div className="flex gap-2">
                    <button onClick={() => setAllFlows(true)} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">All</button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => setAllFlows(false)} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">None</button>
                  </div>
                </div>
                {FLOW_FILTERS.map(({ key, label, color }) => {
                  const checked = visibleFlows[key]
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: 4 }}
                    >
                      <div
                        className="flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: checked ? color : '#d1d5db', backgroundColor: checked ? color : 'white', borderRadius: 3 }}
                      >
                        {checked && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleFlow(key)} />
                      <svg width="22" height="10" className="flex-shrink-0" style={{ opacity: checked ? 1 : 0.3 }}>
                        <line x1="0" y1="5" x2="16" y2="5" stroke={color} strokeWidth="2.5"
                          strokeDasharray={key === 'data' ? '4 2' : undefined} strokeLinecap="round" />
                        <polyline points="12,2 16,5 12,8" fill="none"
                          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: checked ? '#374151' : '#9ca3af' }}>{label}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>
        <button onClick={handleShare} className={copied ? primary : outline} title="Copy share link">
          <Link size={14} /> {copied ? 'Copied!' : 'Share'}
        </button>
        <button onClick={handleExport} className={primary}>
          <Download size={14} /> Export
        </button>
        <Sep />
        <button onClick={() => setShowHelp(true)} title="Help & Reference" className={ghost}>
          <HelpCircle size={16} />
        </button>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showWfVars && <GlobalVariablesPanel scope="workflow" onClose={() => setShowWfVars(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}


