import { Handle, Position } from '@xyflow/react'
import { Database, Upload, Download, List } from 'lucide-react'

const C = '#009688'

export default function DataNode({ data, selected }) {
  const outputs     = data.outputs ?? []
  const kvCount     = data.kvPairs?.length ?? 0
  const importCount = data.imports?.length ?? 0
  const metaEnabled = data.exports?.metadata?.enabled
  const rawEnabled  = data.exports?.rawData?.enabled

  return (
    <div
      className={`bg-white border shadow-sm w-48 transition-all ${selected ? 'ring-2 ring-teal-100' : ''}`}
      style={{ borderColor: selected ? 'rgba(0,150,136,0.35)' : 'rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.9)', boxShadow: selected ? '0 0 0 3px rgba(0,150,136,0.18), 0 4px 20px rgba(0,150,136,0.14)' : '0 4px 20px rgba(0,0,0,0.08)' }}
    >


      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
        <Database size={13} style={{ color: C, flexShrink: 0 }} />
        <span className="font-semibold text-gray-800 text-sm leading-tight truncate flex-1">{data.label}</span>
        {outputs.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: '#B2DFDB', color: C, borderRadius: 3 }}>
            {outputs.length}
          </span>
        )}
      </div>

      {/* Summary row */}
      {(kvCount > 0 || importCount > 0 || metaEnabled || rawEnabled || data.description) && (
        <div className="px-3 py-1 border-b flex flex-wrap gap-x-3 gap-y-0.5" style={{ borderColor: '#f0fafa' }}>
          {kvCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <List size={10} style={{ color: C }} />
              <span>{kvCount} kv</span>
            </div>
          )}
          {importCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Upload size={10} style={{ color: C }} />
              <span>{importCount} import{importCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {(metaEnabled || rawEnabled) && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Download size={10} style={{ color: C }} />
              <span>{[metaEnabled && 'meta', rawEnabled && 'raw'].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {kvCount === 0 && importCount === 0 && !metaEnabled && !rawEnabled && data.description && (
            <span className="text-xs text-gray-400 italic truncate">{data.description}</span>
          )}
        </div>
      )}

      {/* Outputs — each row has its own labeled source handle */}
      <div className="px-3 py-2">
        {outputs.length === 0 ? (
          <div className="text-xs text-gray-300 italic">No outputs</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {outputs.map((output) => (
              <div key={output.id} className="relative flex items-center gap-1.5 text-xs text-gray-600" style={{ height: 20 }}>
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: C }} />
                <span className="truncate flex-1">{output.name}</span>
                <Handle
                  id={`out-${output.id}`}
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

      {/* Fallback single mat-out — only when no named outputs (backward-compat) */}
      {outputs.length === 0 && (
        <Handle
          id="mat-out" type="source" position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-white"
          style={{ backgroundColor: C }}
        />
      )}
    </div>
  )
}
