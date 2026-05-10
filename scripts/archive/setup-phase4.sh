#!/bin/bash
set -e
echo "Phase 4: Global variables + Undo/Redo + Complete import/export..."

mkdir -p src/components/panels

# ── src/stores/variableStore.js ──────────────────────────────────────────────
cat > src/stores/variableStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

// Variable types supported
export const VAR_TYPES = ['number', 'string', 'boolean', 'list']

const useVariableStore = create((set, get) => ({
  variables: [
    { id: 'v1', name: 'sampleVolume', type: 'number', value: '200', description: 'Volume per well (µL)' },
    { id: 'v2', name: 'replicates', type: 'number', value: '3', description: 'Number of replicates' },
    { id: 'v3', name: 'plateCount', type: 'number', value: '1', description: 'Number of plates' },
  ],

  addVariable: (v) => set({ variables: [...get().variables, { ...v, id: uuidv4() }] }),
  updateVariable: (id, patch) =>
    set({ variables: get().variables.map((v) => (v.id === id ? { ...v, ...patch } : v)) }),
  deleteVariable: (id) => set({ variables: get().variables.filter((v) => v.id !== id) }),

  setVariables: (variables) => set({ variables }),
}))

export default useVariableStore
ENDOFFILE

# ── src/stores/workflowStore.js (with undo/redo) ─────────────────────────────
cat > src/stores/workflowStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

const MAX_HISTORY = 50

function snapshot(nodes, edges) {
  return { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
}

const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowName: 'Untitled Workflow',
  past: [],    // history stack
  future: [],  // redo stack

  // ── Internal: push current state to history before a destructive change
  _push: () => {
    const { nodes, edges, past } = get()
    const newPast = [...past, snapshot(nodes, edges)]
    if (newPast.length > MAX_HISTORY) newPast.shift()
    set({ past: newPast, future: [] })
  },

  undo: () => {
    const { past, nodes, edges, future } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [snapshot(nodes, edges), ...future],
    })
  },

  redo: () => {
    const { future, nodes, edges, past } = get()
    if (!future.length) return
    const next = future[0]
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      past: [...past, snapshot(nodes, edges)],
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // ── React Flow handlers (position drags don't push history)
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    get()._push()
    set({ edges: addEdge({ ...connection }, get().edges) })
  },

  addNode: (node) => {
    get()._push()
    set({ nodes: [...get().nodes, node] })
  },

  updateNodeData: (nodeId, patch) => {
    get()._push()
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
      ),
    })
  },

  updateEdgeData: (edgeId, patch) => {
    get()._push()
    set({ edges: get().edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)) })
  },

  setWorkflowName: (name) => set({ workflowName: name }),

  clearWorkflow: () => {
    get()._push()
    set({ nodes: [], edges: [] })
  },

  loadWorkflow: ({ nodes, edges, workflowName }) => {
    set({ nodes, edges, workflowName: workflowName ?? get().workflowName, past: [], future: [] })
  },
}))

export default useWorkflowStore
ENDOFFILE

# ── src/utils/importExport.js (complete, with library + variables snapshot) ──
cat > src/utils/importExport.js << 'ENDOFFILE'
export function exportWorkflow({ nodes, edges, workflowName, viewport, library, variables }) {
  const payload = {
    version: '1.0',
    metadata: {
      name: workflowName,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    nodes,
    edges,
    viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
    globalVariables: variables ?? [],
    librarySnapshot: library ?? {},
  }
  return JSON.stringify(payload, null, 2)
}

export function importWorkflow(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!data.nodes || !data.edges) throw new Error('Missing nodes/edges')
    return {
      nodes: data.nodes,
      edges: data.edges,
      workflowName: data.metadata?.name ?? 'Imported Workflow',
      variables: data.globalVariables ?? [],
      library: data.librarySnapshot ?? {},
    }
  } catch (e) {
    alert('Invalid workflow JSON: ' + e.message)
    return null
  }
}
ENDOFFILE

