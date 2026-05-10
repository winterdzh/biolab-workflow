import { Plus, X, Package } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function LabwareNodePropsEditor({ data, update }) {
  const items = data.items ?? []

  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    update({ items: next })
  }
  const removeItem = (idx) => update({ items: items.filter((_, i) => i !== idx) })
  const addItem = () => update({ items: [...items, { id: uuidv4(), name: '', catalogNumber: '', vendor: '', format: '', quantity: '' }] })

  return (
    <>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">Items</label>
        <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#f97316' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {items.length === 0
        ? <div className="text-xs text-gray-300 italic px-1">No items yet — click Add</div>
        : items.map((item, idx) => (
          <div key={item.id} className="border border-gray-100 p-2 flex flex-col gap-1.5" style={{ borderRadius: 4 }}>
            <div className="flex items-center gap-1">
              <Package size={11} className="text-orange-400 flex-shrink-0" />
              <input value={item.name} placeholder="Name *" onChange={(e) => updateItem(idx, { name: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5">
                <X size={12} />
              </button>
            </div>
            <div className="flex gap-1">
              <input value={item.format} placeholder="Format (96-well…)" onChange={(e) => updateItem(idx, { format: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <input value={item.quantity} placeholder="Qty" onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                className="w-14 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
            </div>
            <div className="flex gap-1">
              <input value={item.vendor} placeholder="Vendor" onChange={(e) => updateItem(idx, { vendor: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
              <input value={item.catalogNumber} placeholder="Cat #" onChange={(e) => updateItem(idx, { catalogNumber: e.target.value })}
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
            </div>
          </div>
        ))
      }
    </>
  )
}
