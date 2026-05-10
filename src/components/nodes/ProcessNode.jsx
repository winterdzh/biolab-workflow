import { Handle, Position } from '@xyflow/react'
import { Cpu, FileDown, Variable, AlertTriangle, Table2, Webhook } from 'lucide-react'

const C = '#7c3aed'   // violet — process/info control

// Mode metadata
export const PROCESS_MODES = {
  export:    { label: 'Export Data',      icon: FileDown,    color: '#7c3aed', desc: 'Write data to CSV / external system' },
  variable:  { label: 'Set Variables',    icon: Variable,    color: '#7c3aed', desc: 'Compute & assign workflow variables'  },
  transform: { label: 'Transform',        icon: Table2,      color: '#7c3aed', desc: 'Reshape or aggregate data'            },
  webhook:   { label: 'Webhook / Notify', icon: Webhook,     color: '#7c3aed', desc: 'Send HTTP request or notification'    },
}

export default function ProcessNode({ data, selected }) {
  const mode      = data.mode ?? 'export'
  const modeInfo  = PROCESS_MODES[mode] ?? PROCESS_MODES.export
  const ModeIcon  = modeInfo.icon
  const inputs    = data.inputs  ?? []   // labeled data input ports
  const hasInputs = inputs.length > 0

  return (
    <div
      className="bg-white border shadow-sm transition-all"
      style={{
        borderColor: selected ? C : '#c4b5fd',
        borderRadius: 6,
        width: 200,
        boxShadow: selected ? `0 0 0 3px ${C}22` : '0 1px 4px rgba(0,0,0,0.10)',
      }}
    >
      {/* Workflow flow handles */}
      <Handle
        id="flow-in"
        type="target"
        position={Position.Left}
        style={{ top: 18, backgroundColor: C, width: 14, height: 14, border: '2px solid white' }}
      />
      <Handle
        id="flow-out"
        type="source"
        position={Position.Right}
        style={{ top: 18, backgroundColor: C, width: 14, height: 14, border: '2px solid white' }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', minHeight: 36 }}
      >
        <Cpu size={12} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm leading-tight truncate flex-1">
          {data.label}
        </span>
      </div>

      {/* Mode badge */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
        <ModeIcon size={11} style={{ color: C, flexShrink: 0 }} />
        <span className="text-xs font-medium" style={{ color: C }}>{modeInfo.label}</span>
      </div>

      {/* Named data inputs list */}
      {hasInputs && (
        <div className="px-3 pb-2 flex flex-col gap-0.5">
          {inputs.map((inp) => (
            <div key={inp.id} className="relative flex items-center gap-1.5 text-xs text-gray-500" style={{ height: 20 }}>
              <Handle
                id={`in-${inp.id}`}
                type="target"
                position={Position.Left}
                style={{
                  position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                  width: 10, height: 10, backgroundColor: '#009688',
                  border: '2px solid white', borderRadius: '50%',
                }}
              />
              <div className="w-1.5 h-1.5 rounded-full ml-2 flex-shrink-0" style={{ backgroundColor: '#009688' }} />
              <span className="truncate">{inp.name || <span className="italic text-gray-300">unnamed</span>}</span>
            </div>
          ))}
        </div>
      )}

      {!hasInputs && (
        <div className="px-3 pb-2 text-xs text-gray-300 italic">
          No data inputs
        </div>
      )}

      {/* Export destination / assignment preview */}
      {mode === 'export' && data.destination && (
        <div className="mx-3 mb-2 px-2 py-1 text-xs text-gray-500 border border-gray-100 rounded truncate" style={{ borderRadius: 4 }}>
          → {data.destination}
        </div>
      )}
      {mode === 'variable' && (data.assignments ?? []).length > 0 && (
        <div className="mx-3 mb-2 flex flex-col gap-0.5">
          {data.assignments.slice(0, 3).map((a, i) => (
            <div key={i} className="text-xs text-gray-500 font-mono truncate">
              <span style={{ color: C }}>{a.variable}</span>
              {a.expression ? <span className="text-gray-400"> = {a.expression}</span> : null}
            </div>
          ))}
          {data.assignments.length > 3 && (
            <div className="text-xs text-gray-300">+{data.assignments.length - 3} more</div>
          )}
        </div>
      )}

      {/* Warning: no destination configured */}
      {mode === 'export' && !data.destination && (
        <div className="mx-3 mb-2 flex items-center gap-1 text-xs text-amber-400">
          <AlertTriangle size={10} />
          <span>No destination set</span>
        </div>
      )}
    </div>
  )
}
