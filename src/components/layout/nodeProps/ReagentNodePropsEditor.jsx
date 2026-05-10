import { Plus, X, Droplets } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const CONC_UNITS = ['nM', 'µM', 'mM', 'M', 'mg/mL', 'µg/mL', 'ng/mL', 'cells/mL', '%', 'U/mL']
const VOL_UNITS = ['µL', 'mL', 'L']
const STORAGE_TEMPS = ['RT', '4°C', '-20°C', '-80°C', 'LN2', 'Other']

export default function ReagentNodePropsEditor({ data, update }) {
  const items = data.items ?? []

  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    update({ items: next })
  }
  const removeItem = (idx) => update({ items: items.filter((_, i) => i !== idx) })
  const addItem = () => update({
    items: [...items, {
      id: uuidv4(), name: '', concentration: '', unit: 'µM', volume: '', volumeUnit: 'µL',
      catalogNumber: '', vendor: '', storageCondition: '',
    }],
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">Reagents</label>
        <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#8b5cf6' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {items.length === 0
        ? <div className="text-xs text-gray-300 italic px-1">No reagents yet — click Add</div>
        : items.map((item, idx) => (
          <div key={item.id} className="border border-gray-100 p-2 flex flex-col gap-1.5" style={{ borderRadius: 4 }}>
            <div className="flex items-center gap-1">
              <Droplets size={11} className="text-violet-400 flex-shrink-0" />
              <input value={item.name} placeholder="Name *" onChange={(e) => updateItem(idx, { name: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5">
                <X size={12} />
              </button>
            </div>
            <div className="flex gap-1">
              <input value={item.concentration} placeholder="Conc." onChange={(e) => updateItem(idx, { concentration: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <select value={item.unit ?? 'µM'} onChange={(e) => updateItem(idx, { unit: e.target.value })}
                className="w-20 border border-gray-200 px-1 py-1 text-xs bg-white focus:outline-none" style={{ borderRadius: 4 }}>
                {CONC_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              <input value={item.volume} placeholder="Vol." onChange={(e) => updateItem(idx, { volume: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <select value={item.volumeUnit ?? 'µL'} onChange={(e) => updateItem(idx, { volumeUnit: e.target.value })}
                className="w-16 border border-gray-200 px-1 py-1 text-xs bg-white focus:outline-none" style={{ borderRadius: 4 }}>
                {VOL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              <input value={item.vendor} placeholder="Vendor" onChange={(e) => updateItem(idx, { vendor: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <input value={item.catalogNumber} placeholder="Cat #" onChange={(e) => updateItem(idx, { catalogNumber: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
            </div>
            <select value={item.storageCondition ?? ''} onChange={(e) => updateItem(idx, { storageCondition: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
              <option value="">Storage temp…</option>
              {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))
      }
    </>
  )
}
