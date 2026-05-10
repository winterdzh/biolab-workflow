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
