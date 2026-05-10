import { Handle, Position } from '@xyflow/react'
import { GitFork } from 'lucide-react'

const C   = '#FF9933'  // orange — control
const CBG = 'rgba(255,255,255,0.9)'
const CBR = 'rgba(0,0,0,0.06)'

// Compact width: left-in → right-out layout
const W        = 140
const ROW_H    = 28   // height per branch row
const HEADER_H = 36   // header area height

export default function ParallelNode({ data, selected }) {
  const branches = Math.max(2, data.branches ?? 2)
  const totalH   = HEADER_H + branches * ROW_H

  // Evenly distribute RIGHT-side output handles along the node height
  const handleTops = Array.from({ length: branches }, (_, i) =>
    HEADER_H + (i + 0.5) * ROW_H
  )

  return (
    <div
      style={{
        width: W,
        height: totalH,
        borderColor: selected ? C : CBR,
        backgroundColor: CBG,
        borderRadius: 14,
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        boxShadow: selected ? '0 0 0 3px rgba(255,153,51,0.2), 0 4px 20px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.08)',
        position: 'relative',
      }}
    >
      {/* Single workflow input handle — left center */}
      <Handle
        id="flow-in"
        type="target"
        position={Position.Left}
        style={{
          top: '50%', left: -6, transform: 'translateY(-50%)',
          backgroundColor: C, width: 12, height: 12, border: '2px solid white',
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2.5"
        style={{ height: HEADER_H, borderBottom: '1px solid rgba(0,0,0,0.05)' }}
      >
        <GitFork size={12} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-xs truncate" style={{ color: '#92400e' }}>
          {data.label ?? 'Parallel'}
        </span>
      </div>

      {/* Branch rows with divider lines */}
      {Array.from({ length: branches }, (_, i) => (
        <div
          key={i}
          className="flex items-center"
          style={{
            height: ROW_H,
            borderBottom: i < branches - 1 ? `1px dashed ${CBR}` : 'none',
            paddingLeft: 8,
          }}
        >
          <span className="text-xs" style={{ color: `${C}cc` }}>
            Branch {i + 1}
          </span>
        </div>
      ))}

      {/* N output handles — right side, one per branch row */}
      {handleTops.map((top, i) => (
        <Handle
          key={i}
          id={`branch-${i}`}
          type="source"
          position={Position.Right}
          style={{
            top,
            right: -6,
            transform: 'translateY(-50%)',
            backgroundColor: C,
            width: 12,
            height: 12,
            border: '2px solid white',
          }}
        />
      ))}
    </div>
  )
}
