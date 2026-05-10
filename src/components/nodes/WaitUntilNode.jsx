import { Handle, Position } from '@xyflow/react'
import { Clock } from 'lucide-react'
const C = '#FF9933'
export default function WaitUntilNode({ data, selected }) {
  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-sky-100' : ''}`}
      style={{ borderColor: selected ? C : '#99ddff', borderRadius: 4 }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: '#eef8ff', borderColor: '#bbebff' }}>
        <Clock size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.condition
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 border border-gray-100">{data.condition}</div>
          : <div className="text-xs text-gray-400 italic">No condition set</div>}
      </div>
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
