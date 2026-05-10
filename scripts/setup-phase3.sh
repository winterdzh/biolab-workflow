#!/bin/bash
set -e
echo "Phase 3: Library system..."

mkdir -p src/stores src/components/library src/data/defaultLibraries

# ── 默认示例数据 ──────────────────────────────────────────────────────────────
cat > src/data/defaultLibraries/samples.json << 'ENDOFFILE'
[
  {"id":"s1","name":"HEK293T","type":"Cell Line","species":"Human","description":"Human embryonic kidney cells","tags":["mammalian","adherent"]},
  {"id":"s2","name":"pUC19","type":"Plasmid","species":"E. coli","description":"Common cloning vector","tags":["plasmid","ampR"]},
  {"id":"s3","name":"CHO-K1","type":"Cell Line","species":"Hamster","description":"Chinese hamster ovary cells","tags":["mammalian","suspension"]},
  {"id":"s4","name":"pCMV-GFP","type":"Plasmid","species":"Mammalian","description":"CMV promoter driven GFP expression","tags":["plasmid","reporter"]}
]
ENDOFFILE

cat > src/data/defaultLibraries/consumables.json << 'ENDOFFILE'
[
  {"id":"c1","name":"96-well plate","category":"Plate","format":"96-well","vendor":"Corning","catalogNumber":"3585","description":"Clear flat bottom","tags":[]},
  {"id":"c2","name":"384-well plate","category":"Plate","format":"384-well","vendor":"Corning","catalogNumber":"3680","description":"Clear flat bottom","tags":[]},
  {"id":"c3","name":"200µL Tip Box","category":"Tips","format":"200µL","vendor":"Rainin","catalogNumber":"RT-L200F","description":"Filtered tips","tags":["filtered"]},
  {"id":"c4","name":"1.5mL Tube","category":"Tube","format":"1.5mL","vendor":"Eppendorf","catalogNumber":"0030120086","description":"Standard microcentrifuge tube","tags":[]}
]
ENDOFFILE

cat > src/data/defaultLibraries/reagents.json << 'ENDOFFILE'
[
  {"id":"r1","name":"PBS","concentration":"1x","unit":"","vendor":"Gibco","catalogNumber":"10010023","storageCondition":"RT","description":"Phosphate buffered saline"},
  {"id":"r2","name":"DMEM","concentration":"1x","unit":"","vendor":"Gibco","catalogNumber":"11965092","storageCondition":"4°C","description":"Dulbecco's modified Eagle medium"},
  {"id":"r3","name":"Lipofectamine 3000","concentration":"","unit":"","vendor":"Thermo Fisher","catalogNumber":"L3000001","storageCondition":"4°C","description":"Transfection reagent"},
  {"id":"r4","name":"Master Mix (qPCR)","concentration":"2x","unit":"","vendor":"Bio-Rad","catalogNumber":"1725121","storageCondition":"-20°C","description":"iTaq Universal SYBR Green"}
]
ENDOFFILE

cat > src/data/defaultLibraries/devices.json << 'ENDOFFILE'
[
  {"id":"d1","name":"Beckman Biomek i7","category":"Liquid Handler","model":"i7","vendor":"Beckman Coulter","headType":"96-head","capacity":"96/384-well","description":"High-throughput liquid handling"},
  {"id":"d2","name":"Hamilton STAR","category":"Liquid Handler","model":"STAR","vendor":"Hamilton","headType":"Flexible 8-channel","capacity":"1-384-well","description":"Flexible channel liquid handler"},
  {"id":"d3","name":"Eppendorf 5810R","category":"Centrifuge","model":"5810R","vendor":"Eppendorf","headType":"","capacity":"96-well plate","description":"Benchtop centrifuge"},
  {"id":"d4","name":"BioTek Synergy H1","category":"Reader","model":"Synergy H1","vendor":"BioTek","headType":"","capacity":"96/384-well","description":"Multimode microplate reader"}
]
ENDOFFILE

