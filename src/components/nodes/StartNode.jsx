import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'
const C = '#FF9933'
export default function StartNode({ data, selected }) {
  return (
    <div
      className={`flex items-center justify-center transition-all ${selected ? 'ring-2 ring-green-200' : ''}`}
      style={{
        width: 76,
        height: 76,
        border: 'none',
        backgroundColor: selected ? 'rgba(255,235,205,0.98)' : 'rgba(255,245,230,0.95)',
        borderRadius: 18,
        boxShadow: selected ? '0 0 0 3px rgba(255,153,51,0.25), 0 6px 22px rgba(255,153,51,0.24)' : '0 4px 16px rgba(255,153,51,0.2), 0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      <Handle type="source" position={Position.Right} id="flow-out" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: '#64748b' }} />
      <div className="text-center pointer-events-none">
        <Play size={16} strokeWidth={2.5} style={{ color: C, margin: '0 auto 3px' }} />
        <div className="font-semibold text-[11px] tracking-[-0.01em]" style={{ color: '#b35900' }}>{data.label}</div>
      </div>
    </div>
  )
}
