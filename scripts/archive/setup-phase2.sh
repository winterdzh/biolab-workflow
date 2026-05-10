#!/bin/bash
set -e
echo "Phase 2: Logic nodes + Edge types + Auto layout..."

mkdir -p src/components/edges src/utils

# ── src/constants/edgeTypes.js ───────────────────────────────────────────────
cat > src/constants/edgeTypes.js << 'ENDOFFILE'
export const EDGE_TYPES = {
  SAMPLE_FLOW: 'sampleFlow',
  MATERIAL_FLOW: 'materialFlow',
  INFO_FLOW: 'infoFlow',
}

export const EDGE_PALETTE = [
  {
    type: 'sampleFlow',
    label: 'Sample Flow',
    description: 'Biological sample movement',
    color: '#3b82f6',
    dashed: false,
  },
  {
    type: 'materialFlow',
    label: 'Material Flow',
    description: 'Consumable / reagent movement',
    color: '#f97316',
    dashed: false,
  },
  {
    type: 'infoFlow',
    label: 'Info Flow',
    description: 'Data / instruction transfer',
    color: '#94a3b8',
    dashed: true,
  },
]
ENDOFFILE

# ── src/utils/autoLayout.js ──────────────────────────────────────────────────
cat > src/utils/autoLayout.js << 'ENDOFFILE'
import dagre from 'dagre'

const NODE_WIDTH = 200
const NODE_HEIGHT = 90

export function applyAutoLayout(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    }
  })
}
ENDOFFILE

# ── src/components/edges/SampleFlowEdge.jsx ─────────────────────────────────
cat > src/components/edges/SampleFlowEdge.jsx << 'ENDOFFILE'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

