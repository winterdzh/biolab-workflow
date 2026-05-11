import { Plus, X, Database } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const FORMAT_OPTIONS = ['csv', 'xlsx', 'json', 'tsv', 'txt', 'fasta', 'fastq', 'bam', 'vcf', 'pdf', 'png', 'other']

export default function DataNodePropsEditor({ data, update }) {
  const items = data.items ?? data.files ?? []

  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    update({ items: next })
  }
  const removeItem = (idx) => update({ items: items.filter((_, i) => i !== idx) })
  const addItem = () => update({ items: [...items, { id: uuidv4(), name: '', format: '' }] })

  return (
    <>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">Data Objects</label>
        <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#009688' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {items.length === 0
        ? <div className="text-xs text-gray-300 italic px-1">No data objects yet — click Add</div>
        : items.map((item, idx) => (
          <div key={item.id} className="border border-gray-100 p-2 flex flex-col gap-1.5" style={{ borderRadius: 4 }}>
            <div className="flex items-center gap-1">
              <Database size={11} className="flex-shrink-0" style={{ color: '#009688' }} />
              <input value={item.name} placeholder="Name *" onChange={(e) => updateItem(idx, { name: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5">
                <X size={12} />
              </button>
            </div>
            <select value={item.format ?? ''} onChange={(e) => updateItem(idx, { format: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
              <option value="">— format —</option>
              {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        ))
      }
    </>
  )
}

