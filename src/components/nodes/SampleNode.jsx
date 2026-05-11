import { Handle, Position } from '@xyflow/react'
import { FlaskConical } from 'lucide-react'

const C = '#3b82f6'

export default function SampleNode({ data, selected }) {
  const items = data.items ?? []

  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2 ring-blue-100' : ''}`}
      style={{ borderColor: selected ? 'rgba(59,130,246,0.35)' : 'rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.9)', boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2), 0 4px 20px rgba(59,130,246,0.15)' : '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
        <FlaskConical size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-[13px] tracking-[-0.01em] text-gray-800 leading-tight truncate flex-1">{data.label}</span>
        {items.length > 0 && (
          <span
            className="text-[11px] px-1.5 py-0.5 flex-shrink-0"
            style={{ backgroundColor: '#dbeafe', color: C, borderRadius: 8 }}
          >
            {items.length}
          </span>
        )}
      </div>

      <div className="px-3 py-2.5">
        {items.length === 0 ? (
          <div className="text-[11px] text-gray-300 italic">No samples</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <div key={item.id} className="relative flex items-center gap-1.5 text-[11px] text-gray-600" style={{ height: 21 }}>
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: C }} />
                <span className="truncate flex-1">{item.name}</span>
                {item.storageTemp && (
                  <span className="text-gray-400 flex-shrink-0 ml-1">{item.storageTemp}</span>
                )}
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
