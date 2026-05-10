import { Handle, Position } from '@xyflow/react'
import { GitBranch, Check, X } from 'lucide-react'
const C = '#FF9933'
const CTRUE = '#99BB44'
const CFALSE = '#CC0000'
export default function IfElseNode({ data, selected }) {
  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-yellow-100' : ''}`}
      style={{ borderColor: selected ? 'rgba(255,153,51,0.35)' : 'rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
        <GitBranch size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.condition
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 border border-gray-100">{data.condition}</div>
          : <div className="text-xs text-gray-400 italic">No condition set</div>}
        <div className="flex justify-between mt-2 text-xs">
          <span className="flex items-center gap-1 font-medium" style={{ color: CTRUE }}><Check size={10} />{data.trueLabel || 'Yes'}</span>
          <span className="flex items-center gap-1 font-medium" style={{ color: CFALSE }}><X size={10} />{data.falseLabel || 'No'}</span>
        </div>
      </div>
      <Handle id="true" type="source" position={Position.Right} style={{ top: '35%', backgroundColor: CTRUE }} className="!w-4 !h-4 !border-2 !border-white" />
      <Handle id="false" type="source" position={Position.Right} style={{ top: '65%', backgroundColor: CFALSE }} className="!w-4 !h-4 !border-2 !border-white" />
    </div>
  )
}
