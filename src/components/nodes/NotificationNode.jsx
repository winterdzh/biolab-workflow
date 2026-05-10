import { Handle, Position } from '@xyflow/react'
import { StickyNote, HelpCircle, AlertTriangle, Info } from 'lucide-react'

const NOTE_STYLES = {
  note:     { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: StickyNote },
  question: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: HelpCircle },
  warning:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
  info:     { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Info },
}

export default function NotificationNode({ data, selected }) {
  const noteType = data.noteType ?? 'note'
  const style = NOTE_STYLES[noteType] ?? NOTE_STYLES.note
  const Icon = style.icon

  return (
    <div
      className={`bg-white border shadow-sm w-44 transition-all ${selected ? 'ring-2' : ''}`}
      style={{
        borderColor: selected ? style.color : style.border,
        borderRadius: 4,
        '--tw-ring-color': style.color + '33',
      }}
    >
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: style.color }} />

      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: style.bg, borderColor: style.border }}>
        <Icon size={13} style={{ color: style.color, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm leading-tight truncate">{data.label}</span>
      </div>

      {data.message && (
        <div className="px-3 py-2">
          <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{data.message}</div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !border-2 !border-white" style={{ backgroundColor: style.color }} />
    </div>
  )
}

