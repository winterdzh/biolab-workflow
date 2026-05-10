#!/bin/bash
set -e
echo "Phase 7: Delete buttons + Copy/Paste..."

# ── workflowStore.js (add deleteNode, deleteEdge, copyNode, pasteNode) ────────
cat > src/stores/workflowStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'
import { groupSelectedNodes, ungroupExperiment as doUngroup } from '../utils/grouping'

const MAX_HISTORY = 50

function snapshot(nodes, edges) {
  return { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
}

const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowName: 'Untitled Workflow',
  past: [],
  future: [],
  clipboard: null,   // { node, children } — stores copied node + its children if experiment

  _push: () => {
    const { nodes, edges, past } = get()
    const newPast = [...past, snapshot(nodes, edges)]
    if (newPast.length > MAX_HISTORY) newPast.shift()
    set({ past: newPast, future: [] })
  },

  undo: () => {
    const { past, nodes, edges, future } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    set({ nodes: prev.nodes, edges: prev.edges, past: past.slice(0, -1), future: [snapshot(nodes, edges), ...future] })
  },

  redo: () => {
    const { future, nodes, edges, past } = get()
    if (!future.length) return
    const next = future[0]
    set({ nodes: next.nodes, edges: next.edges, future: future.slice(1), past: [...past, snapshot(nodes, edges)] })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    get()._push()
    set({ edges: addEdge({ ...connection }, get().edges) })
  },

  addNode: (node) => {
    get()._push()
    set({ nodes: [...get().nodes, node] })
  },

  updateNodeData: (nodeId, patch) => {
    get()._push()
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n) })
  },

  updateEdgeData: (edgeId, patch) => {
    get()._push()
    set({ edges: get().edges.map((e) => e.id === edgeId ? { ...e, ...patch } : e) })
  },

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteNode: (nodeId) => {
    get()._push()
    const { nodes, edges } = get()
    // Also delete children if it's an experiment node
    const childIds = nodes.filter((n) => n.parentId === nodeId).map((n) => n.id)
    const idsToRemove = new Set([nodeId, ...childIds])
    set({
      nodes: nodes.filter((n) => !idsToRemove.has(n.id)),
      edges: edges.filter((e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target)),
    })
  },

  deleteEdge: (edgeId) => {
    get()._push()
    set({ edges: get().edges.filter((e) => e.id !== edgeId) })
  },

  // ── Copy / Paste ──────────────────────────────────────────────────────────
  copyNode: (nodeId) => {
    const { nodes } = get()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const children = nodes.filter((n) => n.parentId === nodeId)
    // Deep-clone to avoid reference sharing
    set({ clipboard: JSON.parse(JSON.stringify({ node, children })) })
  },

  pasteNode: () => {
    const { clipboard } = get()
    if (!clipboard) return
    get()._push()

    const OFFSET = 40
    const { node, children } = clipboard
    const newNodeId = uuidv4()

    const newNode = {
      ...node,
      id: newNodeId,
      position: { x: node.position.x + OFFSET, y: node.position.y + OFFSET },
      selected: false,
    }
    // For experiment groups: re-create children with new parentId
    const newChildren = children.map((c) => ({
      ...c,
      id: uuidv4(),
      parentId: newNodeId,
      selected: false,
    }))

    set({ nodes: [...get().nodes, newNode, ...newChildren] })
  },

  // ── Group / Ungroup ───────────────────────────────────────────────────────
  groupSelected: (selectedIds, label) => {
    const result = groupSelectedNodes(get().nodes, selectedIds, label)
    if (!result) return
    get()._push()
    set({ nodes: result })
  },

  ungroupExperimentNode: (experimentId) => {
    get()._push()
    set({ nodes: doUngroup(get().nodes, experimentId) })
  },

  setWorkflowName: (name) => set({ workflowName: name }),
  clearWorkflow: () => { get()._push(); set({ nodes: [], edges: [] }) },
  loadWorkflow: ({ nodes, edges, workflowName }) =>
    set({ nodes, edges, workflowName: workflowName ?? get().workflowName, past: [], future: [] }),
}))

export default useWorkflowStore
ENDOFFILE

# ── RightPanel.jsx (add Delete + Copy buttons) ────────────────────────────────
cat > src/components/layout/RightPanel.jsx << 'ENDOFFILE'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import useVariableStore from '../../stores/variableStore'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import DevicePicker from '../library/DevicePicker'
import SamplePicker from '../library/SamplePicker'

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text', min }) => (
  <input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
)

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" />
)

function VariableSelect({ value, onChange }) {
  const variables = useVariableStore((s) => s.variables)
  return (
    <div>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400 font-mono">
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
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
          <span>⎘</span> Copy
        </button>
      )}
      <button onClick={onDelete}
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors font-medium">
        <span>✕</span> Delete
      </button>
    </div>
  )
}

