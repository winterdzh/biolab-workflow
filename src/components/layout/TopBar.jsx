import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, Undo2, Redo2, BookOpen, Hash, LayoutGrid, Download, HelpCircle, Eye } from 'lucide-react'
import useWorkflowStore from '../../stores/workflowStore'
import useAppStore from '../../stores/appStore'
import useLibraryStore from '../../stores/libraryStore'
import useVariableStore from '../../stores/variableStore'
import useUiStore from '../../stores/uiStore'
import { applyAutoLayout } from '../../utils/autoLayout'
import LibraryModal from '../library/LibraryModal'
import GlobalVariablesPanel from '../panels/GlobalVariablesPanel'
import HelpModal from '../help/HelpModal'

const Sep = () => <div className="w-px h-5 bg-white/20 mx-1 flex-shrink-0" />

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
  const viewButtonRef = useRef(null)

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

  const handleAutoLayout = () => {
    if (!nodes.length) return
    loadWorkflow({ nodes: applyAutoLayout(nodes, edges), edges, workflowName: wf?.name })
  }

  const _canUndo = canUndo()
  const _canRedo = canRedo()
  const wfVarCount = varStore.variables.length

  const ghost = 'inline-flex items-center gap-1.5 h-8 px-2.5 text-sm rounded-[10px] text-white hover:bg-white/14 transition-colors select-none'
  const outline = 'inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded-[10px] border border-white/25 text-white hover:bg-white/14 transition-colors select-none'
  const iconOutline = 'inline-flex items-center justify-center h-8 w-8 rounded-[10px] border border-white/25 text-white hover:bg-white/14 transition-colors select-none'
  const disabled = 'inline-flex items-center gap-1.5 h-8 px-2.5 text-sm rounded-[10px] text-white/30 cursor-not-allowed select-none'
  const primary = 'inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded-[10px] bg-white text-[#CC0000] font-semibold hover:bg-red-50 transition-colors select-none shadow-sm'

  if (isMobile) {
    return (
      <div className="h-12 flex items-center px-3 gap-2 flex-shrink-0" style={{ background: 'rgba(180,0,0,0.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.15)' }}>
        <button onClick={handleSaveAndBack} className="inline-flex items-center justify-center w-8 h-8 text-white hover:bg-white/14 transition-colors rounded-[10px]">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-white truncate flex-1 tracking-[-0.01em]">{name}</span>
        <span className="text-xs text-white/70 bg-white/12 px-2 py-0.5 rounded-[8px]">View only</span>
        <button onClick={handleAutoLayout} className={iconOutline} title="Auto Layout">
          <LayoutGrid size={14} />
        </button>
        <button onClick={handleExport} className={primary} title="Download workflow JSON">
          <Download size={14} /> Export
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="h-12 flex items-center px-3 gap-1 flex-shrink-0" style={{ background: 'rgba(180,0,0,0.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.15)' }}>
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
          className="h-8 border border-white/25 rounded-[10px] px-2.5 text-sm text-white bg-white/12 placeholder-white/55 focus:outline-none focus:border-white/40 focus:bg-white/16 w-44"
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
          <button ref={viewButtonRef} onClick={() => setShowViewFilter(v => !v)} className={outline}>
            <Eye size={14} /> View
          </button>
          {showViewFilter && viewButtonRef.current && createPortal(
            <>
              <div
                className="fixed inset-0"
                style={{ zIndex: 70 }}
                onClick={() => setShowViewFilter(false)}
              />
              <div
                className="fixed border border-black/5 rounded-[12px] shadow-xl p-2"
                style={{
                  width: 210,
                  top: viewButtonRef.current.getBoundingClientRect().bottom + 6,
                  left: Math.max(8, viewButtonRef.current.getBoundingClientRect().right - 210),
                  zIndex: 80,
                  background: 'rgba(250,250,252,0.92)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                }}
              >
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
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleFlow(key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleFlow(key)
                        }
                      }}
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
                      <svg width="22" height="10" className="flex-shrink-0" style={{ opacity: checked ? 1 : 0.3 }}>
                        <line x1="0" y1="5" x2="16" y2="5" stroke={color} strokeWidth="2.5"
                          strokeDasharray={key === 'data' ? '4 2' : undefined} strokeLinecap="round" />
                        <polyline points="12,2 16,5 12,8" fill="none"
                          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: checked ? '#374151' : '#9ca3af' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </>,
            document.body,
          )}
        </div>
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


