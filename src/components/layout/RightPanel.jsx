import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import useVariableStore from '../../stores/variableStore'
import useLibraryStore from '../../stores/libraryStore'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import { Copy, Trash2, Layers, Plus, X, Upload, Download, FlaskConical, Package, Droplets, FileDown, Variable, Globe, Table2 } from 'lucide-react'
import DevicePicker from '../library/DevicePicker'
import { PROCESS_MODES } from '../nodes/ProcessNode'
import { v4 as uuidv4 } from 'uuid'

const CONTAINER_OPTIONS = [
  { value: 'well_96',     label: '96-well Plate' },
  { value: 'well_384',    label: '384-well Plate' },
  { value: 'well_6',      label: '6-well Plate' },
  { value: 'cryo_tube',   label: 'Cryo Tube' },
  { value: 'reservoir',   label: 'Reservoir' },
  { value: 'flask',       label: 'Flask' },
  { value: 'autoflask',   label: 'AutoFlask' },
  { value: 'bottle',      label: 'Bottle' },
  { value: 'tube_15',     label: '15 mL Tube' },
  { value: 'tube_50',     label: '50 mL Tube' },
  { value: 'deepwell_96', label: '96-well Deep Well' },
  { value: 'other',       label: 'Other' },
]

const CONC_UNITS = ['nM', 'µM', 'mM', 'M', 'mg/mL', 'µg/mL', 'ng/mL', 'cells/mL', '%', 'U/mL']
const VOL_UNITS  = ['µL', 'mL', 'L']
const STORAGE_TEMPS = ['RT', '4°C', '-20°C', '-80°C', 'LN2', 'Other']

