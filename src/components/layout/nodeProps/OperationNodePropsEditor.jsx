import { Plus, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import DevicePicker from '../../library/DevicePicker'

const PORT_TYPE_OPTIONS = [
  { value: 'sample', label: 'Sample', color: '#3b82f6' },
  { value: 'reagent', label: 'Reagent', color: '#a78bfa' },
  { value: 'labware', label: 'Labware', color: '#06b6d4' },
  { value: 'info', label: 'Info', color: '#009688' },
]

function PortsEditor({ label, ports, onChange }) {
  const addPort = () => onChange([...(ports ?? []), { id: uuidv4(), label: '', type: 'labware' }])
  const removePort = (id) => onChange((ports ?? []).filter((p) => p.id !== id))
  const updatePort = (id, patch) => onChange((ports ?? []).map((p) => p.id === id ? { ...p, ...patch } : p))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <button onClick={addPort} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#FF9933' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {(ports ?? []).length === 0
        ? <div className="text-xs text-gray-300 italic px-1">No ports — click Add</div>
        : (ports ?? []).map((port) => {
          const typeOpt = PORT_TYPE_OPTIONS.find((o) => o.value === port.type) ?? PORT_TYPE_OPTIONS[2]
          return (
            <div key={port.id} className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeOpt.color }} />
              <select
                value={port.type}
                onChange={(e) => updatePort(port.id, { type: e.target.value })}
                className="border border-gray-200 text-xs bg-white focus:outline-none px-1 py-1 flex-shrink-0"
                style={{ borderRadius: 4, width: 82 }}
              >
                {PORT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input
                value={port.label}
                onChange={(e) => updatePort(port.id, { label: e.target.value })}
                placeholder="Port name"
                className="flex-1 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-orange-300"
                style={{ borderRadius: 4, minWidth: 0 }}
              />
              <button onClick={() => removePort(port.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                <X size={12} />
              </button>
            </div>
          )
        })
      }
    </div>
  )
}

export default function OperationNodePropsEditor({ node, edges, data, update }) {
  const liveInputs = edges
    .filter((e) => e.target === node.id && e.type === 'labwareEdge')
    .map((e) => ({
      id: e.id,
      label: e.data?.portLabel ?? '',
      type: e.data?.portType ?? 'consumable',
    }))

  return (
    <>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-500">Input Ports</label>
          <span className="text-xs text-gray-300 italic">auto-connected</span>
        </div>
        {liveInputs.length === 0
          ? <div className="text-xs text-gray-300 italic px-1">No inputs connected</div>
          : liveInputs.map((port) => {
            const typeOpt = PORT_TYPE_OPTIONS.find((o) => o.value === port.type) ?? PORT_TYPE_OPTIONS[2]
            return (
              <div key={port.id} className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeOpt.color }} />
                <span className="text-xs text-gray-500 truncate">{port.label || <span className="italic text-gray-300">unnamed</span>}</span>
                <span className="ml-auto text-xs flex-shrink-0 px-1 py-0.5" style={{ color: typeOpt.color, backgroundColor: typeOpt.color + '1a', borderRadius: 3 }}>{typeOpt.label}</span>
              </div>
            )
          })
        }
      </div>

      <PortsEditor
        label="Output Ports"
        ports={data.outputs ?? []}
        onChange={(ports) => update({ outputs: ports })}
      />
      <Field label="Device"><DevicePicker value={data.device} onChange={(v) => update({ device: v })} /></Field>
      <Field label="Description">
        <Textarea value={data.description} onChange={(v) => update({ description: v })} placeholder="Describe this operation..." />
      </Field>
      <Field label="Notes">
        <Textarea value={data.notes} onChange={(v) => update({ notes: v })} placeholder="Additional notes..." rows={2} />
      </Field>
      <Field label="Duration">
        <div className="flex gap-2">
          <input type="number" min={0} value={data.duration?.value ?? 0}
            onChange={(e) => update({ duration: { ...data.duration, value: Number(e.target.value) } })}
            className="w-20 border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }} />
          <select value={data.duration?.unit ?? 'min'}
            onChange={(e) => update({ duration: { ...data.duration, unit: e.target.value } })}
            className="flex-1 border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none" style={{ borderRadius: 4 }}>
            <option value="sec">sec</option>
            <option value="min">min</option>
            <option value="hr">hr</option>
          </select>
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
