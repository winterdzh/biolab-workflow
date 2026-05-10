import { Handle, Position } from '@xyflow/react'
import { Package } from 'lucide-react'

const C = '#06b6d4'

export default function ConsumableNode({ data, selected }) {
  const items = data.items ?? []

  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-orange-100' : ''}`}
      style={{ borderColor: selected ? C : '#67e8f9', borderRadius: 4 }}
    >
      <Handle id="mat-in" type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-white" style={{ backgroundColor: C }} />

      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: '#ecfeff', borderColor: '#a5f3fc' }}>
        <Package size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm leading-tight truncate flex-1">{data.label}</span>
        {items.length > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 flex-shrink-0"
            style={{ backgroundColor: '#cffafe', color: C, borderRadius: 3 }}
          >
            {items.length}
          </span>
        )}
      </div>

      <div className="px-3 py-2">
        {items.length === 0 ? (
          <div className="text-xs text-gray-300 italic">No items</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <div key={item.id} className="relative flex items-center gap-1.5 text-xs text-gray-600" style={{ height: 20 }}>
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: C }} />
                <span className="truncate flex-1">{item.name}</span>
                {item.quantity && <span className="text-gray-400 ml-auto flex-shrink-0 mr-3">×{item.quantity}</span>}
                <Handle
                  id={`out-${item.id}`}
                  type="source"
                  position={Position.Right}
                  style={{
                    position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                    width: 10, height: 10, backgroundColor: C, border: '2px solid white', borderRadius: '50%',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
