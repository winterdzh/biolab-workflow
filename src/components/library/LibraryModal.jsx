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
  labware: {
    label: 'Labware',
    color: '#06b6d4',
    icon: '📦',
    fields: [
      { key: 'name',          label: 'Name',        required: true },
      { key: 'category',      label: 'Category',    placeholder: 'Plate / Tube / Tips / Reservoir / Flask / Rack / Lid\u2026' },
      { key: 'format',        label: 'Format',      placeholder: '96-well / 200\u00b5L / ...' },
      { key: 'vendor',        label: 'Vendor' },
      { key: 'catalogNumber', label: 'Catalog #' },
      { key: 'description',   label: 'Description' },
    ],
  },
  reagents: {
    label: 'Reagents',
    color: '#8b5cf6',
    icon: '🧪',
    fields: [
      { key: 'name',             label: 'Name',          required: true },
      { key: 'category',         label: 'Category',      placeholder: 'Buffer / Growth Media / Transfection / qPCR Reagent\u2026' },
      { key: 'concentration',    label: 'Concentration' },
      { key: 'unit',             label: 'Unit' },
      { key: 'vendor',           label: 'Vendor' },
      { key: 'catalogNumber',    label: 'Catalog #' },
      { key: 'storageCondition', label: 'Storage',       placeholder: 'RT / 4\u00b0C / -20\u00b0C' },
      { key: 'description',      label: 'Description' },
      { key: 'website',          label: 'Product Website', placeholder: 'https://www.thermofisher.com/...' },
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
      { key: 'website',     label: 'Product Website', placeholder: 'https://www.tecan.com/...' },
      { key: 'imageUrl',    label: 'Image URL',        placeholder: '/device-images/d1.jpg  —  set by scripts/fetch-product-info.mjs or paste URL' },
      { key: 'modules',     label: 'Optional Modules (comma-separated)', placeholder: 'Shaker, Thermocycler, ...', isArray: true },
    ],
  },
}

function ItemForm({ category, initialData = {}, onSave, onCancel }) {
  const config = LIBRARY_CONFIG[category]
  const [form, setForm] = useState(
    Object.fromEntries(config.fields.map((f) => {
      const raw = initialData[f.key]
      if (f.isArray) return [f.key, Array.isArray(raw) ? raw.join(', ') : (raw ?? '')]
      return [f.key, raw ?? '']
    }))
  )
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const handleSave = () => {
    const result = {}
    config.fields.forEach((f) => {
      if (f.isArray) {
        result[f.key] = form[f.key]
          ? form[f.key].split(',').map((s) => s.trim()).filter(Boolean)
          : []
      } else {
        result[f.key] = form[f.key]
      }
    })
    onSave(result)
  }

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
        <button onClick={handleSave}
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

function safeHostname(url) {
  try { return new URL(url).hostname } catch { return url }
}

function ItemRow({ item, config, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors group">
      {/* Image thumbnail (devices/labware) */}
      {item.imageUrl && (
        <img
          src={item.imageUrl} alt={item.name}
          className="w-10 h-10 object-contain rounded border border-gray-100 bg-gray-50 flex-shrink-0 opacity-80"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
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
        {item.modules?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.modules.map((m, i) => (
              <span key={i} className="text-xs bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded-sm">{m}</span>
            ))}
          </div>
        )}
        {item.website && (
          <a href={item.website} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-600 hover:underline block mt-1 truncate"
            onClick={(e) => e.stopPropagation()} title={item.website}>
            🌐 {safeHostname(item.website)}
          </a>
        )}
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
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Form view — full panel, like iOS Settings drill-down */}
            {(adding || editingItem) && (
              <div className="absolute inset-0 bg-white flex flex-col z-10">
                {/* Form header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                  <button
                    onClick={() => { setAdding(false); setEditingItem(null) }}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm transition-colors"
                    title="Back"
                  >
                    <span className="text-lg leading-none">‹</span>
                    <span>{config.label}</span>
                  </button>
                  <span className="text-gray-300 mx-1">|</span>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {editingItem ? editingItem.name : `New ${config.label.slice(0, -1)}`}
                  </span>
                </div>
                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <ItemForm category={activeTab} initialData={editingItem ?? {}}
                    onSave={handleSave}
                    onCancel={() => { setAdding(false); setEditingItem(null) }} />
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
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

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <div className="text-sm">No {config.label.toLowerCase()} yet</div>
                  <button onClick={() => setAdding(true)} className="mt-2 text-xs text-blue-400 hover:underline">Add one →</button>
                </div>
              ) : search ? (
                /* Search mode: flat filtered list */
                <div className="flex flex-col gap-2">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                      <div className="text-sm">No results for "{search}"</div>
                    </div>
                  ) : (
                    filtered.map((item) => (
                      <ItemRow key={item.id} item={item} config={config}
                        onEdit={(x) => { setEditingItem(x); setAdding(false) }}
                        onDelete={(id) => store.deleteItem(activeTab, id)} />
                    ))
                  )}
                </div>
              ) : (
                /* Browse mode: grouped by category */
                (() => {
                  const groups = {}
                  items.forEach((item) => {
                    const cat = item.category || item.type || 'Other'
                    if (!groups[cat]) groups[cat] = []
                    groups[cat].push(item)
                  })
                  const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b))
                  return (
                    <div className="flex flex-col gap-4">
                      {sortedCats.map((cat) => (
                        <div key={cat}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{cat}</span>
                            <span className="text-xs text-gray-300">({groups[cat].length})</span>
                            <div className="flex-1 h-px bg-gray-100" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {groups[cat].map((item) => (
                              <ItemRow key={item.id} item={item} config={config}
                                onEdit={(x) => { setEditingItem(x); setAdding(false) }}
                                onDelete={(id) => store.deleteItem(activeTab, id)} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
