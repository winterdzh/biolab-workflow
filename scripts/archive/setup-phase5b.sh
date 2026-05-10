#!/bin/bash
set -e
echo "Phase 5b: Fix drag-drop + rebrand to red theme..."

# ── CoverPage: remove global drag, add upload card slot ─────────────────────
cat > src/pages/CoverPage.jsx << 'ENDOFFILE'
import { useState, useRef, useCallback } from 'react'
import useAppStore from '../stores/appStore'
import useLibraryStore from '../stores/libraryStore'
import LibraryModal from '../components/library/LibraryModal'
import GlobalVariablesPanel from '../components/panels/GlobalVariablesPanel'

function UploadCard({ onFile }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }
  const onDragLeave = (e) => { e.stopPropagation(); setDragOver(false) }
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }
  const onClick = () => inputRef.current?.click()
  const onInputChange = (e) => { const f = e.target.files[0]; if (f) onFile(f) }

  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onClick}
      className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[148px] select-none ${
        dragOver
          ? 'border-red-400 bg-red-50'
          : 'border-gray-300 bg-gray-50 hover:border-red-300 hover:bg-red-50/40'
      }`}
    >
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={onInputChange} />
      <div className={`text-3xl mb-2 transition-transform ${dragOver ? 'scale-125' : ''}`}>⬇</div>
      <div className="text-sm font-medium text-gray-500">Import Workflow</div>
      <div className="text-xs text-gray-400 mt-1">Drop or click to upload <span className="font-mono">.json</span></div>
    </div>
  )
}

function WorkflowCard({ wf, onOpen, onDuplicate, onDelete, onExport }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const date = new Date(wf.modifiedAt).toLocaleDateString()
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-red-300 transition-all group cursor-pointer relative flex flex-col gap-3"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-xl">🧬</div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{wf.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">Modified {date}</div>
          </div>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg leading-none"
          >⋯</button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-40 overflow-hidden py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button onClick={() => { onOpen(); setMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Open</button>
              <button onClick={() => { onExport(); setMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export JSON</button>
              <button onClick={() => { onDuplicate(); setMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Duplicate</button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Delete</button>
            </div>
          )}
        </div>
      </div>
      {wf.description && <div className="text-xs text-gray-500 line-clamp-2">{wf.description}</div>}
      <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
        <span>📋 {wf.nodes?.length ?? 0} nodes</span>
        <span>🔗 {wf.edges?.length ?? 0} connections</span>
        {wf.variables?.length > 0 && <span>$ {wf.variables.length} vars</span>}
      </div>
    </div>
  )
}

function NewWorkflowModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="font-bold text-gray-800">New Workflow</h2>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cell Seeding Protocol"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Brief description of this workflow..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={() => name.trim() && onCreate(name.trim(), desc)} disabled={!name.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${name.trim() ? 'bg-[#CC0000] text-white hover:bg-red-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            Create
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function CoverPage() {
  const appStore = useAppStore()
  const libraryStore = useLibraryStore()
  const [showLibrary, setShowLibrary] = useState(false)
  const [showGlobalVars, setShowGlobalVars] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = appStore.workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (name, desc) => {
    const id = appStore.createWorkflow(name, desc)
    appStore.openWorkflow(id)
    setShowNewModal(false)
  }

  const handleExport = (wfId) => {
    const json = appStore.exportWorkflowJSON(wfId, libraryStore)
    if (!json) return
    const wf = appStore.workflows.find((w) => w.id === wfId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(wf?.name ?? 'workflow').replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    const json = appStore.exportAllJSON(libraryStore)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `biolab_export_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportAll = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => appStore.importAllJSON(ev.target.result, libraryStore)
      reader.readAsText(file)
    }
    input.click()
  }

  const processFile = useCallback((file) => {
    if (!file?.name.endsWith('.json')) { alert('Please select a .json workflow file'); return }
    const reader = new FileReader()
    reader.onload = (ev) => appStore.importWorkflowJSON(ev.target.result)
    reader.readAsText(file)
  }, [appStore])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#CC0000] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧬</span>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">BioLab Workflow Designer</h1>
              <p className="text-xs text-red-200">Lab automation workflow builder</p>
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowGlobalVars(true)}
            className="flex items-center gap-2 px-3 py-2 border border-red-400 rounded-lg text-sm text-white hover:bg-red-700 transition-colors">
            <span className="font-mono font-bold text-xs">$x</span>
            Global Variables
            {appStore.globalVariables.length > 0 && (
              <span className="bg-white text-[#CC0000] text-xs px-1.5 rounded-full font-semibold">{appStore.globalVariables.length}</span>
            )}
          </button>
          <button onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-3 py-2 border border-red-400 rounded-lg text-sm text-white hover:bg-red-700 transition-colors">
            📚 Library
          </button>
          <div className="w-px h-6 bg-red-400" />
          <button onClick={handleImportAll}
            className="px-3 py-2 border border-red-400 rounded-lg text-sm text-white hover:bg-red-700 transition-colors">
            Import
          </button>
          <button onClick={handleExportAll}
            className="px-3 py-2 bg-white text-[#CC0000] rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="flex-1 max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
          <div className="flex-1" />
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white rounded-xl text-sm font-medium hover:bg-red-800 transition-colors shadow-sm">
            + New Workflow
          </button>
        </div>

        {/* Grid — upload card always first */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <UploadCard onFile={processFile} />
          {filtered.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf}
              onOpen={() => appStore.openWorkflow(wf.id)}
              onDuplicate={() => appStore.duplicateWorkflow(wf.id)}
              onDelete={() => { if (confirm(`Delete "${wf.name}"?`)) appStore.deleteWorkflow(wf.id) }}
              onExport={() => handleExport(wf.id)} />
          ))}
          {filtered.length === 0 && !search && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300 col-span-2">
              <div className="text-4xl mb-3">🧬</div>
              <div className="text-sm">No workflows yet. Create one or import a JSON file.</div>
            </div>
          )}
        </div>
      </div>

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showGlobalVars && <GlobalVariablesPanel scope="global" onClose={() => setShowGlobalVars(false)} />}
      {showNewModal && <NewWorkflowModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
    </div>
  )
}
ENDOFFILE

