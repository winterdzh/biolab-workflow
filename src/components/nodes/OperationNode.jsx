import { useCallback } from 'react'
import { Handle, Position, useConnection, useNodeId, useStore } from '@xyflow/react'
import { Settings, Cpu, Clock, Droplets, RotateCw, Camera, BarChart2, Activity, Scissors, Layers, Server, Wrench, Zap } from 'lucide-react'
import useLibraryStore from '../../stores/libraryStore'

const C = '#3b82f6'   // blue — operation

// Category → fallback icon when no device image is available
const CATEGORY_FALLBACK_ICONS = {
  'Liquid Handler':           Droplets,
  'Centrifuge':               RotateCw,
  'Reader':                   BarChart2,
  'Plate Reader':             BarChart2,
  'Imaging Reader':           Camera,
  'Plate Washer':             Droplets,
  'Plate Sealer':             Layers,
  'Plate Peeler':             Scissors,
  'qPCR':                     Activity,
  'LC-MS':                    BarChart2,
  'Oligo Synthesizer':        Zap,
  'Plate Hotel / Incubator':  Server,
  'Plate Carousel':           Server,
  'Custom System':            Wrench,
  'Waste':                    Wrench,
}

// Port type → color
export const PORT_COLORS = {
  sample:   '#3b82f6',  // blue
  reagent:  '#8b5cf6',  // purple
  labware:  '#06b6d4',  // cyan
  info:     '#009688',  // teal
}

// Row height per port
const PORT_ROW_H = 22
// Fixed width for input/output columns
const SIDE_COL_W = 116