/* ── ConnectedInputs: reads live graph edges ── */
function ConnectedInputs({ nodeId }) {
  const { nodes, edges } = useWorkflowStore()
  const incoming = edges.filter((e) => e.target === nodeId)
  if (incoming.length === 0) return null

  const NODE_COLORS = {
    sampleNode:     '#3b82f6',
    labwareNode:    '#06b6d4',
    reagentNode:    '#8b5cf6',
    dataNode:       '#009688',
    operationNode:  '#FF9933',
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">Connected Inputs</label>
      <div className="flex flex-col gap-1">
        {incoming.map((e) => {
          const src = nodes.find((n) => n.id === e.source)
          if (!src) return null
          const color = NODE_COLORS[src.type] ?? '#94a3b8'
          return (
            <div key={e.id} className="flex items-center gap-2 px-2 py-1 border border-gray-100 text-xs text-gray-600" style={{ borderRadius: 4 }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate">{src.data?.label ?? src.type}</span>
              <span className="ml-auto text-gray-300 capitalize flex-shrink-0">{src.type.replace('Node','')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Port type options ── */
const PORT_TYPE_OPTIONS = [
  { value: 'sample',     label: 'Sample',      color: '#3b82f6' },
  { value: 'reagent',    label: 'Reagent',     color: '#a78bfa' },
  { value: 'labware', label: 'Labware', color: '#06b6d4' },
  { value: 'info',    label: 'Info',    color: '#009688' },
]

function PortsEditor({ label, ports, onChange }) {
  const addPort = () => onChange([...ports, { id: uuidv4(), label: '', type: 'labware' }])
  const removePort = (id) => onChange(ports.filter((p) => p.id !== id))
  const updatePort = (id, patch) => onChange(ports.map((p) => p.id === id ? { ...p, ...patch } : p))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <button onClick={addPort} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#FF9933' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {ports.length === 0
        ? <div className="text-xs text-gray-300 italic px-1">No ports — click Add</div>
        : ports.map((port) => {
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

/* ── SampleNode properties ── */
function SampleNodeProps({ data, update }) {
  const samples = useLibraryStore((s) => s.samples)
  return (
    <>
      <Field label="Sample (from library)">
        <select
          value={data.sampleId ?? ''}
          onChange={(e) => {
            const s = samples.find((x) => x.id === e.target.value)
            update({ sampleId: e.target.value || null, sampleName: s?.name ?? '' })
          }}
          className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}
        >
          <option value="">— custom / unlisted —</option>
          {samples.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      {!data.sampleId && (
        <Field label="Sample name">
          <Input value={data.sampleName} onChange={(v) => update({ sampleName: v })} placeholder="e.g. HEK293T" />
        </Field>
      )}
      <Field label="Container type">
        <select value={data.containerType ?? 'well_96'} onChange={(e) => update({ containerType: e.target.value })}
          className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
          {CONTAINER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Quantity / count">
        <Input value={data.quantity} onChange={(v) => update({ quantity: v })} placeholder="e.g. 4 plates, 2 vials" />
      </Field>
      <Field label="Concentration">
        <div className="flex gap-2">
          <Input value={data.concentration} onChange={(v) => update({ concentration: v })} placeholder="e.g. 50" />
          <select value={data.concentrationUnit ?? 'nM'} onChange={(e) => update({ concentrationUnit: e.target.value })}
            className="w-24 border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none" style={{ borderRadius: 4 }}>
            {CONC_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </Field>
      <Field label="Volume">
        <div className="flex gap-2">
          <Input value={data.volume} onChange={(v) => update({ volume: v })} placeholder="e.g. 100" />
          <select value={data.volumeUnit ?? 'µL'} onChange={(e) => update({ volumeUnit: e.target.value })}
            className="w-20 border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none" style={{ borderRadius: 4 }}>
            {VOL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </Field>
      <Field label="Storage temperature">
        <select value={data.storageTemp ?? ''} onChange={(e) => update({ storageTemp: e.target.value })}
          className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
          <option value="">— not specified —</option>
          {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Notes">
        <Textarea value={data.notes} onChange={(v) => update({ notes: v })} placeholder="Additional info..." rows={2} />
      </Field>
    </>
  )
}

/* ── ConsumableNode properties ── */
function ConsumableNodeProps({ data, update }) {
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

/* ── ReagentNode properties ── */
function ReagentNodeProps({ data, update }) {
  const items = data.items ?? []
  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    update({ items: next })
  }
  const removeItem = (idx) => update({ items: items.filter((_, i) => i !== idx) })
  const addItem = () => update({ items: [...items, { id: uuidv4(), name: '', concentration: '', unit: 'µM', volume: '', volumeUnit: 'µL', catalogNumber: '', vendor: '', storageCondition: '' }] })

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


const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text', min }) => (
  <input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" style={{ borderRadius: 4 }} />
)

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" style={{ borderRadius: 4 }} />
)

function VariableSelect({ value, onChange }) {
  const variables = useVariableStore((s) => s.variables)
  return (
    <div>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400 font-mono" style={{ borderRadius: 4 }}>
        <option value="">-- select variable --</option>
        {variables.map((v) => <option key={v.id} value={v.name}>{v.name} ({v.type})</option>)}
      </select>
    </div>
  )
}

function ActionBar({ onCopy, onDelete, isExperiment }) {
  return (
    <div className="flex gap-2 px-3 pt-2 pb-1">
      {!isExperiment && (
        <button onClick={onCopy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          style={{ borderRadius: 4 }}>
          <Copy size={13} /> Copy
        </button>
      )}
      <button onClick={onDelete}
        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
        style={{ borderRadius: 4 }}>
        <Trash2 size={13} /> Delete
      </button>
    </div>
  )
}

function NodeProps({ node, edges, update, onCopy, onDelete, onUngroup }) {
  const { data, type } = node
  const isExperiment = type === 'experimentNode'

  return (
    <div className="flex flex-col">
      <ActionBar onCopy={onCopy} onDelete={onDelete} isExperiment={isExperiment} />
      <div className="border-t border-gray-100 mx-3 mb-2" />

      <div className="px-3 flex flex-col gap-3 pb-3">
        <Field label="Label">
          <Input value={data.label} onChange={(v) => update({ label: v })} />
        </Field>

        {isExperiment && <>
          <Field label="Description">
            <Textarea value={data.description} onChange={(v) => update({ description: v })}
              placeholder="Describe this experiment..." rows={2} />
          </Field>
          <button onClick={onUngroup}
            className="w-full h-8 border-2 border-dashed text-sm transition-colors font-medium inline-flex items-center justify-center gap-1.5"
            style={{ borderColor: '#CC0000', color: '#CC0000', borderRadius: 4 }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Layers size={13} /> Ungroup Experiment
          </button>
        </>}

        {type === 'operationNode' && <>
          {/* ── Input ports: read-only, derived from live labwareEdge connections ── */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Input Ports</label>
              <span className="text-xs text-gray-300 italic">auto-connected</span>
            </div>
            {(() => {
              const liveInputs = edges
                .filter((e) => e.target === node.id && e.type === 'labwareEdge')
                .map((e) => ({
                  id: e.id,
                  label: e.data?.portLabel ?? '',
                  type: e.data?.portType ?? 'consumable',
                }))
              if (liveInputs.length === 0) {
                return <div className="text-xs text-gray-300 italic px-1">No inputs connected</div>
              }
              return liveInputs.map((port) => {
                const typeOpt = PORT_TYPE_OPTIONS.find((o) => o.value === port.type) ?? PORT_TYPE_OPTIONS[2]
                return (
                  <div key={port.id} className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeOpt.color }} />
                    <span className="text-xs text-gray-500 truncate">{port.label || <span className="italic text-gray-300">unnamed</span>}</span>
                    <span className="ml-auto text-xs flex-shrink-0 px-1 py-0.5" style={{ color: typeOpt.color, backgroundColor: typeOpt.color + '1a', borderRadius: 3 }}>{typeOpt.label}</span>
                  </div>
                )
              })
            })()}
          </div>
          {/* ── Output ports: manually editable ── */}
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
              className="w-full border border-gray-200 px-2 py-1.5 text-sm focus:outline-none bg-white" style={{ borderRadius: 4 }}>
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
          <Field label="Variable">
            <VariableSelect value={data.variableName} onChange={(v) => update({ variableName: v })} />
          </Field>
          <Field label="Expression">
            <Input value={data.expression} onChange={(v) => update({ expression: v })} placeholder="e.g. 200 * replicates" />
          </Field>
        </>}

        {type === 'processNode' && <>
          {/* Mode selector */}
          <Field label="Mode">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(PROCESS_MODES).map(([key, m]) => {
                const Icon = m.icon
                const active = (data.mode ?? 'export') === key
                return (
                  <button
                    key={key}
                    onClick={() => update({ mode: key })}
                    className="flex items-center gap-1.5 px-2 py-1.5 border text-xs transition-all"
                    style={{
                      borderRadius: 4,
                      borderColor: active ? '#7c3aed' : '#e5e7eb',
                      backgroundColor: active ? '#f5f3ff' : 'white',
                      color: active ? '#7c3aed' : '#6b7280',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Icon size={11} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Description">
            <Textarea value={data.description} onChange={(v) => update({ description: v })}
              placeholder="Describe what this step does..." rows={2} />
          </Field>

          {/* Named data inputs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Data Inputs</label>
              <button
                onClick={() => update({ inputs: [...(data.inputs ?? []), { id: uuidv4(), name: '' }] })}
                className="flex items-center gap-1 text-xs font-medium" style={{ color: '#7c3aed' }}
              >
                <Plus size={11} /> Add
              </button>
            </div>
            {(data.inputs ?? []).length === 0
              ? <div className="text-xs text-gray-300 italic px-1">No inputs — connect DataNode outputs</div>
              : (data.inputs ?? []).map((inp, idx) => (
                <div key={inp.id} className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#009688' }} />
                  <input
                    value={inp.name}
                    onChange={(e) => {
                      const next = [...data.inputs]
                      next[idx] = { ...next[idx], name: e.target.value }
                      update({ inputs: next })
                    }}
                    placeholder="Input name"
                    className="flex-1 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-purple-400"
                    style={{ borderRadius: 4 }}
                  />
                  <button
                    onClick={() => update({ inputs: data.inputs.filter((_, j) => j !== idx) })}
                    className="text-gray-300 hover:text-red-400 flex-shrink-0 px-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            }
          </div>

          {/* Mode-specific settings */}
          {(data.mode ?? 'export') === 'export' && <>
            <Field label="Destination">
              <Input value={data.destination} onChange={(v) => update({ destination: v })}
                placeholder="e.g. results/assay_data.csv" />
            </Field>
            <Field label="Format">
              <select value={data.format ?? 'csv'} onChange={(e) => update({ format: e.target.value })}
                className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-purple-400" style={{ borderRadius: 4 }}>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="tsv">TSV</option>
              </select>
            </Field>
          </>}

          {data.mode === 'variable' && <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Assignments</label>
                <button
                  onClick={() => update({ assignments: [...(data.assignments ?? []), { id: uuidv4(), variable: '', expression: '' }] })}
                  className="flex items-center gap-1 text-xs font-medium" style={{ color: '#7c3aed' }}
                >
                  <Plus size={11} /> Add
                </button>
              </div>
              {(data.assignments ?? []).length === 0
                ? <div className="text-xs text-gray-300 italic px-1">No assignments</div>
                : (data.assignments ?? []).map((a, idx) => (
                  <div key={a.id} className="flex flex-col gap-1 mb-2 border border-gray-100 p-1.5" style={{ borderRadius: 4 }}>
                    <div className="flex items-center gap-1">
                      <Variable size={10} style={{ color: '#7c3aed', flexShrink: 0 }} />
                      <VariableSelect
                        value={a.variable}
                        onChange={(v) => {
                          const next = [...data.assignments]
                          next[idx] = { ...next[idx], variable: v }
                          update({ assignments: next })
                        }}
                      />
                      <button
                        onClick={() => update({ assignments: data.assignments.filter((_, j) => j !== idx) })}
                        className="text-gray-300 hover:text-red-400 flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <input
                      value={a.expression}
                      onChange={(e) => {
                        const next = [...data.assignments]
                        next[idx] = { ...next[idx], expression: e.target.value }
                        update({ assignments: next })
                      }}
                      placeholder="= expression or value"
                      className="w-full border border-gray-200 px-2 py-1 text-xs font-mono focus:outline-none focus:border-purple-400"
                      style={{ borderRadius: 4 }}
                    />
                  </div>
                ))
              }
            </div>
          </>}

          {data.mode === 'webhook' && <>
            <Field label="URL">
              <Input value={data.webhookUrl} onChange={(v) => update({ webhookUrl: v })}
                placeholder="https://api.example.com/endpoint" />
            </Field>
            <Field label="Method">
              <select value={data.webhookMethod ?? 'POST'} onChange={(e) => update({ webhookMethod: e.target.value })}
                className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-purple-400" style={{ borderRadius: 4 }}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </Field>
          </>}
        </>}

        {type === 'notificationNode' && <>
          <Field label="Note type">
            <select value={data.noteType ?? 'note'} onChange={(e) => update({ noteType: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
              <option value="note">📝 Note</option>
              <option value="question">❓ Question</option>
              <option value="warning">⚠️ Warning</option>
              <option value="info">ℹ️ Info</option>
            </select>
          </Field>
          <Field label="Message">
            <Textarea value={data.message} onChange={(v) => update({ message: v })}
              placeholder="Write your note here..." rows={4} />
          </Field>
        </>}

        {type === 'sampleNode' && <SampleNodeProps data={data} update={update} />}
        {type === 'consumableNode' && <ConsumableNodeProps data={data} update={update} />}
        {type === 'reagentNode' && <ReagentNodeProps data={data} update={update} />}

        {type === 'parallelNode' && (
          <Field label="Branch count">
            <div className="flex items-center gap-3">
              <button
                onClick={() => update({ branches: Math.max(2, (data.branches ?? 2) - 1) })}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 text-base font-medium"
                style={{ borderRadius: 4 }}
              >−</button>
              <span className="text-sm font-semibold text-gray-700 w-4 text-center">
                {data.branches ?? 2}
              </span>
              <button
                onClick={() => update({ branches: Math.min(8, (data.branches ?? 2) + 1) })}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 text-base font-medium"
                style={{ borderRadius: 4 }}
              >+</button>
              <span className="text-xs text-gray-400 ml-1">max 8</span>
            </div>
          </Field>
        )}

        {type === 'dataNode' && <>
          <Field label="Description">
            <Textarea value={data.description} onChange={(v) => update({ description: v })}
              placeholder="Describe this data node..." rows={2} />
          </Field>

          {/* Outputs — named data outputs with individual connection handles */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Outputs</label>
              <button
                onClick={() => update({ outputs: [...(data.outputs ?? []), { id: uuidv4(), name: '' }] })}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: '#009688' }}
              >
                <Plus size={11} /> Add
              </button>
            </div>
            {(data.outputs ?? []).length === 0
              ? <div className="text-xs text-gray-300 italic px-1">No named outputs — drag from the node's right handle</div>
              : (data.outputs ?? []).map((output, idx) => (
                <div key={output.id} className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#009688' }} />
                  <input
                    value={output.name}
                    onChange={(e) => {
                      const next = [...data.outputs]
                      next[idx] = { ...next[idx], name: e.target.value }
                      update({ outputs: next })
                    }}
                    placeholder="Output name"
                    className="flex-1 border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-400"
                    style={{ borderRadius: 4 }}
                  />
                  <button
                    onClick={() => update({ outputs: data.outputs.filter((_, j) => j !== idx) })}
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

          {/* Import interface - reserved */}
          <Field label="File Imports">
            <div className="border border-dashed border-gray-200 px-3 py-2.5 flex flex-col items-center gap-1" style={{ borderRadius: 4 }}>
              <Upload size={14} className="text-gray-200" />
              <div className="text-xs text-gray-300 italic text-center">File import interface<br />— coming soon —</div>
            </div>
          </Field>

          {/* Export settings */}
          <Field label="Exports">
            <div className="flex flex-col gap-2">
              {[['metadata', 'Metadata'], ['rawData', 'Raw Data']].map(([key, label]) => {
                const exp = data.exports?.[key] ?? { enabled: false, variables: [] }
                const variables = useVariableStore.getState().variables
                const toggleVar = (name) => {
                  const cur = exp.variables ?? []
                  const next = cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name]
                  update({ exports: { ...(data.exports ?? {}), [key]: { ...exp, variables: next } } })
                }
                return (
                  <div key={key} className="border border-gray-100" style={{ borderRadius: 4 }}>
                    <label className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.enabled}
                        onChange={(e) => update({ exports: { ...(data.exports ?? {}), [key]: { ...exp, enabled: e.target.checked } } })}
                        className="accent-teal-600"
                      />
                      <Download size={10} className="text-gray-400" />
                      <span>{label}</span>
                      {exp.variables?.length > 0 && (
                        <span className="ml-auto text-gray-400 font-normal">{exp.variables.length} var{exp.variables.length > 1 ? 's' : ''}</span>
                      )}
                    </label>
                    {exp.enabled && (
                      <div className="border-t border-gray-100 px-2.5 py-1.5 flex flex-col gap-1">
                        <div className="text-xs text-gray-400 mb-0.5">Variables to export:</div>
                        {variables.length === 0
                          ? <div className="text-xs text-gray-300 italic">No variables defined</div>
                          : variables.map((v) => (
                            <label key={v.id} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={exp.variables?.includes(v.name) ?? false}
                                onChange={() => toggleVar(v.name)}
                                className="accent-teal-600"
                              />
                              <span className="font-mono">{v.name}</span>
                              <span className="text-gray-300">({v.type})</span>
                            </label>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Field>
        </>}

        <div className="pt-1 border-t border-gray-100">
          <div className="text-xs text-gray-300 font-mono truncate">ID: {node.id?.slice(0, 18)}…</div>
        </div>
      </div>
    </div>
  )
}

function EdgeProps({ edge, updateEdge, onDelete }) {
  return (
    <div className="flex flex-col">
      <div className="px-3 pt-2 pb-1">
        <button onClick={onDelete}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
          style={{ borderRadius: 4 }}>
          <Trash2 size={13} /> Delete Connection
        </button>
      </div>
      <div className="border-t border-gray-100 mx-3 mb-2" />
      <div className="px-3 flex flex-col gap-3 pb-3">
        <Field label="Flow type">
          <div className="flex flex-col gap-1.5 mt-1">
            {EDGE_PALETTE.map((ep) => (
              <button key={ep.type} onClick={() => updateEdge({ type: ep.type })}
                className={`flex items-center gap-2.5 p-2 border w-full text-left transition-colors ${edge.type === ep.type ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                style={{ borderRadius: 4 }}>
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
    </div>
  )
}

export default function RightPanel({ width = 240 }) {
  const { selectedNodeId, selectedEdgeId } = useUiStore()
  const { nodes, edges, updateNodeData, updateEdgeData, deleteNode, deleteEdge, copyNode, ungroupExperimentNode } = useWorkflowStore()
  const { clearSelection } = useUiStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  const handleDeleteNode = () => { deleteNode(selectedNodeId); clearSelection() }
  const handleDeleteEdge = () => { deleteEdge(selectedEdgeId); clearSelection() }
  const handleCopyNode   = () => copyNode(selectedNodeId)

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="bg-gray-50 border-l border-gray-200 flex items-center justify-center flex-shrink-0" style={{ width }}>
        <div className="text-center text-gray-300 p-6">
          <div className="text-3xl mb-2">✦</div>
          <div className="text-xs">Click a node or connection to edit</div>
        </div>
      </div>
    )
  }

  const typeLabel = selectedNode?.type === 'experimentNode'
    ? 'Experiment group'
    : selectedNode?.type?.replace('Node', '') + ' node'

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col flex-shrink-0" style={{ width }}>
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</div>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">
          {selectedNode ? typeLabel : 'Connection'}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
      {selectedNode && (
        <NodeProps
          node={selectedNode}
          edges={edges}
          update={(p) => updateNodeData(selectedNode.id, p)}
          onCopy={handleCopyNode}
          onDelete={handleDeleteNode}
          onUngroup={() => ungroupExperimentNode(selectedNodeId)}
        />
      )}
      {selectedEdge && (
        <EdgeProps
          edge={selectedEdge}
          updateEdge={(p) => updateEdgeData(selectedEdge.id, p)}
          onDelete={handleDeleteEdge}
        />
      )}
      </div>
    </div>
  )
}
