import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import useVariableStore from '../../stores/variableStore'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import { Copy, Trash2, Layers } from 'lucide-react'
import DataNodePropsEditor from './nodeProps/DataNodePropsEditor'
import ProcessNodePropsEditor from './nodeProps/ProcessNodePropsEditor'
import OperationNodePropsEditor from './nodeProps/OperationNodePropsEditor'
import SampleNodePropsEditor from './nodeProps/SampleNodePropsEditor'
import ReagentNodePropsEditor from './nodeProps/ReagentNodePropsEditor'
import LabwareNodePropsEditor from './nodeProps/LabwareNodePropsEditor'



const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text', min }) => (
  <input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" style={{ borderRadius: 4 }} />
)

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" style={{ borderRadius: 4 }} />
)

function VariableSelect({ value, onChange }) {
  const variables = useVariableStore((s) => s.variables)
  return (
    <div>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400 font-mono" style={{ borderRadius: 4 }}>
        <option value="">-- select variable --</option>
        {variables.map((v) => <option key={v.id} value={v.name}>{v.name} ({v.type})</option>)}
      </select>
    </div>
  )
}

function ActionBar({ onCopy, onDelete, isExperiment }) {
  return (
    <div className="flex gap-2 px-3 pt-2 pb-1">
      {!isExperiment && (
        <button onClick={onCopy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          style={{ borderRadius: 4 }}>
          <Copy size={13} /> Copy
        </button>
      )}
      <button onClick={onDelete}
        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
        style={{ borderRadius: 4 }}>
        <Trash2 size={13} /> Delete
      </button>
    </div>
  )
}

function NodeProps({ node, edges, update, onCopy, onDelete, onUngroup }) {
  const { data, type } = node
  const isExperiment = type === 'experimentNode'

  return (
    <div className="flex flex-col">
      <ActionBar onCopy={onCopy} onDelete={onDelete} isExperiment={isExperiment} />
      <div className="border-t border-gray-100 mx-3 mb-2" />

      <div className="px-3 flex flex-col gap-3 pb-3">
        <Field label="Label">
          <Input value={data.label} onChange={(v) => update({ label: v })} />
        </Field>

        {isExperiment && <>
          <Field label="Description">
            <Textarea value={data.description} onChange={(v) => update({ description: v })}
              placeholder="Describe this experiment..." rows={2} />
          </Field>
          <button onClick={onUngroup}
            className="w-full h-8 border-2 border-dashed text-sm transition-colors font-medium inline-flex items-center justify-center gap-1.5"
            style={{ borderColor: '#CC0000', color: '#CC0000', borderRadius: 4 }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Layers size={13} /> Ungroup Experiment
          </button>
        </>}

        {type === 'operationNode' && <OperationNodePropsEditor node={node} edges={edges} data={data} update={update} />}

        {type === 'ifElseNode' && <>
          <Field label="Condition">
            <Input value={data.condition} onChange={(v) => update({ condition: v })} placeholder="e.g. OD600 > 0.8" />
          </Field>
          <div className="flex gap-2">
            <Field label="True label"><Input value={data.trueLabel} onChange={(v) => update({ trueLabel: v })} /></Field>
            <Field label="False label"><Input value={data.falseLabel} onChange={(v) => update({ falseLabel: v })} /></Field>
          </div>
        </>}

        {type === 'loopNode' && <>
          <Field label="Loop type">
            <select value={data.loopType ?? 'count'} onChange={(e) => update({ loopType: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1.5 text-sm focus:outline-none bg-white" style={{ borderRadius: 4 }}>
              <option value="count">Fixed count</option>
              <option value="condition">Until condition</option>
            </select>
          </Field>
          {(!data.loopType || data.loopType === 'count')
            ? <Field label="Repeat count"><Input type="number" min={1} value={data.count ?? 3} onChange={(v) => update({ count: v })} /></Field>
            : <Field label="Condition"><Input value={data.condition} onChange={(v) => update({ condition: v })} placeholder="e.g. i >= 10" /></Field>
          }
        </>}

        {type === 'waitUntilNode' &&
          <Field label="Condition">
            <Input value={data.condition} onChange={(v) => update({ condition: v })} placeholder="e.g. temp == 37" />
          </Field>
        }

        {type === 'setVariableNode' && <>
          <Field label="Variable">
            <VariableSelect value={data.variableName} onChange={(v) => update({ variableName: v })} />
          </Field>
          <Field label="Expression">
            <Input value={data.expression} onChange={(v) => update({ expression: v })} placeholder="e.g. 200 * replicates" />
          </Field>
        </>}

        {type === 'processNode' && <ProcessNodePropsEditor data={data} update={update} />}

        {type === 'notificationNode' && <>
          <Field label="Note type">
            <select value={data.noteType ?? 'note'} onChange={(e) => update({ noteType: e.target.value })}
              className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
              <option value="note">📝 Note</option>
              <option value="question">❓ Question</option>
              <option value="warning">⚠️ Warning</option>
              <option value="info">ℹ️ Info</option>
            </select>
          </Field>
          <Field label="Message">
            <Textarea value={data.message} onChange={(v) => update({ message: v })}
              placeholder="Write your note here..." rows={4} />
          </Field>
        </>}

        {type === 'sampleNode' && <SampleNodePropsEditor data={data} update={update} />}
        {type === 'consumableNode' && <LabwareNodePropsEditor data={data} update={update} />}
        {type === 'labwareNode' && <LabwareNodePropsEditor data={data} update={update} />}
        {type === 'reagentNode' && <ReagentNodePropsEditor data={data} update={update} />}

        {type === 'parallelNode' && (
          <Field label="Branch count">
            <div className="flex items-center gap-3">
              <button
                onClick={() => update({ branches: Math.max(2, (data.branches ?? 2) - 1) })}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 text-base font-medium"
                style={{ borderRadius: 4 }}
              >−</button>
              <span className="text-sm font-semibold text-gray-700 w-4 text-center">
                {data.branches ?? 2}
              </span>
              <button
                onClick={() => update({ branches: Math.min(8, (data.branches ?? 2) + 1) })}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 text-base font-medium"
                style={{ borderRadius: 4 }}
              >+</button>
              <span className="text-xs text-gray-400 ml-1">max 8</span>
            </div>
          </Field>
        )}

        {type === 'dataNode' && <DataNodePropsEditor data={data} update={update} />}

        <div className="pt-1 border-t border-gray-100">
          <div className="text-xs text-gray-300 font-mono truncate">ID: {node.id?.slice(0, 18)}…</div>
        </div>
      </div>
    </div>
  )
}

function EdgeProps({ edge, updateEdge, onDelete }) {
  return (
    <div className="flex flex-col">
      <div className="px-3 pt-2 pb-1">
        <button onClick={onDelete}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
          style={{ borderRadius: 4 }}>
          <Trash2 size={13} /> Delete Connection
        </button>
      </div>
      <div className="border-t border-gray-100 mx-3 mb-2" />
      <div className="px-3 flex flex-col gap-3 pb-3">
        <Field label="Flow type">
          <div className="flex flex-col gap-1.5 mt-1">
            {EDGE_PALETTE.map((ep) => (
              <button key={ep.type} onClick={() => updateEdge({ type: ep.type })}
                className={`flex items-center gap-2.5 p-2 border w-full text-left transition-colors ${edge.type === ep.type ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                style={{ borderRadius: 4 }}>
                <svg width="24" height="12" className="flex-shrink-0">
                  <line x1="2" y1="6" x2="20" y2="6" stroke={ep.color} strokeWidth="2" strokeDasharray={ep.dashed ? '5 3' : undefined} />
                  <polygon points="16,3 22,6 16,9" fill={ep.color} />
                </svg>
                <span className="text-sm text-gray-700">{ep.label}</span>
                {edge.type === ep.type && <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: ep.color }} />}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Label (optional)">
          <Input value={edge.data?.label ?? ''} onChange={(v) => updateEdge({ data: { ...edge.data, label: v } })} placeholder="Add a label..." />
        </Field>
      </div>
    </div>
  )
}

export default function RightPanel({ width = 240 }) {
  const { selectedNodeId, selectedEdgeId } = useUiStore()
  const { nodes, edges, updateNodeData, updateEdgeData, deleteNode, deleteEdge, copyNode, ungroupExperimentNode } = useWorkflowStore()
  const { clearSelection } = useUiStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  const handleDeleteNode = () => { deleteNode(selectedNodeId); clearSelection() }
  const handleDeleteEdge = () => { deleteEdge(selectedEdgeId); clearSelection() }
  const handleCopyNode   = () => copyNode(selectedNodeId)

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="apple-glass flex items-center justify-center flex-shrink-0" style={{ width, boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.65)' }}>
        <div className="text-center text-gray-400 p-6">
          <div className="text-3xl mb-2">✦</div>
          <div className="text-xs">Click a node or connection to edit</div>
        </div>
      </div>
    )
  }

  const typeLabel = selectedNode?.type === 'experimentNode'
    ? 'Experiment group'
    : selectedNode?.type?.replace('Node', '') + ' node'

  return (
    <div className="apple-glass flex flex-col flex-shrink-0" style={{ width, boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.65)' }}>
      <div className="p-3 flex-shrink-0" style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.06)' }}>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</div>
        <div className="text-xs text-gray-500 mt-0.5 capitalize">
          {selectedNode ? typeLabel : 'Connection'}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 apple-scroll">
      {selectedNode && (
        <NodeProps
          node={selectedNode}
          edges={edges}
          update={(p) => updateNodeData(selectedNode.id, p)}
          onCopy={handleCopyNode}
          onDelete={handleDeleteNode}
          onUngroup={() => ungroupExperimentNode(selectedNodeId)}
        />
      )}
      {selectedEdge && (
        <EdgeProps
          edge={selectedEdge}
          updateEdge={(p) => updateEdgeData(selectedEdge.id, p)}
          onDelete={handleDeleteEdge}
        />
      )}
      </div>
    </div>
  )
}
