import { Handle, Position } from '@xyflow/react'
import { RefreshCw } from 'lucide-react'
const C = '#FF9933'
export default function LoopNode({ data, selected }) {
  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-purple-100' : ''}`}
      style={{ borderColor: selected ? 'rgba(255,153,51,0.35)' : 'rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
        <RefreshCw size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.loopType === 'condition'
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 border border-gray-100">{data.condition || 'No condition'}</div>
          : <div className="text-xs text-gray-600">Repeat <span className="font-semibold" style={{ color: C }}>{data.count ?? 1}×</span></div>}
      </div>
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
