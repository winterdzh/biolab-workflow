import { Plus, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function DataNodePropsEditor({ data, update }) {
  return (
    <>
      <Field label="Description">
        <Textarea value={data.description} onChange={(v) => update({ description: v })}
          placeholder="Describe this data node..." rows={2} />
      </Field>

      {/* Files — each file maps to one output handle on DataNode */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-500">Files</label>
          <button
            onClick={() => update({ files: [...(data.files ?? data.outputs ?? []), { id: uuidv4(), name: '' }] })}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: '#009688' }}
          >
            <Plus size={11} /> Add
          </button>
        </div>
        {(data.files ?? data.outputs ?? []).length === 0
          ? <div className="text-xs text-gray-300 italic px-1">No files yet</div>
          : (data.files ?? data.outputs ?? []).map((file, idx) => (
            <div key={file.id} className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#009688' }} />
              <input
                value={file.name}
                onChange={(e) => {
                  const current = [...(data.files ?? data.outputs ?? [])]
                  current[idx] = { ...current[idx], name: e.target.value }
                  update({ files: current })
                }}
                placeholder="File name"
                className="flex-1 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400"
                style={{ borderRadius: 4 }}
              />
              <button
                onClick={() => update({ files: (data.files ?? data.outputs ?? []).filter((_, j) => j !== idx) })}
                className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))
        }
      </div>

      <Field label="Key-Value Pairs">
        <div className="flex flex-col gap-1">
          {(data.kvPairs ?? []).map((pair, i) => (
            <div key={pair.id} className="flex gap-1 items-center">
              <input
                value={pair.key}
                onChange={(e) => {
                  const next = [...data.kvPairs]
                  next[i] = { ...next[i], key: e.target.value }
                  update({ kvPairs: next })
                }}
                placeholder="key"
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400"
                style={{ borderRadius: 4 }}
              />
              <input
                value={pair.value}
                onChange={(e) => {
                  const next = [...data.kvPairs]
                  next[i] = { ...next[i], value: e.target.value }
                  update({ kvPairs: next })
                }}
                placeholder="value"
                className="flex-1 w-0 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400"
                style={{ borderRadius: 4 }}
              />
              <button
                onClick={() => update({ kvPairs: data.kvPairs.filter((_, j) => j !== i) })}
                className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5 h-6 flex items-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => update({ kvPairs: [...(data.kvPairs ?? []), { id: Date.now(), key: '', value: '' }] })}
            className="flex items-center gap-1 text-xs font-medium mt-0.5"
            style={{ color: '#009688' }}
          >
            <Plus size={11} /> Add pair
          </button>
        </div>
      </Field>
    </>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" style={{ borderRadius: 4 }} />
)
