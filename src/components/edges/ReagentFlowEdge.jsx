import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react'
import { useRef, useEffect, useState } from 'react'

const COLOR = '#8b5cf6'

export default function ReagentFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const pathRef = useRef(null)
  const [arrows, setArrows] = useState([])
  const gid = `rf-g-${id}`
  const sw = selected ? 15 : 10

  useEffect(() => {
    const p = pathRef.current
    if (!p) return
    const len = p.getTotalLength()
    const gap = 5
    setArrows([0, 1, 2].map(i => {
      const l = Math.max(0, len - i * gap)
      const l2 = Math.max(0, l - 1)
      const pt = p.getPointAtLength(l)
      const pt2 = p.getPointAtLength(l2)
      return { x: pt.x, y: pt.y, angle: Math.atan2(pt.y - pt2.y, pt.x - pt2.x) * 180 / Math.PI }
    }))
  }, [edgePath])

  return (
    <>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0%" stopColor={COLOR} stopOpacity={0} />
          <stop offset="100%" stopColor={COLOR} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path ref={pathRef} d={edgePath} stroke={`url(#${gid})`} strokeWidth={sw} fill="none" strokeLinecap="butt" />
      {arrows.map(({ x, y, angle }, i) => (
        <polyline key={i} points="-2.5,-5 0,0 -2.5,5" fill="none"
          stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          transform={`translate(${x},${y}) rotate(${angle})`} style={{ pointerEvents: 'none' }} />
      ))}
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, backgroundColor: '#f5f3ff', color: COLOR, border: '1px solid #ddd6fe' }}
            className="text-xs px-1.5 py-0.5 rounded pointer-events-none">{data.label}</div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
