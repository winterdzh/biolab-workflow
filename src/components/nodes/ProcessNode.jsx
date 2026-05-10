import { Handle, Position, useConnection } from '@xyflow/react'
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
  const connection = useConnection()
  const mode      = data.mode ?? 'export'
  const modeInfo  = PROCESS_MODES[mode] ?? PROCESS_MODES.export
  const ModeIcon  = modeInfo.icon
  const inputs    = data.inputs  ?? []   // labeled data input ports
  const hasInputs = inputs.length > 0
  const inputZoneHeight = hasInputs ? Math.max(inputs.length * 21 + 8, 42) : 42
  const sourceHandleId = connection?.fromHandle?.id ?? ''
  const showDropZone = Boolean(connection?.inProgress && (sourceHandleId.startsWith('out-') || sourceHandleId === 'mat-out'))

  return (
    <div
      className="bg-white border shadow-sm transition-all"
      style={{
        borderColor: selected ? 'rgba(124,58,237,0.35)' : 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        width: 200,
        background: 'rgba(255,255,255,0.9)',
        boxShadow: selected ? '0 0 0 3px rgba(124,58,237,0.22), 0 4px 24px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.09)',
      }}
    >
      {/* Workflow flow handles */}
      <Handle
        id="flow-in"
        type="target"
        position={Position.Left}
        style={{ top: 18, backgroundColor: '#64748b', width: 14, height: 14, border: '2px solid white' }}
      />
      <Handle
        id="flow-out"
        type="source"
        position={Position.Right}
        style={{ top: 18, backgroundColor: '#64748b', width: 14, height: 14, border: '2px solid white' }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)', minHeight: 36 }}
      >
        <Cpu size={12} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-[13px] tracking-[-0.01em] text-gray-800 leading-tight truncate flex-1">
          {data.label}
        </span>
      </div>

      {/* Mode badge */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
        <ModeIcon size={11} style={{ color: C, flexShrink: 0 }} />
        <span className="text-[11px] font-medium" style={{ color: C }}>{modeInfo.label}</span>
      </div>

      {/* Named data inputs list */}
      {hasInputs && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 relative">
          {inputs.map((inp) => (
            <div key={inp.id} className="relative flex items-center gap-1.5 text-[11px] text-gray-500" style={{ height: 21 }}>
              <Handle
                id={`in-${inp.id}`}
                type="target"
                position={Position.Left}
                style={{
                  position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                  width: 10, height: 10, backgroundColor: '#009688',
                  border: '2px solid white', borderRadius: '50%',
                  zIndex: 2,
                }}
              />
              <div className="w-1.5 h-1.5 rounded-full ml-2 flex-shrink-0" style={{ backgroundColor: '#009688' }} />
              <span className="truncate">{inp.name || <span className="italic text-gray-300">unnamed</span>}</span>
            </div>
          ))}
          <Handle
            id="new-input"
            type="target"
            position={Position.Left}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: inputZoneHeight,
              transform: 'none',
              border: 'none',
              backgroundColor: 'transparent',
              opacity: 0,
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: inputZoneHeight,
              border: showDropZone ? '1.5px dashed rgba(124,58,237,0.45)' : '1.5px dashed transparent',
              backgroundColor: showDropZone ? 'rgba(124,58,237,0.06)' : 'transparent',
              borderRadius: 8,
              opacity: showDropZone ? 1 : 0,
              transition: 'opacity 140ms ease, border-color 140ms ease, background-color 140ms ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </div>
      )}

      {!hasInputs && (
        <div className="px-3 pb-2 relative">
          <Handle
            id="new-input"
            type="target"
            position={Position.Left}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: inputZoneHeight,
              transform: 'none',
              border: 'none',
              backgroundColor: 'transparent',
              opacity: 0,
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: inputZoneHeight,
              border: showDropZone ? '1.5px dashed rgba(124,58,237,0.45)' : '1.5px dashed transparent',
              backgroundColor: showDropZone ? 'rgba(124,58,237,0.06)' : 'transparent',
              borderRadius: 8,
              opacity: showDropZone ? 1 : 0,
              transition: 'opacity 140ms ease, border-color 140ms ease, background-color 140ms ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div className="text-[11px] text-gray-300 italic">
            No data inputs
          </div>
        </div>
      )}

      {/* Export destination / assignment preview */}
      {mode === 'export' && data.destination && (
        <div className="mx-3 mb-2 px-2 py-1 text-[11px] text-gray-500 border border-gray-100 rounded truncate" style={{ borderRadius: 8 }}>
          → {data.destination}
        </div>
      )}
      {mode === 'variable' && (data.assignments ?? []).length > 0 && (
        <div className="mx-3 mb-2 flex flex-col gap-0.5">
          {data.assignments.slice(0, 3).map((a, i) => (
            <div key={i} className="text-[11px] text-gray-500 font-mono truncate">
              <span style={{ color: C }}>{a.variable}</span>
              {a.expression ? <span className="text-gray-400"> = {a.expression}</span> : null}
            </div>
          ))}
          {data.assignments.length > 3 && (
            <div className="text-[11px] text-gray-300">+{data.assignments.length - 3} more</div>
          )}
        </div>
      )}

      {/* Warning: no destination configured */}
      {mode === 'export' && !data.destination && (
        <div className="mx-3 mb-2 flex items-center gap-1 text-[11px] text-amber-400">
          <AlertTriangle size={10} />
          <span>No destination set</span>
        </div>
      )}
    </div>
  )
}
