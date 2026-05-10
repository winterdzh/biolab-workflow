import { Handle, Position } from '@xyflow/react'
import { Hash, AlertTriangle } from 'lucide-react'
import useVariableStore from '../../stores/variableStore'
const C = '#FF9933'
export default function SetVariableNode({ data, selected }) {
  const variables = useVariableStore((s) => s.variables)
  const matchedVar = variables.find((v) => v.name === data.variableName)
  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-blue-100' : ''}`}
      style={{ borderColor: selected ? 'rgba(255,153,51,0.35)' : 'rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
        <Hash size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-[13px] tracking-[-0.01em] text-gray-800 leading-tight">{data.label}</span>
      </div>
      <div className="px-3 py-2.5">
        {data.variableName ? (
          <div className="text-[11px] text-gray-600">
            <span className={`font-mono font-medium ${matchedVar ? '' : 'text-orange-500'}`} style={matchedVar ? { color: C } : {}}>
              {data.variableName}
            </span>
            {data.expression && <span className="text-gray-400"> = {data.expression}</span>}
            {!matchedVar && data.variableName && (
              <div className="flex items-center gap-1 text-orange-400 text-[11px] mt-0.5">
                <AlertTriangle size={10} /><span>Not in workflow vars</span>
              </div>
            )}
          </div>
        ) : <div className="text-[11px] text-gray-400 italic">No variable set</div>}
      </div>
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
