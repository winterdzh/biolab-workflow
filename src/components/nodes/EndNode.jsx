import { Handle, Position } from '@xyflow/react'
import { Square } from 'lucide-react'
const C = '#FF9933'
export default function EndNode({ data, selected }) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 border-2 shadow-sm transition-all ${selected ? 'ring-2 ring-red-200' : ''}`}
      style={{ borderColor: C, backgroundColor: selected ? '#e07000' : '#fff3e0', borderRadius: 4 }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="text-center pointer-events-none">
        <Square size={16} strokeWidth={2} fill={C} style={{ color: C, margin: '0 auto 2px' }} />
        <div className="font-semibold text-xs" style={{ color: '#b35900' }}>{data.label}</div>
      </div>
    </div>
  )
}