export default function SampleFlowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd, selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
        style={{ stroke: '#3b82f6', strokeWidth: selected ? 2.5 : 2 }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
            className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded pointer-events-none">
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
ENDOFFILE

# ── src/components/edges/MaterialFlowEdge.jsx ───────────────────────────────
cat > src/components/edges/MaterialFlowEdge.jsx << 'ENDOFFILE'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

export default function MaterialFlowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd, selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
        style={{ stroke: '#f97316', strokeWidth: selected ? 2.5 : 2 }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
            className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded pointer-events-none">
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
ENDOFFILE

# ── src/components/edges/InfoFlowEdge.jsx ───────────────────────────────────
cat > src/components/edges/InfoFlowEdge.jsx << 'ENDOFFILE'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

export default function InfoFlowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd, selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
        style={{ stroke: '#94a3b8', strokeWidth: selected ? 2.5 : 2, strokeDasharray: '6 3' }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
            className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded pointer-events-none">
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
ENDOFFILE

# ── src/components/edges/index.js ───────────────────────────────────────────
cat > src/components/edges/index.js << 'ENDOFFILE'
import SampleFlowEdge from './SampleFlowEdge'
import MaterialFlowEdge from './MaterialFlowEdge'
import InfoFlowEdge from './InfoFlowEdge'

const edgeTypes = {
  sampleFlow: SampleFlowEdge,
  materialFlow: MaterialFlowEdge,
  infoFlow: InfoFlowEdge,
}

export default edgeTypes
ENDOFFILE

# ── src/components/nodes/IfElseNode.jsx ─────────────────────────────────────
cat > src/components/nodes/IfElseNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function IfElseNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${
      selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-400 hover:border-amber-500'
    }`}>
      <Handle type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white" />
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 rounded-t-xl flex items-center gap-2">
        <span className="text-amber-500 text-sm font-bold">◇</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.condition
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">{data.condition}</div>
          : <div className="text-xs text-gray-400 italic">No condition set</div>
        }
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-green-600 font-medium">✓ {data.trueLabel || 'Yes'}</span>
          <span className="text-red-500 font-medium">✗ {data.falseLabel || 'No'}</span>
        </div>
      </div>
      <Handle id="true" type="source" position={Position.Bottom} style={{ left: '28%' }}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white" />
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: '72%' }}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white" />
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/LoopNode.jsx ───────────────────────────────────────
cat > src/components/nodes/LoopNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function LoopNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${
      selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-400 hover:border-purple-500'
    }`}>
      <Handle type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
      <div className="bg-purple-50 border-b border-purple-200 px-3 py-2 rounded-t-xl flex items-center gap-2">
        <span className="text-purple-500 text-sm">↻</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.loopType === 'condition'
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">{data.condition || 'No condition'}</div>
          : <div className="text-xs text-gray-600">Repeat <span className="font-bold text-purple-600">{data.count ?? 1}</span> times</div>
        }
      </div>
      <Handle type="source" position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
      <Handle id="loop" type="source" position={Position.Right}
        className="!w-3 !h-3 !bg-purple-300 !border-2 !border-white" />
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/WaitUntilNode.jsx ──────────────────────────────────
cat > src/components/nodes/WaitUntilNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function WaitUntilNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${
      selected ? 'border-teal-500 ring-2 ring-teal-200' : 'border-teal-400 hover:border-teal-500'
    }`}>
      <Handle type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white" />
      <div className="bg-teal-50 border-b border-teal-200 px-3 py-2 rounded-t-xl flex items-center gap-2">
        <span className="text-teal-500 text-sm">⏳</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.condition
          ? <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">{data.condition}</div>
          : <div className="text-xs text-gray-400 italic">No condition set</div>
        }
      </div>
      <Handle type="source" position={Position.Bottom}
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white" />
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/SetVariableNode.jsx ────────────────────────────────
cat > src/components/nodes/SetVariableNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function SetVariableNode({ data, selected }) {
  return (
    <div className={`bg-white border-2 rounded-xl shadow-md min-w-44 transition-all ${
      selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-400 hover:border-indigo-500'
    }`}>
      <Handle type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
      <div className="bg-indigo-50 border-b border-indigo-200 px-3 py-2 rounded-t-xl flex items-center gap-2">
        <span className="text-indigo-500 text-sm font-mono font-bold">$</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2">
        {data.variableName
          ? <div className="text-xs text-gray-600">
              <span className="font-mono text-indigo-600">{data.variableName}</span>
              {data.expression && <span className="text-gray-400"> = {data.expression}</span>}
            </div>
          : <div className="text-xs text-gray-400 italic">No variable set</div>
        }
      </div>
      <Handle type="source" position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/index.js (overwrite) ───────────────────────────────
cat > src/components/nodes/index.js << 'ENDOFFILE'
import StartNode from './StartNode'
import EndNode from './EndNode'
import OperationNode from './OperationNode'
import IfElseNode from './IfElseNode'
import LoopNode from './LoopNode'
import WaitUntilNode from './WaitUntilNode'
import SetVariableNode from './SetVariableNode'
import { NODE_TYPES } from '../../constants/nodeTypes'

const nodeTypes = {
  [NODE_TYPES.START]: StartNode,
  [NODE_TYPES.END]: EndNode,
  [NODE_TYPES.OPERATION]: OperationNode,
  [NODE_TYPES.IF_ELSE]: IfElseNode,
  [NODE_TYPES.LOOP]: LoopNode,
  [NODE_TYPES.WAIT_UNTIL]: WaitUntilNode,
  [NODE_TYPES.SET_VARIABLE]: SetVariableNode,
}

export default nodeTypes
ENDOFFILE

# ── src/constants/nodeTypes.js (overwrite) ──────────────────────────────────
cat > src/constants/nodeTypes.js << 'ENDOFFILE'
export const NODE_TYPES = {
  START: 'startNode',
  END: 'endNode',
  OPERATION: 'operationNode',
  IF_ELSE: 'ifElseNode',
  LOOP: 'loopNode',
  WAIT_UNTIL: 'waitUntilNode',
  SET_VARIABLE: 'setVariableNode',
}

export const ELEMENT_PALETTE = [
  { type: 'startNode',       label: 'Start',        description: 'Workflow entry point',    color: '#22c55e', icon: '▶' },
  { type: 'endNode',         label: 'End',           description: 'Workflow exit point',     color: '#ef4444', icon: '⏹' },
  { type: 'operationNode',   label: 'Operation',     description: 'Lab operation step',      color: '#3b82f6', icon: '⚙' },
  { type: 'ifElseNode',      label: 'If / Else',     description: 'Conditional branch',      color: '#f59e0b', icon: '◇' },
  { type: 'loopNode',        label: 'Loop',          description: 'Repeat steps',            color: '#8b5cf6', icon: '↻' },
  { type: 'waitUntilNode',   label: 'Wait Until',    description: 'Wait for condition',      color: '#14b8a6', icon: '⏳' },
  { type: 'setVariableNode', label: 'Set Variable',  description: 'Assign a variable',       color: '#6366f1', icon: '$' },
]
ENDOFFILE

# ── src/stores/uiStore.js (overwrite) ───────────────────────────────────────
cat > src/stores/uiStore.js << 'ENDOFFILE'
import { create } from 'zustand'

const useUiStore = create((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  activeEdgeType: 'sampleFlow',
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setActiveEdgeType: (type) => set({ activeEdgeType: type }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),
}))

export default useUiStore
ENDOFFILE

# ── src/stores/workflowStore.js (overwrite) ─────────────────────────────────
cat > src/stores/workflowStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowName: 'Untitled Workflow',

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection }, get().edges) }),

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  updateNodeData: (nodeId, patch) =>
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n) }),

  updateEdgeData: (edgeId, patch) =>
    set({ edges: get().edges.map((e) => e.id === edgeId ? { ...e, ...patch } : e) }),

  setWorkflowName: (name) => set({ workflowName: name }),
  clearWorkflow: () => set({ nodes: [], edges: [] }),
  loadWorkflow: ({ nodes, edges, workflowName }) => set({ nodes, edges, workflowName }),
}))

export default useWorkflowStore
ENDOFFILE

# ── src/components/canvas/WorkflowCanvas.jsx (overwrite) ────────────────────
cat > src/components/canvas/WorkflowCanvas.jsx << 'ENDOFFILE'
import { useCallback, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import nodeTypes from '../nodes'
import edgeTypes from '../edges'
import { createNode } from '../../utils/nodeFactory'

const NODE_COLORS = {
  startNode: '#22c55e', endNode: '#ef4444', operationNode: '#3b82f6',
  ifElseNode: '#f59e0b', loopNode: '#8b5cf6', waitUntilNode: '#14b8a6', setVariableNode: '#6366f1',
}

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef(null)
  const [rfInstance, setRfInstance] = useState(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useWorkflowStore()
  const { setSelectedNodeId, setSelectedEdgeId, activeEdgeType } = useUiStore()

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
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap nodeColor={(n) => NODE_COLORS[n.type] ?? '#94a3b8'} />
      </ReactFlow>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/LeftPanel.jsx (overwrite) ─────────────────────────
cat > src/components/layout/LeftPanel.jsx << 'ENDOFFILE'
import { ELEMENT_PALETTE } from '../../constants/nodeTypes'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import useUiStore from '../../stores/uiStore'

function PaletteItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div draggable onDragStart={onDragStart}
      className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-white hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: item.color }}>
        {item.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-700">{item.label}</div>
        <div className="text-xs text-gray-400">{item.description}</div>
      </div>
    </div>
  )
}

function EdgeTypeButton({ edge, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 p-2.5 border rounded-lg transition-all text-left w-full ${
        active ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      <svg width="28" height="12" className="flex-shrink-0">
        <line x1="2" y1="6" x2="22" y2="6" stroke={edge.color} strokeWidth="2"
          strokeDasharray={edge.dashed ? '5 3' : undefined} />
        <polygon points="18,3 24,6 18,9" fill={edge.color} />
      </svg>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-700">{edge.label}</div>
        <div className="text-xs text-gray-400 truncate">{edge.description}</div>
      </div>
      {active && <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: edge.color }} />}
    </button>
  )
}

export default function LeftPanel() {
  const { activeEdgeType, setActiveEdgeType } = useUiStore()
  return (
    <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Elements</div>
        <div className="flex flex-col gap-1.5">
          {ELEMENT_PALETTE.map((item) => <PaletteItem key={item.type} item={item} />)}
        </div>
      </div>

      <div className="border-t border-gray-200 mx-3" />

      <div className="p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Connection Type
        </div>
        <div className="flex flex-col gap-1.5">
          {EDGE_PALETTE.map((edge) => (
            <EdgeTypeButton key={edge.type} edge={edge}
              active={activeEdgeType === edge.type}
              onClick={() => setActiveEdgeType(edge.type)} />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 mx-3" />

      <div className="p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Library</div>
        {['Samples', 'Reagents', 'Consumables', 'Devices'].map((lib) => (
          <div key={lib} className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-400 opacity-50 cursor-not-allowed" title="Coming in Phase 3">
            <span className="text-xs">📚</span>
            <span>{lib}</span>
            <span className="ml-auto text-xs bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded">soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/TopBar.jsx (overwrite) ────────────────────────────
cat > src/components/layout/TopBar.jsx << 'ENDOFFILE'
import useWorkflowStore from '../../stores/workflowStore'
import { exportWorkflow, importWorkflow } from '../../utils/importExport'
import { applyAutoLayout } from '../../utils/autoLayout'

export default function TopBar() {
  const { workflowName, setWorkflowName, nodes, edges, clearWorkflow, loadWorkflow } = useWorkflowStore()

  const handleExport = () => {
    const json = exportWorkflow({ nodes, edges, workflowName })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = importWorkflow(ev.target.result)
        if (result) loadWorkflow(result)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleAutoLayout = () => {
    if (nodes.length === 0) return
    const laid = applyAutoLayout(nodes, edges)
    loadWorkflow({ nodes: laid, edges, workflowName })
  }

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-blue-600 text-xl">🧬</span>
        <span className="font-bold text-gray-700 text-sm">BioLab Workflow Designer</span>
      </div>
      <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
      <input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}
        className="border border-gray-200 rounded-md px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-52"
        placeholder="Workflow name..." />
      <div className="flex-1" />
      <button onClick={clearWorkflow}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
        Clear
      </button>
      <button onClick={handleAutoLayout}
        className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors"
        title="Auto-arrange all nodes">
        Auto Layout
      </button>
      <button onClick={handleImport}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
        Import JSON
      </button>
      <button onClick={handleExport}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
        Export JSON
      </button>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/RightPanel.jsx (overwrite) ────────────────────────
cat > src/components/layout/RightPanel.jsx << 'ENDOFFILE'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import { EDGE_PALETTE } from '../../constants/edgeTypes'

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text', min }) => (
  <input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
)

const Textarea = ({ value, onChange, placeholder }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none" />
)

function NodeProps({ node, update }) {
  const { data, type } = node
  return (
    <div className="p-3 flex flex-col gap-3">
      <Field label="Label">
        <Input value={data.label} onChange={(v) => update({ label: v })} />
      </Field>

      {type === 'operationNode' && <>
        <Field label="Description">
          <Textarea value={data.description} onChange={(v) => update({ description: v })} placeholder="Describe this operation..." />
        </Field>
        <Field label="Duration">
          <div className="flex gap-2">
            <input type="number" min={0} value={data.duration?.value ?? 0}
              onChange={(e) => update({ duration: { ...data.duration, value: Number(e.target.value) } })}
              className="w-20 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
            <select value={data.duration?.unit ?? 'min'}
              onChange={(e) => update({ duration: { ...data.duration, unit: e.target.value } })}
              className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none bg-white">
              <option value="sec">sec</option>
              <option value="min">min</option>
              <option value="hr">hr</option>
            </select>
          </div>
        </Field>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5 text-xs text-blue-400">
          Device &amp; sample linking available in Phase 3
        </div>
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
        <Field label="Variable name">
          <Input value={data.variableName} onChange={(v) => update({ variableName: v })} placeholder="e.g. sampleVolume" />
        </Field>
        <Field label="Expression">
          <Input value={data.expression} onChange={(v) => update({ expression: v })} placeholder="e.g. 200 * n" />
        </Field>
      </>}

      <div className="pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-300 font-mono truncate">ID: {node.id?.slice(0, 18)}…</div>
      </div>
    </div>
  )
}

function EdgeProps({ edge, updateEdge }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <Field label="Flow type">
        <div className="flex flex-col gap-1.5 mt-1">
          {EDGE_PALETTE.map((ep) => (
            <button key={ep.type} onClick={() => updateEdge({ type: ep.type })}
              className={`flex items-center gap-3 p-2 border rounded-lg transition-all text-left ${
                edge.type === ep.type ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
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
  )
}

export default function RightPanel() {
  const { selectedNodeId, selectedEdgeId } = useUiStore()
  const { nodes, edges, updateNodeData, updateEdgeData } = useWorkflowStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

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

  return (
    <div className="w-60 bg-white border-l border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</div>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">
          {selectedNode ? `${selectedNode.type?.replace('Node', '')} node` : 'Connection'}
        </div>
      </div>
      {selectedNode && <NodeProps node={selectedNode} update={(p) => updateNodeData(selectedNode.id, p)} />}
      {selectedEdge && <EdgeProps edge={selectedEdge} updateEdge={(p) => updateEdgeData(selectedEdge.id, p)} />}
    </div>
  )
}
ENDOFFILE

echo ""
echo "✅ Phase 2 complete! Run: npm run dev"