export default function OperationNode({ data, selected }) {
  const nodeId = useNodeId()
  const connection = useConnection()
  // Derive inputs reactively from incoming labwareEdges
  const incomingEdges = useStore(
    useCallback((s) => s.edges.filter((e) => e.target === nodeId && e.type === 'labwareEdge'), [nodeId])
  )
  const computedInputs = incomingEdges.map((e) => ({
    handleId: e.targetHandle ?? `in-${e.id}`,
    label:    e.data?.portLabel ?? '',
    type:     e.data?.portType  ?? 'consumable',
  }))

  // Live device image (updates immediately when library is edited)
  const deviceImageUrl = useLibraryStore(
    (s) => data.device?.id ? (s.devices.find((d) => d.id === data.device.id)?.imageUrl ?? '') : ''
  )
  const FallbackIcon = (!deviceImageUrl && data.device?.category)
    ? (CATEGORY_FALLBACK_ICONS[data.device.category] ?? null)
    : null

  const outputs   = data.outputs ?? []
  const maxPorts  = Math.max(computedInputs.length, outputs.length, 1)
  const portsH    = maxPorts * PORT_ROW_H + 8
  const sourceHandleId = connection?.fromHandle?.id ?? ''
  const showDropZone = Boolean(connection?.inProgress && (sourceHandleId.startsWith('out-') || sourceHandleId === 'mat-out'))

  return (
    <div
      className="bg-white border shadow-sm transition-all"
      style={{
        borderColor: selected ? 'rgba(59,130,246,0.35)' : 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        width: 360,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: selected ? '0 0 0 3px rgba(0,122,255,0.25), 0 4px 24px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Flow handles (top of left/right edge) ── */}
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

      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderColor: 'rgba(0,0,0,0.05)', minHeight: 36 }}
      >
        <Settings size={12} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-[13px] tracking-[-0.01em] text-gray-800 leading-tight truncate">{data.label}</span>
      </div>

      {/* ── 3-column ports area ── */}
      <div className="flex" style={{ minHeight: portsH + 24 }}>

        {/* ── Left column: Inputs (auto-derived from edges) ── */}
        <div
          className="flex flex-col justify-start gap-0 relative"
          style={{ width: SIDE_COL_W, flexShrink: 0, paddingTop: 4, paddingBottom: 4 }}
        >
          {computedInputs.map((inp) => {
            const color = PORT_COLORS[inp.type] ?? PORT_COLORS.labware
            return (
              <div key={inp.handleId} className="flex items-center relative" style={{ height: PORT_ROW_H }}>
                <Handle
                  id={inp.handleId}
                  type="target"
                  position={Position.Left}
                  style={{
                    position: 'absolute',
                    left: -8, top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: color, width: 12, height: 12,
                    border: '2px solid white', borderRadius: '50%',
                    zIndex: 2,
                  }}
                />
                <span
                  className="text-[11px] pl-3 pr-1 truncate leading-tight"
                  style={{ color: '#777', maxWidth: SIDE_COL_W - 12 }}
                  title={inp.label}
                >
                  {inp.label || <span className="italic text-gray-300">input</span>}
                </span>
              </div>
            )
          })}
          {computedInputs.length === 0 && (
            <div className="text-[11px] text-gray-200 italic px-3 py-1">no inputs</div>
          )}
          {/* ── Hidden wide drop-zone: accepts new connections from object nodes ── */}
          <Handle
            id="new-input"
            type="target"
            position={Position.Left}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: SIDE_COL_W,
              height: '100%',
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
              width: SIDE_COL_W,
              height: '100%',
              border: showDropZone ? '1.5px dashed rgba(14,165,233,0.45)' : '1.5px dashed transparent',
              backgroundColor: showDropZone ? 'rgba(14,165,233,0.06)' : 'transparent',
              borderRadius: 10,
              opacity: showDropZone ? 1 : 0,
              transition: 'opacity 140ms ease, border-color 140ms ease, background-color 140ms ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </div>

        {/* ── Left divider ── */}
        <div className="w-px self-stretch" style={{ backgroundColor: '#f3e8d6' }} />

        {/* ── Middle column: Description (+ device image background) ── */}
        <div className="flex flex-col items-center justify-center flex-1 relative" style={{ minHeight: portsH }}>
          <div
            className="flex items-start justify-start w-full h-full relative"
            style={{
              margin: '8px 8px',
              padding: '7px 9px',
              border: '1.5px dashed #bfdbfe',
              borderRadius: 10,
              backgroundColor: '#f8fbff',
              cursor: 'default',
              minHeight: Math.max(portsH - 12, 48),
              overflow: 'hidden',
            }}
          >
            {/* Background layer: product image or category icon */}
            {deviceImageUrl
              ? <img src={deviceImageUrl} alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'contain', opacity: 0.12, pointerEvents: 'none' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              : FallbackIcon && <FallbackIcon size={44}
                  style={{ position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.08, color: '#3b82f6', pointerEvents: 'none' }}
                />
            }
            {/* Description text */}
            <span
              className="relative text-[11px] leading-relaxed"
              style={{
                zIndex: 1, wordBreak: 'break-word',
                color: data.description ? '#6b7280' : '#bfdbfe',
                fontStyle: data.description ? 'normal' : 'italic',
              }}
            >
              {data.description || 'No description'}
            </span>
          </div>
        </div>

        {/* ── Right divider ── */}
        <div className="w-px self-stretch" style={{ backgroundColor: '#f3e8d6' }} />

        {/* ── Right column: Outputs (editable) ── */}
        <div
          className="flex flex-col justify-start gap-0 relative"
          style={{ width: SIDE_COL_W, flexShrink: 0, paddingTop: 4, paddingBottom: 4 }}
        >
          {outputs.map((port) => {
            const color = PORT_COLORS[port.type] ?? PORT_COLORS.labware
            return (
              <div key={port.id} className="flex items-center relative" style={{ height: PORT_ROW_H }}>
                <span
                  className="text-[11px] pr-3 pl-1 truncate text-right flex-1 leading-tight"
                  style={{ color: '#777', maxWidth: SIDE_COL_W - 12 }}
                  title={port.label}
                >
                  {port.label || <span className="italic text-gray-300">output</span>}
                </span>
                <Handle
                  id={`out-${port.id}`}
                  type="source"
                  position={Position.Right}
                  style={{
                    position: 'absolute',
                    right: -8, top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: color, width: 12, height: 12,
                    border: '2px solid white', borderRadius: '50%',
                  }}
                />
              </div>
            )
          })}
          {outputs.length === 0 && (
            <div className="text-[11px] text-gray-200 italic px-3 py-1">no outputs</div>
          )}
        </div>
      </div>

      {/* ── Device footer ── */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 border-t"
        style={{ borderColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.52)' }}
      >
        <Cpu size={10} className="flex-shrink-0" style={{ color: data.device ? '#FF9933' : '#ccc' }} />
        {data.device
          ? <span className="text-[11px] text-gray-500 font-medium truncate">{data.device.name}</span>
          : <span className="text-[11px] text-gray-300 italic">No device assigned</span>}
        {data.duration?.value ? (
          <>
            <div className="flex-1" />
            <Clock size={10} className="flex-shrink-0" style={{ color: '#94a3b8' }} />
            <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
              {data.duration.value} {data.duration.unit}
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}
