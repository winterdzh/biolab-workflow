import { Handle, Position } from '@xyflow/react'
import { FlaskConical, Box } from 'lucide-react'

const C = '#3b82f6'

const CONTAINER_LABELS = {
  cryo_tube:    'Cryo Tube',
  well_96:      '96-well Plate',
  well_384:     '384-well Plate',
  well_6:       '6-well Plate',
  reservoir:    'Reservoir',
  flask:        'Flask',
  autoflask:    'AutoFlask',
  bottle:       'Bottle',
  tube_15:      '15 mL Tube',
  tube_50:      '50 mL Tube',
  deepwell_96:  '96-well Deep Well',
  other:        'Other',
}

export default function SampleNode({ data, selected }) {
  const containerLabel = CONTAINER_LABELS[data.containerType] ?? data.containerType ?? null

  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-green-100' : ''}`}
      style={{ borderColor: selected ? 'rgba(59,130,246,0.35)' : 'rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.9)', boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2), 0 4px 20px rgba(59,130,246,0.15)' : '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <Handle id="mat-in" type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />

      <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
        <FlaskConical size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-[13px] tracking-[-0.01em] text-gray-800 leading-tight truncate">{data.label}</span>
      </div>

      <div className="px-3 py-2.5 space-y-1">
        {data.sampleName
          ? <div className="text-[11px] text-gray-600 font-medium">{data.sampleName}</div>
          : <div className="text-[11px] text-gray-300 italic">No sample linked</div>}

        {containerLabel && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Box size={10} className="text-gray-300 flex-shrink-0" />
            <span>{containerLabel}</span>
            {data.quantity && <span className="text-gray-400">× {data.quantity}</span>}
          </div>
        )}

        {(data.concentration || data.volume) && (
          <div className="flex gap-2 text-[11px] text-gray-400 pt-0.5">
            {data.concentration && <span>{data.concentration} {data.concentrationUnit ?? ''}</span>}
            {data.volume && <span>{data.volume} {data.volumeUnit ?? ''}</span>}
          </div>
        )}

        {data.storageTemp && (
          <div
            className="inline-flex items-center text-[11px] px-1.5 py-0.5 mt-0.5"
            style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: 8 }}
          >
            {data.storageTemp}
          </div>
        )}
      </div>

      <Handle id="mat-out" type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
