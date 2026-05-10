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
      style={{ borderColor: selected ? C : '#5588bb', borderRadius: 4 }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: '#eef2f8', borderColor: '#bbccdd' }}>
        <Hash size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.variableName ? (
          <div className="text-xs text-gray-600">
            <span className={`font-mono font-medium ${matchedVar ? '' : 'text-orange-500'}`} style={matchedVar ? { color: C } : {}}>
              {data.variableName}
            </span>
            {data.expression && <span className="text-gray-400"> = {data.expression}</span>}
            {!matchedVar && data.variableName && (
              <div className="flex items-center gap-1 text-orange-400 text-xs mt-0.5">
                <AlertTriangle size={10} /><span>Not in workflow vars</span>
              </div>
            )}
          </div>
        ) : <div className="text-xs text-gray-400 italic">No variable set</div>}
      </div>
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: C }} />
    </div>
  )
}
