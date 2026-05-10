#!/bin/bash
set -e
echo "Phase 5: Cover Page + Multi-workflow + Variable scoping..."

mkdir -p src/pages src/components/cover

# ── src/stores/appStore.js ───────────────────────────────────────────────────
# 顶层 store：管理多个 workflow + 全局变量 + 当前激活 workflow
cat > src/stores/appStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

function makeWorkflow(name = 'New Workflow') {
  return {
    id: uuidv4(),
    name,
    description: '',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    variables: [],   // workflow-scoped variables only
    tags: [],
  }
}

const useAppStore = create((set, get) => ({
  // ── Global variables (cross-workflow)
  globalVariables: [
    { id: 'gv1', name: 'projectName', type: 'string', value: 'My Project', description: 'Project identifier' },
    { id: 'gv2', name: 'operator', type: 'string', value: '', description: 'Operator name' },
  ],

  // ── Workflow list
  workflows: [makeWorkflow('Plasmid Transfection'), makeWorkflow('Cell Seeding')],
  activeWorkflowId: null,   // null = cover page

  // ── Global variable CRUD
  addGlobalVariable: (v) =>
    set({ globalVariables: [...get().globalVariables, { ...v, id: uuidv4() }] }),
  updateGlobalVariable: (id, patch) =>
    set({ globalVariables: get().globalVariables.map((v) => v.id === id ? { ...v, ...patch } : v) }),
  deleteGlobalVariable: (id) =>
    set({ globalVariables: get().globalVariables.filter((v) => v.id !== id) }),
  setGlobalVariables: (globalVariables) => set({ globalVariables }),

  // ── Workflow CRUD
  createWorkflow: (name, description = '') => {
    const wf = { ...makeWorkflow(name), description }
    set({ workflows: [...get().workflows, wf] })
    return wf.id
  },

  duplicateWorkflow: (id) => {
    const src = get().workflows.find((w) => w.id === id)
    if (!src) return
    const copy = { ...JSON.parse(JSON.stringify(src)), id: uuidv4(), name: src.name + ' (copy)', createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString() }
    set({ workflows: [...get().workflows, copy] })
  },

  deleteWorkflow: (id) =>
    set({ workflows: get().workflows.filter((w) => w.id !== id), activeWorkflowId: get().activeWorkflowId === id ? null : get().activeWorkflowId }),

  updateWorkflowMeta: (id, patch) =>
    set({ workflows: get().workflows.map((w) => w.id === id ? { ...w, ...patch, modifiedAt: new Date().toISOString() } : w) }),

  // ── Save current editor state back into the workflow list
  saveWorkflow: (id, { nodes, edges, variables }) =>
    set({
      workflows: get().workflows.map((w) =>
        w.id === id ? { ...w, nodes, edges, variables, modifiedAt: new Date().toISOString() } : w
      ),
    }),

  // ── Navigation
  openWorkflow: (id) => set({ activeWorkflowId: id }),
  goToCover: () => set({ activeWorkflowId: null }),

  // ── Import a workflow JSON (adds as new or replaces by id)
  importWorkflowJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (!data.nodes || !data.edges) throw new Error('Missing nodes/edges')
      const existing = get().workflows.find((w) => w.id === data.id)
      if (existing) {
        set({ workflows: get().workflows.map((w) => w.id === data.id ? { ...w, ...data } : w) })
      } else {
        const wf = {
          id: data.id ?? uuidv4(),
          name: data.metadata?.name ?? 'Imported Workflow',
          description: data.metadata?.description ?? '',
          createdAt: data.metadata?.createdAt ?? new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          nodes: data.nodes,
          edges: data.edges,
          variables: data.workflowVariables ?? [],
          tags: data.metadata?.tags ?? [],
        }
        set({ workflows: [...get().workflows, wf] })
      }
      return true
    } catch (e) {
      alert('Invalid workflow JSON: ' + e.message)
      return false
    }
  },

  // ── Export single workflow JSON (only used nodes' library items)
  exportWorkflowJSON: (id, libraryStore) => {
    const wf = get().workflows.find((w) => w.id === id)
    if (!wf) return null
    // Collect library IDs referenced in nodes
    const deviceIds = new Set()
    const sampleIds = new Set()
    wf.nodes.forEach((n) => {
      if (n.data?.device?.id) deviceIds.add(n.data.device.id)
      if (n.data?.sample?.id) sampleIds.add(n.data.sample.id)
    })
    const payload = {
      version: '1.0',
      id: wf.id,
      metadata: { name: wf.name, description: wf.description, createdAt: wf.createdAt, modifiedAt: wf.modifiedAt, tags: wf.tags },
      nodes: wf.nodes,
      edges: wf.edges,
      workflowVariables: wf.variables,
      librarySnapshot: {
        devices: libraryStore.devices.filter((d) => deviceIds.has(d.id)),
        samples: libraryStore.samples.filter((s) => sampleIds.has(s.id)),
        consumables: [],
        reagents: [],
      },
    }
    return JSON.stringify(payload, null, 2)
  },

  // ── Export all workflows + full library + global vars
  exportAllJSON: (libraryStore) => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      globalVariables: get().globalVariables,
      workflows: get().workflows,
      library: {
        samples: libraryStore.samples,
        consumables: libraryStore.consumables,
        reagents: libraryStore.reagents,
        devices: libraryStore.devices,
      },
    }
    return JSON.stringify(payload, null, 2)
  },

  importAllJSON: (jsonString, libraryStore) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.globalVariables) set({ globalVariables: data.globalVariables })
      if (data.workflows) set({ workflows: data.workflows })
      if (data.library) {
        libraryStore.setSamples(data.library.samples ?? [])
        libraryStore.setConsumables(data.library.consumables ?? [])
        libraryStore.setReagents(data.library.reagents ?? [])
        libraryStore.setDevices(data.library.devices ?? [])
      }
      return true
    } catch (e) {
      alert('Invalid export JSON: ' + e.message)
      return false
    }
  },
}))