# ── TopBar: red theme ────────────────────────────────────────────────────────
cat > src/components/layout/TopBar.jsx << 'ENDOFFILE'
import { useState, useEffect, useCallback } from 'react'
import useWorkflowStore from '../../stores/workflowStore'
import useAppStore from '../../stores/appStore'
import useLibraryStore from '../../stores/libraryStore'
import useVariableStore from '../../stores/variableStore'
import { applyAutoLayout } from '../../utils/autoLayout'
import LibraryModal from '../library/LibraryModal'
import GlobalVariablesPanel from '../panels/GlobalVariablesPanel'

export default function TopBar({ workflowId }) {
  const { nodes, edges, undo, redo, canUndo, canRedo, loadWorkflow } = useWorkflowStore()
  const appStore = useAppStore()
  const libraryStore = useLibraryStore()
  const varStore = useVariableStore()
  const wf = appStore.workflows.find((w) => w.id === workflowId)

  const [name, setName] = useState(wf?.name ?? '')
  const [showLibrary, setShowLibrary] = useState(false)
  const [showWfVars, setShowWfVars] = useState(false)

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

  return (
    <>
      <div className="h-14 bg-[#CC0000] flex items-center px-4 gap-2 shadow-sm flex-shrink-0">
        <button onClick={handleSaveAndBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-white hover:bg-red-700 rounded-lg transition-colors">
          ← Back
        </button>
        <div className="w-px h-6 bg-red-400 mx-1" />
        <button onClick={undo} disabled={!_canUndo} title="Undo (Ctrl+Z)"
          className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${_canUndo ? 'border-red-400 text-white hover:bg-red-700' : 'border-red-800 text-red-600 cursor-not-allowed'}`}>↩</button>
        <button onClick={redo} disabled={!_canRedo} title="Redo (Ctrl+Y)"
          className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${_canRedo ? 'border-red-400 text-white hover:bg-red-700' : 'border-red-800 text-red-600 cursor-not-allowed'}`}>↪</button>
        <div className="w-px h-6 bg-red-400 mx-1" />
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleNameBlur}
          className="border border-red-400 rounded-md px-2.5 py-1 text-sm text-white bg-red-700/40 placeholder-red-300 focus:outline-none focus:border-white focus:bg-red-700 w-44"
          placeholder="Workflow name..." />
        <div className="flex-1" />
        <button onClick={() => setShowWfVars(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-400 text-white rounded-md hover:bg-red-700 transition-colors">
          <span className="font-mono font-bold text-xs">$</span> Workflow Vars
          {wfVarCount > 0 && <span className="bg-white text-[#CC0000] text-xs px-1.5 rounded-full font-semibold">{wfVarCount}</span>}
        </button>
        <button onClick={() => setShowLibrary(true)}
          className="px-3 py-1.5 text-sm border border-red-400 text-white rounded-md hover:bg-red-700 transition-colors">
          📚 Library
        </button>
        <button onClick={handleAutoLayout}
          className="px-2.5 py-1.5 text-xs border border-red-400 text-white rounded-md hover:bg-red-700 transition-colors">
          Auto Layout
        </button>
        <button onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-white text-[#CC0000] rounded-md hover:bg-red-50 transition-colors font-semibold">
          Export
        </button>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showWfVars && <GlobalVariablesPanel scope="workflow" onClose={() => setShowWfVars(false)} />}
    </>
  )
}
ENDOFFILE

# ── 节点颜色 + 常量更新 ──────────────────────────────────────────────────────
cat > src/constants/nodeTypes.js << 'ENDOFFILE'
export const NODE_TYPES = {
  START: 'startNode',
  END: 'endNode',
  OPERATION: 'operationNode',
  IF_ELSE: 'ifElseNode',
  LOOP: 'loopNode',
  WAIT_UNTIL: 'waitUntilNode',
  SET_VARIABLE: 'setVariableNode',
}

export const ELEMENT_PALETTE = [
  { type: 'startNode',       label: 'Start',        description: 'Workflow entry point',    color: '#99BB44', icon: '▶' },
  { type: 'endNode',         label: 'End',           description: 'Workflow exit point',     color: '#CC0000', icon: '⏹' },
  { type: 'operationNode',   label: 'Operation',     description: 'Lab operation step',      color: '#FF9933', icon: '⚙' },
  { type: 'ifElseNode',      label: 'If / Else',     description: 'Conditional branch',      color: '#CCCC66', icon: '◇' },
  { type: 'loopNode',        label: 'Loop',          description: 'Repeat steps',            color: '#CC99CC', icon: '↻' },
  { type: 'waitUntilNode',   label: 'Wait Until',    description: 'Wait for condition',      color: '#66CCFF', icon: '⏳' },
  { type: 'setVariableNode', label: 'Set Variable',  description: 'Assign a variable',       color: '#336699', icon: '$' },
]
ENDOFFILE

cat > src/constants/edgeTypes.js << 'ENDOFFILE'
export const EDGE_TYPES = {
  SAMPLE_FLOW: 'sampleFlow',
  MATERIAL_FLOW: 'materialFlow',
  INFO_FLOW: 'infoFlow',
}

export const EDGE_PALETTE = [
  { type: 'sampleFlow',   label: 'Sample Flow',   description: 'Biological sample movement',   color: '#336699', dashed: false },
  { type: 'materialFlow', label: 'Material Flow', description: 'Consumable / reagent movement', color: '#FF6600', dashed: false },
  { type: 'infoFlow',     label: 'Info Flow',     description: 'Data / instruction transfer',   color: '#666666', dashed: true  },
]
ENDOFFILE

# ── 节点组件配色更新 ─────────────────────────────────────────────────────────
cat > src/components/nodes/StartNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
export default function StartNode({ data, selected }) {
  return (
    <div className={`flex items-center justify-center w-20 h-20 rounded-full border-2 shadow-md transition-all ${selected ? 'ring-2 ring-white' : ''}`}
      style={{ borderColor: '#99BB44', backgroundColor: selected ? '#7a9935' : '#e8f5d0' }}>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: '#99BB44' }} />
      <div className="text-center pointer-events-none">
        <div className="text-lg" style={{ color: '#99BB44' }}>▶</div>
        <div className="font-semibold text-xs" style={{ color: '#556622' }}>{data.label}</div>
      </div>
    </div>
  )
}
ENDOFFILE

