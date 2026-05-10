import { NodeResizer } from '@xyflow/react'
import { Layers } from 'lucide-react'
export default function ExperimentNode({ data, selected }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        lineStyle={{ border: '1.5px dashed #CC0000', opacity: 0.6 }}
        handleStyle={{ width: 6, height: 6, borderRadius: 2, backgroundColor: '#CC0000', border: 'none' }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          border: '2px dashed #CC0000',
          borderRadius: 4,
          backgroundColor: 'rgba(204,0,0,0.025)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            padding: '7px 12px',
            borderBottom: '1.5px dashed rgba(204,0,0,0.25)',
            backgroundColor: 'rgba(204,0,0,0.05)',
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Layers size={13} style={{ color: '#CC0000', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 12, color: '#CC0000' }}>
            {data.label || 'Experiment'}
          </span>
          {data.description && (
            <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>{data.description}</span>
          )}
        </div>
      </div>
    </div>
  )
}