export default useAppStore
ENDOFFILE

# ── libraryStore: add bulk setters for importAll ─────────────────────────────
cat > src/stores/libraryStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import defaultSamples from '../data/defaultLibraries/samples.json'
import defaultConsumables from '../data/defaultLibraries/consumables.json'
import defaultReagents from '../data/defaultLibraries/reagents.json'
import defaultDevices from '../data/defaultLibraries/devices.json'

const useLibraryStore = create((set, get) => ({
  samples: defaultSamples,
  consumables: defaultConsumables,
  reagents: defaultReagents,
  devices: defaultDevices,

  setSamples: (samples) => set({ samples }),
  setConsumables: (consumables) => set({ consumables }),
  setReagents: (reagents) => set({ reagents }),
  setDevices: (devices) => set({ devices }),

  addItem: (category, item) =>
    set({ [category]: [...get()[category], { ...item, id: uuidv4() }] }),
  updateItem: (category, id, patch) =>
    set({ [category]: get()[category].map((x) => x.id === id ? { ...x, ...patch } : x) }),
  deleteItem: (category, id) =>
    set({ [category]: get()[category].filter((x) => x.id !== id) }),

  exportLibraryJSON: (category) => JSON.stringify(get()[category], null, 2),
  importLibraryJSON: (category, jsonString) => {
    try {
      const items = JSON.parse(jsonString)
      if (!Array.isArray(items)) throw new Error()
      set({ [category]: items.map((x) => ({ ...x, id: x.id ?? uuidv4() })) })
      return true
    } catch { alert('Invalid JSON format'); return false }
  },
  importLibraryCSV: (category, csvString) => {
    try {
      const lines = csvString.trim().split('\n')
      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
      const items = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))
        const obj = { id: uuidv4() }
        headers.forEach((h, i) => { if (h && h !== 'id') obj[h] = values[i] ?? '' })
        return obj
      })
      set({ [category]: [...get()[category], ...items] })
      return true
    } catch { alert('Invalid CSV format'); return false }
  },
}))

export default useLibraryStore
ENDOFFILE

# ── variableStore: now only used for workflow-scoped vars in editor ───────────
# (global vars moved to appStore; variableStore wraps the active workflow's vars)
cat > src/stores/variableStore.js << 'ENDOFFILE'
// Thin wrapper — actual storage is inside each workflow in appStore.
// The editor uses this for convenient reactive access to the active workflow's variables.
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export const VAR_TYPES = ['number', 'string', 'boolean', 'list']

const useVariableStore = create((set, get) => ({
  variables: [],   // workflow-scoped variables (loaded when opening a workflow)

  setVariables: (variables) => set({ variables }),

  addVariable: (v) => set({ variables: [...get().variables, { ...v, id: uuidv4() }] }),
  updateVariable: (id, patch) =>
    set({ variables: get().variables.map((v) => v.id === id ? { ...v, ...patch } : v) }),
  deleteVariable: (id) =>
    set({ variables: get().variables.filter((v) => v.id !== id) }),
}))