cat > src/components/nodes/EndNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
export default function EndNode({ data, selected }) {
  return (
    <div className={`flex items-center justify-center w-20 h-20 rounded-full border-2 shadow-md transition-all ${selected ? 'ring-2 ring-white' : ''}`}
      style={{ borderColor: '#CC0000', backgroundColor: selected ? '#aa0000' : '#fde8e8' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: '#CC0000' }} />
      <div className="text-center pointer-events-none">
        <div className="text-lg" style={{ color: '#CC0000' }}>⏹</div>
        <div className="font-semibold text-xs" style={{ color: '#880000' }}>{data.label}</div>
      </div>
    </div>
  )
}
ENDOFFILE

cat > src/components/nodes/OperationNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
const C = '#FF9933'
export default function OperationNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-48 transition-all ${selected ? 'ring-2 ring-orange-200' : ''}`}
      style={{ borderColor: selected ? C : '#ffb84d' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 rounded-t-xl flex items-center gap-2 border-b" style={{ backgroundColor: '#fff4e6', borderColor: '#ffe0b2' }}>
        <span style={{ color: C }}>⚙</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2 space-y-1">
        {data.device ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><span>🔧</span><span className="font-medium">{data.device.name}</span></div>
          : <div className="text-xs text-gray-400 italic">No device</div>}
        {data.sample ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><span>🧬</span><span>{data.sample.name}</span></div>
          : <div className="text-xs text-gray-400 italic">No sample</div>}
        {data.description && <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">{data.description}</div>}
        {(data.duration?.value ?? 0) > 0 && <div className="text-xs text-gray-400">⏱ {data.duration.value} {data.duration.unit}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
ENDOFFILE

cat > src/components/nodes/IfElseNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
const C = '#CCCC66'
export default function IfElseNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${selected ? 'ring-2 ring-yellow-200' : ''}`}
      style={{ borderColor: selected ? C : '#dddd88' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 rounded-t-xl flex items-center gap-2 border-b" style={{ backgroundColor: '#fafae8', borderColor: '#ebebaa' }}>
        <span className="font-bold text-sm" style={{ color: C }}>◇</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.condition ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">{data.condition}</div>
          : <div className="text-xs text-gray-400 italic">No condition set</div>}
        <div className="flex justify-between mt-2 text-xs">
          <span className="font-medium" style={{ color: '#99BB44' }}>✓ {data.trueLabel || 'Yes'}</span>
          <span className="font-medium" style={{ color: '#CC0000' }}>✗ {data.falseLabel || 'No'}</span>
        </div>
      </div>
      <Handle id="true" type="source" position={Position.Bottom} style={{ left: '28%', backgroundColor: '#99BB44' }} className="!w-3 !h-3 !border-2 !border-white" />
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: '72%', backgroundColor: '#CC0000' }} className="!w-3 !h-3 !border-2 !border-white" />
    </div>
  )
}
ENDOFFILE