function NodeProps({ node, update, onCopy, onDelete, onUngroup }) {
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
            className="w-full py-1.5 border-2 border-dashed text-sm rounded-lg transition-colors font-medium"
            style={{ borderColor: '#CC0000', color: '#CC0000' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            ⬡ Ungroup Experiment
          </button>
        </>}

        {type === 'operationNode' && <>
          <Field label="Device"><DevicePicker value={data.device} onChange={(v) => update({ device: v })} /></Field>
          <Field label="Sample"><SamplePicker value={data.sample} onChange={(v) => update({ sample: v })} /></Field>
          <Field label="Description">
            <Textarea value={data.description} onChange={(v) => update({ description: v })} placeholder="Describe this operation..." />
          </Field>
          <Field label="Duration">
            <div className="flex gap-2">
              <input type="number" min={0} value={data.duration?.value ?? 0}
                onChange={(e) => update({ duration: { ...data.duration, value: Number(e.target.value) } })}
                className="w-20 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400" />
              <select value={data.duration?.unit ?? 'min'}
                onChange={(e) => update({ duration: { ...data.duration, unit: e.target.value } })}
                className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none">
                <option value="sec">sec</option>
                <option value="min">min</option>
                <option value="hr">hr</option>
              </select>
            </div>
          </Field>
        </>}

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
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none bg-white">
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
          className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors font-medium">
          <span>✕</span> Delete Connection
        </button>
      </div>
      <div className="border-t border-gray-100 mx-3 mb-2" />
      <div className="px-3 flex flex-col gap-3 pb-3">
        <Field label="Flow type">
          <div className="flex flex-col gap-1.5 mt-1">
            {EDGE_PALETTE.map((ep) => (
              <button key={ep.type} onClick={() => updateEdge({ type: ep.type })}
                className={`flex items-center gap-3 p-2 border rounded-lg transition-all text-left ${edge.type === ep.type ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
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

export default function RightPanel() {
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
      <div className="w-60 bg-gray-50 border-l border-gray-200 flex items-center justify-center flex-shrink-0">
        <div className="text-center text-gray-300 p-6">
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
    <div className="w-60 bg-white border-l border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</div>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">
          {selectedNode ? typeLabel : 'Connection'}
        </div>
      </div>
      {selectedNode && (
        <NodeProps
          node={selectedNode}
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
  )
}
ENDOFFILE

# ── WorkflowCanvas.jsx: add Ctrl+C / Ctrl+V / Paste button ───────────────────
cat > src/components/canvas/WorkflowCanvas.jsx << 'ENDOFFILE'
import { useCallback, useRef, useState, useEffect } from 'react'
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, Panel } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import nodeTypes from '../nodes'
import edgeTypes from '../edges'
import { createNode } from '../../utils/nodeFactory'
import SelectionToolbar from './SelectionToolbar'

const NODE_COLORS = {
  startNode: '#99BB44', endNode: '#CC0000', operationNode: '#FF9933',
  ifElseNode: '#CCCC66', loopNode: '#CC99CC', waitUntilNode: '#66CCFF',
  setVariableNode: '#336699', experimentNode: '#CC0000',
}

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef(null)
  const [rfInstance, setRfInstance] = useState(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode,
          clipboard, copyNode, pasteNode } = useWorkflowStore()
  const { selectedNodeId, setSelectedNodeId, setSelectedEdgeId, activeEdgeType } = useUiStore()

  // Keyboard shortcuts: Ctrl+C copy selected node, Ctrl+V paste
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodeId) {
        e.preventDefault()
        copyNode(selectedNodeId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteNode()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedNodeId, copyNode, pasteNode])

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])
  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow')
    if (!type || !rfInstance) return
    addNode(createNode(type, rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })))
  }, [rfInstance, addNode])

  const handleConnect = useCallback(
    (connection) => onConnect({ ...connection, type: activeEdgeType }),
    [onConnect, activeEdgeType]
  )
  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), [setSelectedNodeId])
  const onEdgeClick = useCallback((_, edge) => setSelectedEdgeId(edge.id), [setSelectedEdgeId])
  const onPaneClick = useCallback(() => { setSelectedNodeId(null); setSelectedEdgeId(null) }, [setSelectedNodeId, setSelectedEdgeId])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={handleConnect} onInit={setRfInstance}
        onDrop={onDrop} onDragOver={onDragOver}
        onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        fitView deleteKeyCode="Delete"
        selectionOnDrag panOnDrag={[1, 2]}
      >
        <SelectionToolbar />

        {/* Paste button — only visible when clipboard has content */}
        {clipboard && (
          <Panel position="bottom-center" style={{ marginBottom: 12 }}>
            <button
              onClick={pasteNode}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-md text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              <span>⎘</span>
              Paste <span className="text-gray-400 font-normal ml-1 text-xs">(Ctrl+V)</span>
            </button>
          </Panel>
        )}

        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap nodeColor={(n) => NODE_COLORS[n.type] ?? '#999999'} maskColor="rgba(240,240,240,0.6)" />
      </ReactFlow>
    </div>
  )
}
ENDOFFILE

echo "✅ Phase 7 complete! Run: npm run dev"
