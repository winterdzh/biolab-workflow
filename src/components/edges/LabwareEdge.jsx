import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react'
import { useRef, useEffect, useState } from 'react'
import { PORT_COLORS } from '../nodes/OperationNode'

// Resolve edge color from port type stored in edge data
function resolveColor(data) {
  if (data?.portType && PORT_COLORS[data.portType]) return PORT_COLORS[data.portType]
  return PORT_COLORS.labware
}

export default function LabwareEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, selected,
}) {
  const color = resolveColor(data)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })
  const pathRef = useRef(null)
  const [arrows, setArrows] = useState([])
  const gid = `lw-g-${id}`
  const sw  = selected ? 12 : 8

  useEffect(() => {
    const p = pathRef.current
    if (!p) return
    const len = p.getTotalLength()
    setArrows([0, 1, 2].map((i) => {
      const l  = Math.max(0, len - i * 5)
      const l2 = Math.max(0, l - 1)
      const pt  = p.getPointAtLength(l)
      const pt2 = p.getPointAtLength(l2)
      return { x: pt.x, y: pt.y, angle: Math.atan2(pt.y - pt2.y, pt.x - pt2.x) * 180 / Math.PI }
    }))
  }, [edgePath])

  return (
    <>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0%"   stopColor={color} stopOpacity={0.1} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>

      <path ref={pathRef} d={edgePath} stroke={`url(#${gid})`} strokeWidth={sw} fill="none" strokeLinecap="butt" />

      {arrows.map(({ x, y, angle }, i) => (
        <polyline key={i} points="-3,-6 0,0 -3,6" fill="none"
          stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          transform={`translate(${x},${y}) rotate(${angle})`} style={{ pointerEvents: 'none' }} />
      ))}

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              backgroundColor: 'white', color, border: `1px solid ${color}44`,
              borderRadius: 4, pointerEvents: 'none',
            }}
            className="text-xs px-1.5 py-0.5"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