cat > src/components/nodes/LoopNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
const C = '#CC99CC'
export default function LoopNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${selected ? 'ring-2 ring-purple-200' : ''}`}
      style={{ borderColor: selected ? C : '#ddb8dd' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 rounded-t-xl flex items-center gap-2 border-b" style={{ backgroundColor: '#f9f0f9', borderColor: '#eebbee' }}>
        <span style={{ color: C }}>↻</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.loopType === 'condition'
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">{data.condition || 'No condition'}</div>
          : <div className="text-xs text-gray-600">Repeat <span className="font-bold" style={{ color: C }}>{data.count ?? 1}</span> times</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
      <Handle id="loop" type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: '#ddbbdd' }} />
    </div>
  )
}
ENDOFFILE

cat > src/components/nodes/WaitUntilNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
const C = '#66CCFF'
export default function WaitUntilNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${selected ? 'ring-2 ring-sky-200' : ''}`}
      style={{ borderColor: selected ? C : '#99ddff' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 rounded-t-xl flex items-center gap-2 border-b" style={{ backgroundColor: '#eef8ff', borderColor: '#bbebff' }}>
        <span style={{ color: C }}>⏳</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.condition ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">{data.condition}</div>
          : <div className="text-xs text-gray-400 italic">No condition set</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
ENDOFFILE

cat > src/components/nodes/SetVariableNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
import useVariableStore from '../../stores/variableStore'
const C = '#336699'
export default function SetVariableNode({ data, selected }) {
  const variables = useVariableStore((s) => s.variables)
  const matchedVar = variables.find((v) => v.name === data.variableName)
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${selected ? 'ring-2 ring-blue-200' : ''}`}
      style={{ borderColor: selected ? C : '#5588bb' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 rounded-t-xl flex items-center gap-2 border-b" style={{ backgroundColor: '#eef2f8', borderColor: '#bbccdd' }}>
        <span className="font-mono font-bold text-sm" style={{ color: C }}>$</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.variableName ? (
          <div className="text-xs text-gray-600">
            <span className={`font-mono font-medium ${matchedVar ? '' : 'text-orange-500'}`} style={matchedVar ? { color: C } : {}}>
              {data.variableName}
            </span>
            {data.expression && <span className="text-gray-400"> = {data.expression}</span>}
            {!matchedVar && data.variableName && <div className="text-orange-400 text-xs mt-0.5">⚠ Not in workflow vars</div>}
          </div>
        ) : <div className="text-xs text-gray-400 italic">No variable set</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
ENDOFFILE

# ── 箭头配色更新 ─────────────────────────────────────────────────────────────
cat > src/components/edges/SampleFlowEdge.jsx << 'ENDOFFILE'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
export default function SampleFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, selected }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#336699', strokeWidth: selected ? 2.5 : 2 }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, backgroundColor: '#eef2f8', color: '#336699', border: '1px solid #bbccdd' }}
            className="text-xs px-1.5 py-0.5 rounded pointer-events-none">{data.label}</div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
ENDOFFILE

cat > src/components/edges/MaterialFlowEdge.jsx << 'ENDOFFILE'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
export default function MaterialFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, selected }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#FF6600', strokeWidth: selected ? 2.5 : 2 }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, backgroundColor: '#fff3e8', color: '#FF6600', border: '1px solid #ffccaa' }}
            className="text-xs px-1.5 py-0.5 rounded pointer-events-none">{data.label}</div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
ENDOFFILE

cat > src/components/edges/InfoFlowEdge.jsx << 'ENDOFFILE'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
export default function InfoFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, selected }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#666666', strokeWidth: selected ? 2.5 : 2, strokeDasharray: '6 3' }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, backgroundColor: '#f5f5f5', color: '#666666', border: '1px solid #cccccc' }}
            className="text-xs px-1.5 py-0.5 rounded pointer-events-none">{data.label}</div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
ENDOFFILE

# ── Canvas minimap color update ──────────────────────────────────────────────
cat > src/components/canvas/WorkflowCanvas.jsx << 'ENDOFFILE'
import { useCallback, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import nodeTypes from '../nodes'
import edgeTypes from '../edges'
import { createNode } from '../../utils/nodeFactory'

const NODE_COLORS = {
  startNode: '#99BB44', endNode: '#CC0000', operationNode: '#FF9933',
  ifElseNode: '#CCCC66', loopNode: '#CC99CC', waitUntilNode: '#66CCFF', setVariableNode: '#336699',
}

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef(null)
  const [rfInstance, setRfInstance] = useState(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useWorkflowStore()
  const { setSelectedNodeId, setSelectedEdgeId, activeEdgeType } = useUiStore()

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])
  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow')
    if (!type || !rfInstance) return
    addNode(createNode(type, rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })))
  }, [rfInstance, addNode])

  const handleConnect = useCallback(
    (connection) => onConnect({ ...connection, type: activeEdgeType }),
    [onConnect, activeEdgeType]
  )
  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), [setSelectedNodeId])
  const onEdgeClick = useCallback((_, edge) => setSelectedEdgeId(edge.id), [setSelectedEdgeId])
  const onPaneClick = useCallback(() => { setSelectedNodeId(null); setSelectedEdgeId(null) }, [setSelectedNodeId, setSelectedEdgeId])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={handleConnect} onInit={setRfInstance}
        onDrop={onDrop} onDragOver={onDragOver}
        onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        fitView deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap nodeColor={(n) => NODE_COLORS[n.type] ?? '#999999'} maskColor="rgba(240,240,240,0.6)" />
      </ReactFlow>
    </div>
  )
}
ENDOFFILE

echo ""
echo "✅ Phase 5b complete! Run: npm run dev"