# ── src/stores/libraryStore.js ────────────────────────────────────────────────
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

  // ── Generic CRUD (category = 'samples' | 'consumables' | 'reagents' | 'devices')
  addItem: (category, item) =>
    set({ [category]: [...get()[category], { ...item, id: uuidv4() }] }),

  updateItem: (category, id, patch) =>
    set({ [category]: get()[category].map((x) => x.id === id ? { ...x, ...patch } : x) }),

  deleteItem: (category, id) =>
    set({ [category]: get()[category].filter((x) => x.id !== id) }),

  // ── Import / Export JSON
  exportLibraryJSON: (category) => JSON.stringify(get()[category], null, 2),

  importLibraryJSON: (category, jsonString) => {
    try {
      const items = JSON.parse(jsonString)
      if (!Array.isArray(items)) throw new Error()
      set({ [category]: items.map((x) => ({ ...x, id: x.id ?? uuidv4() })) })
      return true
    } catch {
      alert('Invalid JSON format')
      return false
    }
  },

  // ── Import CSV (expects header row matching field names)
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
    } catch {
      alert('Invalid CSV format')
      return false
    }
  },
}))

export default useLibraryStore
ENDOFFILE

# ── src/components/library/LibraryModal.jsx ──────────────────────────────────
cat > src/components/library/LibraryModal.jsx << 'ENDOFFILE'
import { useState } from 'react'
import useLibraryStore from '../../stores/libraryStore'

const LIBRARY_CONFIG = {
  samples: {
    label: 'Samples',
    color: '#22c55e',
    icon: '🧬',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'type', label: 'Type', placeholder: 'Cell Line / Plasmid / ...' },
      { key: 'species', label: 'Species' },
      { key: 'description', label: 'Description' },
      { key: 'tags', label: 'Tags (comma-separated)' },
    ],
  },
  consumables: {
    label: 'Consumables',
    color: '#f97316',
    icon: '📦',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'category', label: 'Category', placeholder: 'Plate / Tips / Tube / ...' },
      { key: 'format', label: 'Format', placeholder: '96-well / 200µL / ...' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'catalogNumber', label: 'Catalog #' },
      { key: 'description', label: 'Description' },
    ],
  },
  reagents: {
    label: 'Reagents',
    color: '#8b5cf6',
    icon: '🧪',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'concentration', label: 'Concentration' },
      { key: 'unit', label: 'Unit' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'catalogNumber', label: 'Catalog #' },
      { key: 'storageCondition', label: 'Storage', placeholder: 'RT / 4°C / -20°C' },
      { key: 'description', label: 'Description' },
    ],
  },
  devices: {
    label: 'Devices',
    color: '#3b82f6',
    icon: '🔧',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'category', label: 'Category', placeholder: 'Liquid Handler / Centrifuge / ...' },
      { key: 'model', label: 'Model' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'headType', label: 'Head Type' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'description', label: 'Description' },
    ],
  },
}