export default useVariableStore
ENDOFFILE

# ── src/pages/CoverPage.jsx ──────────────────────────────────────────────────
cat > src/pages/CoverPage.jsx << 'ENDOFFILE'
import { useState, useRef, useCallback } from 'react'
import useAppStore from '../stores/appStore'
import useLibraryStore from '../stores/libraryStore'
import LibraryModal from '../components/library/LibraryModal'
import GlobalVariablesPanel from '../components/panels/GlobalVariablesPanel'

function WorkflowCard({ wf, onOpen, onDuplicate, onDelete, onExport }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const date = new Date(wf.modifiedAt).toLocaleDateString()
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer relative flex flex-col gap-3"
      onClick={onOpen}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">🧬</div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{wf.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">Modified {date}</div>
          </div>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg leading-none">⋯</button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-40 overflow-hidden py-1"
              onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { onOpen(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Open</button>
              <button onClick={() => { onExport(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export JSON</button>
              <button onClick={() => { onDuplicate(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Duplicate</button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Delete</button>
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
            <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cell Seeding Protocol"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Brief description of this workflow..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={() => name.trim() && onCreate(name.trim(), desc)}
            disabled={!name.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${name.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            Create
          </button>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
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
  const [dragOver, setDragOver] = useState(false)
  const dropRef = useRef(null)

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

  const processDroppedFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.json')) { alert('Please drop a .json workflow file'); return }
    const reader = new FileReader()
    reader.onload = (ev) => appStore.importWorkflowJSON(ev.target.result)
    reader.readAsText(file)
  }, [appStore])

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    processDroppedFile(file)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 border-4 border-blue-400 border-dashed flex items-center justify-center backdrop-blur-sm">
          <div className="text-center text-blue-700">
            <div className="text-5xl mb-3">⬇</div>
            <div className="text-xl font-bold">Drop workflow JSON to import</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧬</span>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight">BioLab Workflow Designer</h1>
              <p className="text-xs text-gray-400">Lab automation workflow builder</p>
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowGlobalVars(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <span className="font-mono font-bold text-indigo-500 text-xs">$x</span>
            Global Variables
            {appStore.globalVariables.length > 0 && (
              <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 rounded-full">{appStore.globalVariables.length}</span>
            )}
          </button>
          <button onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            📚 Library
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button onClick={handleImportAll}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Import All
          </button>
          <button onClick={handleExportAll}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Export All
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Search + New */}
        <div className="flex items-center gap-3 mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="flex-1 max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" />
          <div className="flex-1" />
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            + New Workflow
          </button>
        </div>

        {/* Drop hint */}
        <div className="mb-6 border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center text-gray-400 text-sm hover:border-gray-300 transition-colors">
          <span className="mr-2">⬇</span>Drop a workflow <span className="font-mono text-xs">.json</span> file here to import
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <div className="text-5xl mb-4">🧬</div>
            <div className="text-lg font-medium">{search ? 'No workflows match' : 'No workflows yet'}</div>
            {!search && <button onClick={() => setShowNewModal(true)} className="mt-3 text-sm text-blue-400 hover:underline">Create your first workflow →</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((wf) => (
              <WorkflowCard key={wf.id} wf={wf}
                onOpen={() => appStore.openWorkflow(wf.id)}
                onDuplicate={() => appStore.duplicateWorkflow(wf.id)}
                onDelete={() => { if (confirm(`Delete "${wf.name}"?`)) appStore.deleteWorkflow(wf.id) }}
                onExport={() => handleExport(wf.id)} />
            ))}
          </div>
        )}
      </div>

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showGlobalVars && <GlobalVariablesPanel scope="global" onClose={() => setShowGlobalVars(false)} />}
      {showNewModal && <NewWorkflowModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
    </div>
  )
}
ENDOFFILE

# ── GlobalVariablesPanel: support both global and workflow scope ──────────────
cat > src/components/panels/GlobalVariablesPanel.jsx << 'ENDOFFILE'
import { useState } from 'react'
import useAppStore from '../../stores/appStore'
import useVariableStore, { VAR_TYPES } from '../../stores/variableStore'

function VarRow({ v, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-2 p-2.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 group transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-indigo-700 truncate">{v.name}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">{v.type}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">= </span>
          <span className="text-xs font-mono text-gray-600 truncate">{v.value || '—'}</span>
        </div>
        {v.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{v.description}</div>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(v)} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-500">Edit</button>
        <button onClick={() => onDelete(v.id)} className="text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 text-red-400">Del</button>
      </div>
    </div>
  )
}

function VarForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ name: initial.name ?? '', type: initial.type ?? 'number', value: initial.value ?? '', description: initial.description ?? '' })
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const valid = form.name.trim() && /^[a-zA-Z_]\w*$/.test(form.name.trim())
  return (
    <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3 flex flex-col gap-2">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. sampleVolume"
          className={`w-full border rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 ${form.name && !valid ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'}`} />
        {form.name && !valid && <div className="text-xs text-red-400 mt-0.5">Must start with letter/_, no spaces</div>}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none">
            {VAR_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 block mb-1">Default value</label>
          <input value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="0"
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional note..."
          className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          className={`flex-1 text-sm rounded-md py-1.5 font-medium transition-colors ${valid ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Save</button>
        <button onClick={onCancel} className="flex-1 border border-gray-200 text-sm rounded-md py-1.5 hover:bg-white text-gray-600 transition-colors">Cancel</button>
      </div>
    </div>
  )
}

// scope='global' uses appStore; scope='workflow' uses variableStore
export default function GlobalVariablesPanel({ scope = 'global', onClose }) {
  const appStore = useAppStore()
  const wfStore = useVariableStore()

  const isGlobal = scope === 'global'
  const variables = isGlobal ? appStore.globalVariables : wfStore.variables
  const add = isGlobal ? appStore.addGlobalVariable : wfStore.addVariable
  const update = isGlobal ? appStore.updateGlobalVariable : wfStore.updateVariable
  const del = isGlobal ? appStore.deleteGlobalVariable : wfStore.deleteVariable

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = variables.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase())
  )
  const handleSave = (form) => {
    if (editingId) { update(editingId, form); setEditingId(null) }
    else { add(form); setAdding(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center px-5 py-4 border-b border-gray-200">
          <span className="font-mono font-bold text-indigo-500 text-base">$</span>
          <h2 className="font-bold text-gray-800 ml-2 text-base">
            {isGlobal ? 'Global Variables' : 'Workflow Variables'}
          </h2>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${isGlobal ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {isGlobal ? 'Global' : 'This workflow only'}
          </span>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">×</button>
        </div>
        <div className="px-4 pt-3 pb-2 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={() => { setAdding(true); setEditingId(null) }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 font-medium">+ Add</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
          {adding && <VarForm onSave={handleSave} onCancel={() => setAdding(false)} />}
          {filtered.length === 0 && !adding ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <div className="text-2xl mb-1 font-mono">$x</div>
              <div className="text-sm">{search ? 'No results' : 'No variables yet'}</div>
            </div>
          ) : filtered.map((v) =>
            editingId === v.id
              ? <VarForm key={v.id} initial={v} onSave={handleSave} onCancel={() => setEditingId(null)} />
              : <VarRow key={v.id} v={v} onEdit={(x) => { setEditingId(x.id); setAdding(false) }} onDelete={del} />
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {isGlobal
            ? 'Global variables are accessible across all workflows'
            : 'These variables are only available within this workflow'}
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

# ── TopBar: workflow editor header (back button + workflow vars) ──────────────
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
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shadow-sm flex-shrink-0">
        <button onClick={handleSaveAndBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
          ← Back
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button onClick={undo} disabled={!_canUndo} title="Undo (Ctrl+Z)"
          className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${_canUndo ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>↩</button>
        <button onClick={redo} disabled={!_canRedo} title="Redo (Ctrl+Y)"
          className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${_canRedo ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>↪</button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleNameBlur}
          className="border border-gray-200 rounded-md px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-400 w-44"
          placeholder="Workflow name..." />
        <div className="flex-1" />
        <button onClick={() => setShowWfVars(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors">
          <span className="font-mono font-bold text-xs">$</span> Workflow Vars
          {wfVarCount > 0 && <span className="bg-green-100 text-green-700 text-xs px-1.5 rounded-full">{wfVarCount}</span>}
        </button>
        <button onClick={() => setShowLibrary(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
          📚 Library
        </button>
        <button onClick={handleAutoLayout}
          className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
          Auto Layout
        </button>
        <button onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          Export
        </button>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showWfVars && <GlobalVariablesPanel scope="workflow" onClose={() => setShowWfVars(false)} />}
    </>
  )
}
ENDOFFILE

# ── App.jsx: routing between CoverPage and editor ────────────────────────────
cat > src/App.jsx << 'ENDOFFILE'
import { useEffect } from 'react'
import useAppStore from './stores/appStore'
import useWorkflowStore from './stores/workflowStore'
import useVariableStore from './stores/variableStore'
import CoverPage from './pages/CoverPage'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import RightPanel from './components/layout/RightPanel'
import WorkflowCanvas from './components/canvas/WorkflowCanvas'

function WorkflowEditor({ workflowId }) {
  const appStore = useAppStore()
  const { loadWorkflow } = useWorkflowStore()
  const varStore = useVariableStore()
  const wf = appStore.workflows.find((w) => w.id === workflowId)

  // Load workflow data into editor stores when opening
  useEffect(() => {
    if (wf) {
      loadWorkflow({ nodes: wf.nodes, edges: wf.edges, workflowName: wf.name })
      varStore.setVariables(wf.variables ?? [])
    }
  }, [workflowId])

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <TopBar workflowId={workflowId} />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <main className="flex-1 overflow-hidden bg-gray-50">
          <WorkflowCanvas />
        </main>
        <RightPanel />
      </div>
    </div>
  )
}

export default function App() {
  const activeWorkflowId = useAppStore((s) => s.activeWorkflowId)
  return activeWorkflowId ? <WorkflowEditor workflowId={activeWorkflowId} /> : <CoverPage />
}
ENDOFFILE

# ── RightPanel: use workflow-scoped variableStore (already correct) ───────────
# LeftPanel: remove global vars button (moved to TopBar as workflow vars) ──────
cat > src/components/layout/LeftPanel.jsx << 'ENDOFFILE'
import { useState } from 'react'
import { ELEMENT_PALETTE } from '../../constants/nodeTypes'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import useUiStore from '../../stores/uiStore'
import useLibraryStore from '../../stores/libraryStore'
import LibraryModal from '../library/LibraryModal'

function PaletteItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div draggable onDragStart={onDragStart}
      className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-white hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: item.color }}>
        {item.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-700">{item.label}</div>
        <div className="text-xs text-gray-400">{item.description}</div>
      </div>
    </div>
  )
}

function EdgeTypeButton({ edge, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 p-2.5 border rounded-lg transition-all text-left w-full ${active ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <svg width="28" height="12" className="flex-shrink-0">
        <line x1="2" y1="6" x2="22" y2="6" stroke={edge.color} strokeWidth="2" strokeDasharray={edge.dashed ? '5 3' : undefined} />
        <polygon points="18,3 24,6 18,9" fill={edge.color} />
      </svg>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-700">{edge.label}</div>
        <div className="text-xs text-gray-400 truncate">{edge.description}</div>
      </div>
      {active && <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: edge.color }} />}
    </button>
  )
}

const LIBRARY_TABS = [
  { key: 'samples', label: 'Samples', icon: '🧬' },
  { key: 'consumables', label: 'Consumables', icon: '📦' },
  { key: 'reagents', label: 'Reagents', icon: '🧪' },
  { key: 'devices', label: 'Devices', icon: '🔧' },
]

export default function LeftPanel() {
  const { activeEdgeType, setActiveEdgeType } = useUiStore()
  const [showLibrary, setShowLibrary] = useState(false)
  const store = useLibraryStore()

  return (
    <>
      <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Elements</div>
          <div className="flex flex-col gap-1.5">
            {ELEMENT_PALETTE.map((item) => <PaletteItem key={item.type} item={item} />)}
          </div>
        </div>
        <div className="border-t border-gray-200 mx-3" />
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Connection Type</div>
          <div className="flex flex-col gap-1.5">
            {EDGE_PALETTE.map((edge) => (
              <EdgeTypeButton key={edge.type} edge={edge} active={activeEdgeType === edge.type} onClick={() => setActiveEdgeType(edge.type)} />
            ))}
          </div>
        </div>
        <div className="border-t border-gray-200 mx-3" />
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Library</div>
            <button onClick={() => setShowLibrary(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Manage →</button>
          </div>
          {LIBRARY_TABS.map(({ key, label, icon }) => (
            <div key={key} onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-600 hover:bg-white hover:shadow-sm cursor-pointer transition-all">
              <span className="text-xs">{icon}</span>
              <span>{label}</span>
              <span className="ml-auto text-xs text-gray-400">{store[key]?.length ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
    </>
  )
}
ENDOFFILE

echo ""
echo "✅ Phase 5 complete! Run: npm run dev"