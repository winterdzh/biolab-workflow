import { Plus, X, Variable } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import useVariableStore from '../../../stores/variableStore'
import { PROCESS_MODES } from '../../nodes/ProcessNode'

export default function ProcessNodePropsEditor({ data, update }) {
  return (
    <>
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

      {data.mode === 'variable' && <VariableAssignments data={data} update={update} />}

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
    </>
  )
}

function VariableAssignments({ data, update }) {
  return (
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
  )
}

function VariableSelect({ value, onChange }) {
  const variables = useVariableStore((s) => s.variables)
  return (
    <div className="flex-1">
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400 font-mono" style={{ borderRadius: 4 }}>
        <option value="">-- select variable --</option>
        {variables.map((v) => <option key={v.id} value={v.name}>{v.name} ({v.type})</option>)}
      </select>
    </div>
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