function ItemForm({ category, initialData = {}, onSave, onCancel }) {
  const config = LIBRARY_CONFIG[category]
  const [form, setForm] = useState(
    Object.fromEntries(config.fields.map((f) => [f.key, initialData[f.key] ?? '']))
  )
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="flex flex-col gap-3">
      {config.fields.map((f) => (
        <div key={f.key}>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input value={form[f.key]} onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder ?? ''}
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(form)}
          className="flex-1 bg-blue-600 text-white text-sm rounded-md py-1.5 hover:bg-blue-700 transition-colors font-medium">
          Save
        </button>
        <button onClick={onCancel}
          className="flex-1 border border-gray-200 text-sm rounded-md py-1.5 hover:bg-gray-50 transition-colors text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}

function ItemRow({ item, config, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
          {item.type && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">{item.type}</span>}
          {item.category && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">{item.category}</span>}
        </div>
        {item.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</div>}
        <div className="flex flex-wrap gap-1 mt-1">
          {item.vendor && <span className="text-xs text-gray-400">{item.vendor}</span>}
          {item.catalogNumber && <span className="text-xs text-gray-300">#{item.catalogNumber}</span>}
          {item.storageCondition && <span className="text-xs bg-blue-50 text-blue-400 px-1 rounded">{item.storageCondition}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(item)} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-500">Edit</button>
        <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 text-red-400">Del</button>
      </div>
    </div>
  )
}

export default function LibraryModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('samples')
  const [adding, setAdding] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [search, setSearch] = useState('')

  const store = useLibraryStore()
  const config = LIBRARY_CONFIG[activeTab]
  const items = store[activeTab] ?? []
  const filtered = items.filter((x) =>
    x.name?.toLowerCase().includes(search.toLowerCase()) ||
    x.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (form) => {
    if (editingItem) {
      store.updateItem(activeTab, editingItem.id, form)
      setEditingItem(null)
    } else {
      store.addItem(activeTab, form)
      setAdding(false)
    }
  }

  const handleExportJSON = () => {
    const json = store.exportLibraryJSON(activeTab)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const data = store[activeTab]
    if (!data.length) return
    const keys = config.fields.map((f) => f.key)
    const header = keys.join(',')
    const rows = data.map((item) => keys.map((k) => `"${(item[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (type) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'json' ? '.json' : '.csv'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (type === 'json') store.importLibraryJSON(activeTab, ev.target.result)
        else store.importLibraryCSV(activeTab, ev.target.result)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const tabs = Object.entries(LIBRARY_CONFIG)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[760px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-gray-200">
          <span className="text-lg">📚</span>
          <h2 className="font-bold text-gray-800 ml-2 text-base">Library Manager</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <div className="w-44 border-r border-gray-200 bg-gray-50 flex flex-col py-3 gap-1 px-2 flex-shrink-0">
            {tabs.map(([key, cfg]) => (
              <button key={key} onClick={() => { setActiveTab(key); setAdding(false); setEditingItem(null); setSearch('') }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                  activeTab === key ? 'bg-white shadow-sm text-gray-800 font-medium border border-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-700'
                }`}>
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span className="ml-auto text-xs text-gray-400">{store[key]?.length ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${config.label.toLowerCase()}...`}
                className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
              <button onClick={() => { setAdding(true); setEditingItem(null) }}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium flex-shrink-0">
                + Add
              </button>
              <div className="relative group flex-shrink-0">
                <button className="px-3 py-1.5 border border-gray-200 text-sm rounded-md hover:bg-gray-50 text-gray-600">
                  Import ▾
                </button>
                <div className="hidden group-hover:flex absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 flex-col w-28 overflow-hidden">
                  <button onClick={() => handleImport('json')} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left">JSON</button>
                  <button onClick={() => handleImport('csv')} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left border-t border-gray-100">CSV</button>
                </div>
              </div>
              <div className="relative group flex-shrink-0">
                <button className="px-3 py-1.5 border border-gray-200 text-sm rounded-md hover:bg-gray-50 text-gray-600">
                  Export ▾
                </button>
                <div className="hidden group-hover:flex absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 flex-col w-28 overflow-hidden">
                  <button onClick={handleExportJSON} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left">JSON</button>
                  <button onClick={handleExportCSV} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left border-t border-gray-100">CSV</button>
                </div>
              </div>
            </div>

            {/* Add / Edit form */}
            {(adding || editingItem) && (
              <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
                <div className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                  {editingItem ? `Edit — ${editingItem.name}` : `New ${config.label.slice(0, -1)}`}
                </div>
                <ItemForm category={activeTab} initialData={editingItem ?? {}}
                  onSave={handleSave}
                  onCancel={() => { setAdding(false); setEditingItem(null) }} />
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <div className="text-sm">{search ? 'No results' : `No ${config.label.toLowerCase()} yet`}</div>
                  {!search && <button onClick={() => setAdding(true)} className="mt-2 text-xs text-blue-400 hover:underline">Add one →</button>}
                </div>
              ) : (
                filtered.map((item) => (
                  <ItemRow key={item.id} item={item} config={config}
                    onEdit={(x) => { setEditingItem(x); setAdding(false) }}
                    onDelete={(id) => store.deleteItem(activeTab, id)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/components/library/DevicePicker.jsx ──────────────────────────────────
cat > src/components/library/DevicePicker.jsx << 'ENDOFFILE'
import { useState } from 'react'
import useLibraryStore from '../../stores/libraryStore'

export default function DevicePicker({ value, onChange }) {
  const devices = useLibraryStore((s) => s.devices)
  const [open, setOpen] = useState(false)
  const selected = devices.find((d) => d.id === value?.id)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-left focus:outline-none focus:border-blue-400 hover:border-gray-300 flex items-center justify-between">
        <span className={selected ? 'text-gray-700' : 'text-gray-400'}>
          {selected ? selected.name : 'Select device...'}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div onClick={() => { onChange(null); setOpen(false) }}
            className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            None
          </div>
          {devices.map((d) => (
            <div key={d.id} onClick={() => { onChange(d); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selected?.id === d.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-400">{d.category} · {d.headType}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
ENDOFFILE

# ── src/components/library/SamplePicker.jsx ──────────────────────────────────
cat > src/components/library/SamplePicker.jsx << 'ENDOFFILE'
import { useState } from 'react'
import useLibraryStore from '../../stores/libraryStore'

export default function SamplePicker({ value, onChange }) {
  const samples = useLibraryStore((s) => s.samples)
  const [open, setOpen] = useState(false)
  const selected = samples.find((s) => s.id === value?.id)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-left focus:outline-none focus:border-blue-400 hover:border-gray-300 flex items-center justify-between">
        <span className={selected ? 'text-gray-700' : 'text-gray-400'}>
          {selected ? selected.name : 'Select sample...'}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div onClick={() => { onChange(null); setOpen(false) }}
            className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            None
          </div>
          {samples.map((s) => (
            <div key={s.id} onClick={() => { onChange(s); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-green-50 ${selected?.id === s.id ? 'bg-green-50 text-green-700' : 'text-gray-700'}`}>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-400">{s.type} · {s.species}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
ENDOFFILE

# ── 更新 RightPanel 加入 Library picker ─────────────────────────────────────
cat > src/components/layout/RightPanel.jsx << 'ENDOFFILE'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
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

function NodeProps({ node, update }) {
  const { data, type } = node
  return (
    <div className="p-3 flex flex-col gap-3">
      <Field label="Label">
        <Input value={data.label} onChange={(v) => update({ label: v })} />
      </Field>

      {type === 'operationNode' && <>
        <Field label="Device">
          <DevicePicker value={data.device} onChange={(v) => update({ device: v })} />
        </Field>
        <Field label="Sample">
          <SamplePicker value={data.sample} onChange={(v) => update({ sample: v })} />
        </Field>
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
        <Field label="Variable name">
          <Input value={data.variableName} onChange={(v) => update({ variableName: v })} placeholder="e.g. sampleVolume" />
        </Field>
        <Field label="Expression">
          <Input value={data.expression} onChange={(v) => update({ expression: v })} placeholder="e.g. 200 * n" />
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

# ── 更新 TopBar 加入 Library 按钮 ───────────────────────────────────────────
cat > src/components/layout/TopBar.jsx << 'ENDOFFILE'
import { useState } from 'react'
import useWorkflowStore from '../../stores/workflowStore'
import { exportWorkflow, importWorkflow } from '../../utils/importExport'
import { applyAutoLayout } from '../../utils/autoLayout'
import LibraryModal from '../library/LibraryModal'

export default function TopBar() {
  const { workflowName, setWorkflowName, nodes, edges, clearWorkflow, loadWorkflow } = useWorkflowStore()
  const [showLibrary, setShowLibrary] = useState(false)

  const handleExport = () => {
    const json = exportWorkflow({ nodes, edges, workflowName })
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
        if (result) loadWorkflow(result)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleAutoLayout = () => {
    if (nodes.length === 0) return
    const laid = applyAutoLayout(nodes, edges)
    loadWorkflow({ nodes: laid, edges, workflowName })
  }

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-blue-600 text-xl">🧬</span>
          <span className="font-bold text-gray-700 text-sm">BioLab Workflow Designer</span>
        </div>
        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
        <input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}
          className="border border-gray-200 rounded-md px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-52"
          placeholder="Workflow name..." />
        <div className="flex-1" />
        <button onClick={() => setShowLibrary(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
          📚 Library
        </button>
        <button onClick={clearWorkflow}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
          Clear
        </button>
        <button onClick={handleAutoLayout}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
          Auto Layout
        </button>
        <button onClick={handleImport}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
          Import JSON
        </button>
        <button onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          Export JSON
        </button>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
    </>
  )
}
ENDOFFILE

# ── 更新 LeftPanel 左侧 Library 快速入口 ────────────────────────────────────
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
      className={`flex items-center gap-3 p-2.5 border rounded-lg transition-all text-left w-full ${
        active ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      <svg width="28" height="12" className="flex-shrink-0">
        <line x1="2" y1="6" x2="22" y2="6" stroke={edge.color} strokeWidth="2"
          strokeDasharray={edge.dashed ? '5 3' : undefined} />
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
              <EdgeTypeButton key={edge.type} edge={edge}
                active={activeEdgeType === edge.type}
                onClick={() => setActiveEdgeType(edge.type)} />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 mx-3" />

        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Library</div>
            <button onClick={() => setShowLibrary(true)}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium">Manage →</button>
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
echo "✅ Phase 3 complete! Run: npm run dev"