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
      style={{ borderColor: selected ? C : '#93c5fd', borderRadius: 4 }}
    >
      <Handle id="mat-in" type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />

      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
        <FlaskConical size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm leading-tight truncate">{data.label}</span>
      </div>

      <div className="px-3 py-2 space-y-1">
        {data.sampleName
          ? <div className="text-xs text-gray-600 font-medium">{data.sampleName}</div>
          : <div className="text-xs text-gray-300 italic">No sample linked</div>}

        {containerLabel && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Box size={10} className="text-gray-300 flex-shrink-0" />
            <span>{containerLabel}</span>
            {data.quantity && <span className="text-gray-400">× {data.quantity}</span>}
          </div>
        )}

        {(data.concentration || data.volume) && (
          <div className="flex gap-2 text-xs text-gray-400 pt-0.5">
            {data.concentration && <span>{data.concentration} {data.concentrationUnit ?? ''}</span>}
            {data.volume && <span>{data.volume} {data.volumeUnit ?? ''}</span>}
          </div>
        )}

        {data.storageTemp && (
          <div
            className="inline-flex items-center text-xs px-1.5 py-0.5 mt-0.5"
            style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: 3 }}
          >
            {data.storageTemp}
          </div>
        )}
      </div>

      <Handle id="mat-out" type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
