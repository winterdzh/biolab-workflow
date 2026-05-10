import { Handle, Position } from '@xyflow/react'
import { Square } from 'lucide-react'
const C = '#FF9933'
export default function EndNode({ data, selected }) {
  return (
    <div
      className={`flex items-center justify-center transition-all ${selected ? 'ring-2 ring-red-200' : ''}`}
      style={{
        width: 76,
        height: 76,
        border: 'none',
        backgroundColor: selected ? 'rgba(255,232,232,0.98)' : 'rgba(255,240,240,0.95)',
        borderRadius: 18,
        boxShadow: selected ? '0 0 0 3px rgba(204,0,0,0.2), 0 6px 22px rgba(204,0,0,0.2)' : '0 4px 16px rgba(204,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: '#64748b' }} />
      <div className="text-center pointer-events-none">
        <Square size={16} strokeWidth={2} fill={C} style={{ color: C, margin: '0 auto 3px' }} />
        <div className="font-semibold text-[11px] tracking-[-0.01em]" style={{ color: '#b35900' }}>{data.label}</div>
      </div>
    </div>
  )
}
