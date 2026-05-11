import { Plus, X, FlaskConical } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import useLibraryStore from '../../../stores/libraryStore'

const CONTAINER_OPTIONS = [
  { value: '', label: '— not specified —' },
  { value: 'well_96', label: '96-well Plate' },
  { value: 'well_384', label: '384-well Plate' },
  { value: 'well_6', label: '6-well Plate' },
  { value: 'cryo_tube', label: 'Cryo Tube' },
  { value: 'reservoir', label: 'Reservoir' },
  { value: 'flask', label: 'Flask' },
  { value: 'autoflask', label: 'AutoFlask' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'tube_15', label: '15 mL Tube' },
  { value: 'tube_50', label: '50 mL Tube' },
  { value: 'deepwell_96', label: '96-well Deep Well' },
  { value: 'other', label: 'Other' },
]

const CONC_UNITS = ['nM', 'µM', 'mM', 'M', 'mg/mL', 'µg/mL', 'ng/mL', 'cells/mL', '%', 'U/mL']
const VOL_UNITS = ['µL', 'mL', 'L']
const STORAGE_TEMPS = ['RT', '4°C', '-20°C', '-80°C', 'LN2']

export default function SampleNodePropsEditor({ data, update }) {
  const librarySmples = useLibraryStore((s) => s.samples)
  const items = data.items ?? []

  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    update({ items: next })
  }
  const removeItem = (idx) => update({ items: items.filter((_, i) => i !== idx) })
  const addItem = () => update({ items: [...items, { id: uuidv4(), name: '', sampleId: null, containerType: '', concentration: '', concentrationUnit: 'nM', volume: '', volumeUnit: 'µL', storageTemp: '' }] })

  return (
    <>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">Samples</label>
        <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#3b82f6' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {items.length === 0
        ? <div className="text-xs text-gray-300 italic px-1">No samples yet — click Add</div>
        : items.map((item, idx) => (
          <div key={item.id} className="border border-gray-100 p-2 flex flex-col gap-1.5" style={{ borderRadius: 4 }}>
            <div className="flex items-center gap-1">
              <FlaskConical size={11} className="flex-shrink-0" style={{ color: '#3b82f6' }} />
              <select
                value={item.sampleId ?? ''}
                onChange={(e) => {
                  const s = librarySmples.find((x) => x.id === e.target.value)
                  updateItem(idx, { sampleId: e.target.value || null, name: s?.name ?? item.name })
                }}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}
              >
                <option value="">— custom —</option>
                {librarySmples.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5">
                <X size={12} />
              </button>
            </div>
            {!item.sampleId && (
              <input value={item.name} placeholder="Sample name *" onChange={(e) => updateItem(idx, { name: e.target.value })}
                className="w-full border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
            )}
            <select value={item.containerType ?? ''} onChange={(e) => updateItem(idx, { containerType: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
              {CONTAINER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-1">
              <input value={item.concentration} placeholder="Conc." onChange={(e) => updateItem(idx, { concentration: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <select value={item.concentrationUnit ?? 'nM'} onChange={(e) => updateItem(idx, { concentrationUnit: e.target.value })}
                className="w-16 border border-gray-200 px-1 py-1 text-xs bg-white focus:outline-none" style={{ borderRadius: 4 }}>
                {CONC_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              <input value={item.volume} placeholder="Volume" onChange={(e) => updateItem(idx, { volume: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <select value={item.volumeUnit ?? 'µL'} onChange={(e) => updateItem(idx, { volumeUnit: e.target.value })}
                className="w-14 border border-gray-200 px-1 py-1 text-xs bg-white focus:outline-none" style={{ borderRadius: 4 }}>
                {VOL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <select value={item.storageTemp ?? ''} onChange={(e) => updateItem(idx, { storageTemp: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
              <option value="">— storage temp —</option>
              {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))
      }
    </>
  )
}

