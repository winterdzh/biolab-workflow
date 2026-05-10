import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'
const C = '#FF9933'
export default function StartNode({ data, selected }) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 border-2 shadow-sm transition-all ${selected ? 'ring-2 ring-green-200' : ''}`}
      style={{ borderColor: C, backgroundColor: selected ? '#e07000' : '#fff3e0', borderRadius: 4 }}
    >
      <Handle type="source" position={Position.Right} id="flow-out" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="text-center pointer-events-none">
        <Play size={16} strokeWidth={2.5} style={{ color: C, margin: '0 auto 2px' }} />
        <div className="font-semibold text-xs" style={{ color: '#b35900' }}>{data.label}</div>
      </div>
    </div>
  )
}