# ── src/components/panels/GlobalVariablesPanel.jsx ───────────────────────────
cat > src/components/panels/GlobalVariablesPanel.jsx << 'ENDOFFILE'
import { useState } from 'react'
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
          <span className="text-xs font-mono text-gray-600 truncate">{v.value}</span>
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
  const [form, setForm] = useState({
    name: initial.name ?? '',
    type: initial.type ?? 'number',
    value: initial.value ?? '',
    description: initial.description ?? '',
  })
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const valid = form.name.trim() && /^[a-zA-Z_]\w*$/.test(form.name.trim())

  return (
    <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3 flex flex-col gap-2">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. sampleVolume"
          className={`w-full border rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 ${
            form.name && !valid ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
          }`} />
        {form.name && !valid && <div className="text-xs text-red-400 mt-0.5">Must start with letter/_, no spaces</div>}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400">
            {VAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 block mb-1">Default value</label>
          <input value={form.value} onChange={(e) => set('value', e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Optional note..."
          className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          className={`flex-1 text-sm rounded-md py-1.5 font-medium transition-colors ${
            valid ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}>Save</button>
        <button onClick={onCancel}
          className="flex-1 border border-gray-200 text-sm rounded-md py-1.5 hover:bg-white transition-colors text-gray-600">Cancel</button>
      </div>
    </div>
  )
}

export default function GlobalVariablesPanel({ onClose }) {
  const { variables, addVariable, updateVariable, deleteVariable } = useVariableStore()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = variables.filter(
    (v) => v.name.toLowerCase().includes(search.toLowerCase()) ||
           v.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (form) => {
    if (editingId) { updateVariable(editingId, form); setEditingId(null) }
    else { addVariable(form); setAdding(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center px-5 py-4 border-b border-gray-200">
          <span className="text-lg">$</span>
          <h2 className="font-bold text-gray-800 ml-2 text-base">Global Variables</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">×</button>
        </div>

        <div className="px-4 pt-3 pb-2 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search variables..."
            className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={() => { setAdding(true); setEditingId(null) }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors font-medium flex-shrink-0">
            + Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
          {adding && (
            <VarForm onSave={handleSave} onCancel={() => setAdding(false)} />
          )}
          {filtered.length === 0 && !adding ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <div className="text-2xl mb-1 font-mono">$x</div>
              <div className="text-sm">{search ? 'No results' : 'No variables yet'}</div>
              {!search && <button onClick={() => setAdding(true)} className="mt-1 text-xs text-indigo-400 hover:underline">Add one →</button>}
            </div>
          ) : (
            filtered.map((v) =>
              editingId === v.id ? (
                <VarForm key={v.id} initial={v} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <VarRow key={v.id} v={v}
                  onEdit={(x) => { setEditingId(x.id); setAdding(false) }}
                  onDelete={deleteVariable} />
              )
            )
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-400">
            {variables.length} variable{variables.length !== 1 ? 's' : ''} · Use in <span className="font-mono text-indigo-500">Set Variable</span> nodes or condition expressions
          </div>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/TopBar.jsx (with undo/redo + variables button) ─────
cat > src/components/layout/TopBar.jsx << 'ENDOFFILE'
import { useState, useEffect, useCallback } from 'react'
import useWorkflowStore from '../../stores/workflowStore'
import useLibraryStore from '../../stores/libraryStore'
import useVariableStore from '../../stores/variableStore'
import { exportWorkflow, importWorkflow } from '../../utils/importExport'
import { applyAutoLayout } from '../../utils/autoLayout'
import LibraryModal from '../library/LibraryModal'
import GlobalVariablesPanel from '../panels/GlobalVariablesPanel'

export default function TopBar() {
  const {
    workflowName, setWorkflowName, nodes, edges,
    clearWorkflow, loadWorkflow, undo, redo, canUndo, canRedo,
  } = useWorkflowStore()
  const libraryStore = useLibraryStore()
  const { variables, setVariables } = useVariableStore()

  const [showLibrary, setShowLibrary] = useState(false)
  const [showVariables, setShowVariables] = useState(false)

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
  }, [undo, redo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleExport = () => {
    const json = exportWorkflow({
      nodes, edges, workflowName,
      variables,
      library: {
        samples: libraryStore.samples,
        consumables: libraryStore.consumables,
        reagents: libraryStore.reagents,
        devices: libraryStore.devices,
      },
    })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = importWorkflow(ev.target.result)
        if (!result) return
        loadWorkflow(result)
        if (result.variables?.length) setVariables(result.variables)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleAutoLayout = () => {
    if (!nodes.length) return
    loadWorkflow({ nodes: applyAutoLayout(nodes, edges), edges, workflowName })
  }

  const _canUndo = canUndo()
  const _canRedo = canRedo()

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-blue-600 text-xl">🧬</span>
          <span className="font-bold text-gray-700 text-sm hidden sm:block">BioLab Workflow Designer</span>
        </div>
        <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={!_canUndo} title="Undo (Ctrl+Z)"
          className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
            _canUndo ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'
          }`}>↩</button>
        <button onClick={redo} disabled={!_canRedo} title="Redo (Ctrl+Shift+Z)"
          className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
            _canRedo ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'
          }`}>↪</button>

        <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />

        <input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}
          className="border border-gray-200 rounded-md px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-44"
          placeholder="Workflow name..." />

        <div className="flex-1" />

        <button onClick={() => setShowVariables(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
          <span className="font-mono font-bold text-indigo-500 text-xs">$x</span>
          <span>Variables</span>
          {variables.length > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 rounded-full">{variables.length}</span>
          )}
        </button>
        <button onClick={() => setShowLibrary(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
          📚 Library
        </button>
        <button onClick={clearWorkflow}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
          Clear
        </button>
        <button onClick={handleAutoLayout}
          className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
          Auto Layout
        </button>
        <button onClick={handleImport}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
          Import
        </button>
        <button onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          Export
        </button>
      </div>

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showVariables && <GlobalVariablesPanel onClose={() => setShowVariables(false)} />}
    </>
  )
}
ENDOFFILE

# ── SetVariableNode: show available variables as suggestions ─────────────────
cat > src/components/nodes/SetVariableNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'
import useVariableStore from '../../stores/variableStore'

export default function SetVariableNode({ data, selected }) {
  const variables = useVariableStore((s) => s.variables)
  const matchedVar = variables.find((v) => v.name === data.variableName)

  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${
      selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-400 hover:border-indigo-500'
    }`}>
      <Handle type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
      <div className="bg-indigo-50 border-b border-indigo-200 px-3 py-2 rounded-t-xl flex items-center gap-2">
        <span className="text-indigo-500 text-sm font-mono font-bold">$</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.variableName ? (
          <div className="text-xs text-gray-600">
            <span className={`font-mono font-medium ${matchedVar ? 'text-indigo-600' : 'text-orange-500'}`}>
              {data.variableName}
            </span>
            {data.expression && <span className="text-gray-400"> = {data.expression}</span>}
            {!matchedVar && data.variableName && (
              <div className="text-orange-400 text-xs mt-0.5">⚠ Not in global vars</div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No variable set</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
    </div>
  )
}
ENDOFFILE

# ── RightPanel: add variable picker for SetVariable node ─────────────────────
cat > src/components/layout/RightPanel.jsx << 'ENDOFFILE'
import { useState } from 'react'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import useVariableStore from '../../stores/variableStore'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import DevicePicker from '../library/DevicePicker'
import SamplePicker from '../library/SamplePicker'

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text', min }) => (
  <input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
)

const Textarea = ({ value, onChange, placeholder }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none" />
)

function VariableSelect({ value, onChange }) {
  const variables = useVariableStore((s) => s.variables)
  return (
    <div>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 font-mono">
        <option value="">-- select variable --</option>
        {variables.map((v) => (
          <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
        ))}
      </select>
      {variables.length === 0 && (
        <div className="text-xs text-gray-400 mt-1">No global variables defined yet. Open <span className="font-mono text-indigo-500">$x Variables</span> to add some.</div>
      )}
    </div>
  )
}

function NodeProps({ node, update }) {
  const { data, type } = node
  return (
    <div className="p-3 flex flex-col gap-3">
      <Field label="Label">
        <Input value={data.label} onChange={(v) => update({ label: v })} />
      </Field>

      {type === 'operationNode' && <>
        <Field label="Device"><DevicePicker value={data.device} onChange={(v) => update({ device: v })} /></Field>
        <Field label="Sample"><SamplePicker value={data.sample} onChange={(v) => update({ sample: v })} /></Field>
        <Field label="Description">
          <Textarea value={data.description} onChange={(v) => update({ description: v })} placeholder="Describe this operation..." />
        </Field>
        <Field label="Duration">
          <div className="flex gap-2">
            <input type="number" min={0} value={data.duration?.value ?? 0}
              onChange={(e) => update({ duration: { ...data.duration, value: Number(e.target.value) } })}
              className="w-20 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
            <select value={data.duration?.unit ?? 'min'}
              onChange={(e) => update({ duration: { ...data.duration, unit: e.target.value } })}
              className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none bg-white">
              <option value="sec">sec</option>
              <option value="min">min</option>
              <option value="hr">hr</option>
            </select>
          </div>
        </Field>
      </>}

      {type === 'ifElseNode' && <>
        <Field label="Condition">
          <Input value={data.condition} onChange={(v) => update({ condition: v })} placeholder="e.g. OD600 > 0.8" />
        </Field>
        <div className="flex gap-2">
          <Field label="True label"><Input value={data.trueLabel} onChange={(v) => update({ trueLabel: v })} /></Field>
          <Field label="False label"><Input value={data.falseLabel} onChange={(v) => update({ falseLabel: v })} /></Field>
        </div>
      </>}

      {type === 'loopNode' && <>
        <Field label="Loop type">
          <select value={data.loopType ?? 'count'} onChange={(e) => update({ loopType: e.target.value })}
            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none bg-white">
            <option value="count">Fixed count</option>
            <option value="condition">Until condition</option>
          </select>
        </Field>
        {(!data.loopType || data.loopType === 'count')
          ? <Field label="Repeat count"><Input type="number" min={1} value={data.count ?? 3} onChange={(v) => update({ count: v })} /></Field>
          : <Field label="Condition"><Input value={data.condition} onChange={(v) => update({ condition: v })} placeholder="e.g. i >= 10" /></Field>
        }
      </>}

      {type === 'waitUntilNode' &&
        <Field label="Condition">
          <Input value={data.condition} onChange={(v) => update({ condition: v })} placeholder="e.g. temp == 37" />
        </Field>
      }

      {type === 'setVariableNode' && <>
        <Field label="Variable (from global vars)">
          <VariableSelect value={data.variableName} onChange={(v) => update({ variableName: v })} />
        </Field>
        <Field label="Expression">
          <Input value={data.expression} onChange={(v) => update({ expression: v })} placeholder="e.g. 200 * replicates" />
        </Field>
      </>}

      <div className="pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-300 font-mono truncate">ID: {node.id?.slice(0, 18)}…</div>
      </div>
    </div>
  )
}

function EdgeProps({ edge, updateEdge }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <Field label="Flow type">
        <div className="flex flex-col gap-1.5 mt-1">
          {EDGE_PALETTE.map((ep) => (
            <button key={ep.type} onClick={() => updateEdge({ type: ep.type })}
              className={`flex items-center gap-3 p-2 border rounded-lg transition-all text-left ${
                edge.type === ep.type ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              <svg width="24" height="12" className="flex-shrink-0">
                <line x1="2" y1="6" x2="20" y2="6" stroke={ep.color} strokeWidth="2" strokeDasharray={ep.dashed ? '5 3' : undefined} />
                <polygon points="16,3 22,6 16,9" fill={ep.color} />
              </svg>
              <span className="text-sm text-gray-700">{ep.label}</span>
              {edge.type === ep.type && <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: ep.color }} />}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Label (optional)">
        <Input value={edge.data?.label ?? ''} onChange={(v) => updateEdge({ data: { ...edge.data, label: v } })} placeholder="Add a label..." />
      </Field>
    </div>
  )
}

export default function RightPanel() {
  const { selectedNodeId, selectedEdgeId } = useUiStore()
  const { nodes, edges, updateNodeData, updateEdgeData } = useWorkflowStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-60 bg-gray-50 border-l border-gray-200 flex items-center justify-center flex-shrink-0">
        <div className="text-center text-gray-300 p-6">
          <div className="text-3xl mb-2">✦</div>
          <div className="text-xs">Click a node or connection to edit</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-60 bg-white border-l border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</div>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">
          {selectedNode ? `${selectedNode.type?.replace('Node', '')} node` : 'Connection'}
        </div>
      </div>
      {selectedNode && <NodeProps node={selectedNode} update={(p) => updateNodeData(selectedNode.id, p)} />}
      {selectedEdge && <EdgeProps edge={selectedEdge} updateEdge={(p) => updateEdgeData(selectedEdge.id, p)} />}
    </div>
  )
}
ENDOFFILE

echo ""
echo "✅ Phase 4 complete! Run: npm run dev"