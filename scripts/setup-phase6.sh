#!/bin/bash
set -e
echo "Phase 6: Experiment Group nodes..."

mkdir -p src/utils src/components/canvas src/components/nodes

# ── src/utils/grouping.js ─────────────────────────────────────────────────────
cat > src/utils/grouping.js << 'ENDOFFILE'
import { v4 as uuidv4 } from 'uuid'

const INNER_PAD = 48
const HEADER_H  = 48
const NODE_W    = 200
const NODE_H    = 90

export function groupSelectedNodes(nodes, selectedIds, label = 'Experiment') {
  const toGroup = nodes.filter(
    (n) => selectedIds.includes(n.id) && !n.parentId && n.type !== 'experimentNode'
  )
  if (toGroup.length < 2) return null

  const minX = Math.min(...toGroup.map((n) => n.position.x)) - INNER_PAD
  const minY = Math.min(...toGroup.map((n) => n.position.y)) - INNER_PAD - HEADER_H
  const maxX = Math.max(...toGroup.map((n) => n.position.x + NODE_W)) + INNER_PAD
  const maxY = Math.max(...toGroup.map((n) => n.position.y + NODE_H)) + INNER_PAD

  const groupId = uuidv4()
  const groupNode = {
    id: groupId,
    type: 'experimentNode',
    position: { x: minX, y: minY },
    style: { width: maxX - minX, height: maxY - minY },
    data: { label, description: '' },
    zIndex: -1,
    selected: false,
  }

  const updatedNodes = nodes.map((n) => {
    if (!selectedIds.includes(n.id) || n.parentId || n.type === 'experimentNode')
      return { ...n, selected: false }
    return {
      ...n,
      parentId: groupId,
      extent: 'parent',
      position: { x: n.position.x - minX, y: n.position.y - minY },
      selected: false,
    }
  })

  // Experiment node must appear BEFORE its children (renders behind them)
  return [groupNode, ...updatedNodes]
}

export function ungroupExperiment(nodes, experimentId) {
  const exp = nodes.find((n) => n.id === experimentId)
  if (!exp) return nodes
  return nodes
    .filter((n) => n.id !== experimentId)
    .map((n) => {
      if (n.parentId !== experimentId) return n
      const { parentId, extent, ...rest } = n
      return {
        ...rest,
        position: {
          x: exp.position.x + n.position.x,
          y: exp.position.y + n.position.y,
        },
      }
    })
}
ENDOFFILE

# ── src/utils/autoLayout.js (two-pass: inside group then top-level) ───────────
cat > src/utils/autoLayout.js << 'ENDOFFILE'
import dagre from 'dagre'

const NODE_W     = 200
const NODE_H     = 90
const INNER_PAD  = 48
const HEADER_H   = 48

export function applyAutoLayout(nodes, edges, direction = 'TB') {
  const experiments   = nodes.filter((n) => n.type === 'experimentNode')
  let result          = [...nodes]
  const expSizes      = {}  // experimentId -> { width, height }

  // ── Pass 1: layout children within each experiment ────────────────────────
  for (const exp of experiments) {
    const children = nodes.filter((n) => n.parentId === exp.id)
    if (children.length === 0) {
      expSizes[exp.id] = { width: exp.style?.width ?? 350, height: exp.style?.height ?? 250 }
      continue
    }

    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: direction, ranksep: 60, nodesep: 40 })
    children.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))

    const childIds = new Set(children.map((n) => n.id))
    edges
      .filter((e) => childIds.has(e.source) && childIds.has(e.target))
      .forEach((e) => g.setEdge(e.source, e.target))
    dagre.layout(g)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    children.forEach((n) => {
      const p = g.node(n.id)
      minX = Math.min(minX, p.x - NODE_W / 2)
      minY = Math.min(minY, p.y - NODE_H / 2)
      maxX = Math.max(maxX, p.x + NODE_W / 2)
      maxY = Math.max(maxY, p.y + NODE_H / 2)
    })

    const w = maxX - minX + INNER_PAD * 2
    const h = maxY - minY + INNER_PAD * 2 + HEADER_H
    expSizes[exp.id] = { width: w, height: h }

    result = result.map((n) => {
      if (n.parentId !== exp.id) return n
      const p = g.node(n.id)
      return {
        ...n,
        position: {
          x: p.x - NODE_W / 2 - minX + INNER_PAD,
          y: p.y - NODE_H / 2 - minY + INNER_PAD + HEADER_H,
        },
      }
    })
    // Resize experiment frame to fit children
    result = result.map((n) =>
      n.id === exp.id ? { ...n, style: { ...n.style, width: w, height: h } } : n
    )
  }

  // ── Pass 2: layout top-level nodes (experiments counted as single units) ───
  const topLevel = result.filter((n) => !n.parentId)
  if (topLevel.length === 0) return result

  const g2 = new dagre.graphlib.Graph()
  g2.setDefaultEdgeLabel(() => ({}))
  g2.setGraph({ rankdir: direction, ranksep: 100, nodesep: 60 })

  topLevel.forEach((n) => {
    const sz = expSizes[n.id]
    g2.setNode(n.id, { width: sz ? sz.width : NODE_W, height: sz ? sz.height : NODE_H })
  })

  // Map every nodeId to its top-level ancestor
  const toTop = {}
  result.forEach((n) => { toTop[n.id] = n.parentId ?? n.id })

  const addedEdges = new Set()
  edges.forEach((e) => {
    const src = toTop[e.source]
    const tgt = toTop[e.target]
    if (!src || !tgt || src === tgt) return
    if (!topLevel.find((n) => n.id === src) || !topLevel.find((n) => n.id === tgt)) return
    const key = `${src}||${tgt}`
    if (!addedEdges.has(key)) { addedEdges.add(key); g2.setEdge(src, tgt) }
  })
  dagre.layout(g2)

  return result.map((n) => {
    if (n.parentId) return n
    const p = g2.node(n.id)
    if (!p) return n
    const sz = expSizes[n.id]
    const w = sz ? sz.width : NODE_W
    const h = sz ? sz.height : NODE_H
    return { ...n, position: { x: p.x - w / 2, y: p.y - h / 2 } }
  })
}
ENDOFFILE

# ── src/components/nodes/ExperimentNode.jsx ──────────────────────────────────
cat > src/components/nodes/ExperimentNode.jsx << 'ENDOFFILE'
import { NodeResizer } from '@xyflow/react'

export default function ExperimentNode({ data, selected }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        lineStyle={{ border: '1.5px dashed #CC0000', opacity: 0.6 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#CC0000', border: 'none' }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          border: '2px dashed #CC0000',
          borderRadius: 14,
          backgroundColor: 'rgba(204,0,0,0.025)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Header band */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1.5px dashed rgba(204,0,0,0.25)',
            backgroundColor: 'rgba(204,0,0,0.06)',
            pointerEvents: 'all',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#CC0000' }}>⬡</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#CC0000', letterSpacing: '0.01em' }}>
              {data.label || 'Experiment'}
            </span>
          </div>
          {data.description && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{data.description}</div>
          )}
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/index.js ────────────────────────────────────────────
cat > src/components/nodes/index.js << 'ENDOFFILE'
import StartNode       from './StartNode'
import EndNode         from './EndNode'
import OperationNode   from './OperationNode'
import IfElseNode      from './IfElseNode'
import LoopNode        from './LoopNode'
import WaitUntilNode   from './WaitUntilNode'
import SetVariableNode from './SetVariableNode'
import ExperimentNode  from './ExperimentNode'
import { NODE_TYPES }  from '../../constants/nodeTypes'

const nodeTypes = {
  [NODE_TYPES.START]:        StartNode,
  [NODE_TYPES.END]:          EndNode,
  [NODE_TYPES.OPERATION]:    OperationNode,
  [NODE_TYPES.IF_ELSE]:      IfElseNode,
  [NODE_TYPES.LOOP]:         LoopNode,
  [NODE_TYPES.WAIT_UNTIL]:   WaitUntilNode,
  [NODE_TYPES.SET_VARIABLE]: SetVariableNode,
  [NODE_TYPES.EXPERIMENT]:   ExperimentNode,
}

export default nodeTypes
ENDOFFILE

# ── src/constants/nodeTypes.js ────────────────────────────────────────────────
cat > src/constants/nodeTypes.js << 'ENDOFFILE'
export const NODE_TYPES = {
  START:        'startNode',
  END:          'endNode',
  OPERATION:    'operationNode',
  IF_ELSE:      'ifElseNode',
  LOOP:         'loopNode',
  WAIT_UNTIL:   'waitUntilNode',
  SET_VARIABLE: 'setVariableNode',
  EXPERIMENT:   'experimentNode',
}

export const ELEMENT_PALETTE = [
  { type: 'startNode',       label: 'Start',       description: 'Workflow entry point',    color: '#99BB44', icon: '▶' },
  { type: 'endNode',         label: 'End',          description: 'Workflow exit point',     color: '#CC0000', icon: '⏹' },
  { type: 'operationNode',   label: 'Operation',    description: 'Lab operation step',      color: '#FF9933', icon: '⚙' },
  { type: 'ifElseNode',      label: 'If / Else',    description: 'Conditional branch',      color: '#CCCC66', icon: '◇' },
  { type: 'loopNode',        label: 'Loop',         description: 'Repeat steps',            color: '#CC99CC', icon: '↻' },
  { type: 'waitUntilNode',   label: 'Wait Until',   description: 'Wait for condition',      color: '#66CCFF', icon: '⏳' },
  { type: 'setVariableNode', label: 'Set Variable', description: 'Assign a variable',       color: '#336699', icon: '$' },
]

// Kept separate so LeftPanel can render them in a distinct section
export const GROUP_PALETTE = [
  { type: 'experimentNode',  label: 'Experiment',   description: 'Drag to create a frame',  color: '#CC0000', icon: '⬡' },
]
ENDOFFILE

# ── src/utils/nodeFactory.js ──────────────────────────────────────────────────
cat > src/utils/nodeFactory.js << 'ENDOFFILE'
import { v4 as uuidv4 } from 'uuid'
import { NODE_TYPES } from '../constants/nodeTypes'

const defaultDataMap = {
  [NODE_TYPES.START]:        { label: 'Start' },
  [NODE_TYPES.END]:          { label: 'End' },
  [NODE_TYPES.OPERATION]:    { label: 'New Operation', device: null, sample: null, consumables: [], reagents: [], duration: { value: 0, unit: 'min' }, description: '' },
  [NODE_TYPES.IF_ELSE]:      { label: 'Condition', condition: '', trueLabel: 'Yes', falseLabel: 'No' },
  [NODE_TYPES.LOOP]:         { label: 'Loop', loopType: 'count', count: 3, condition: '' },
  [NODE_TYPES.WAIT_UNTIL]:   { label: 'Wait Until', condition: '' },
  [NODE_TYPES.SET_VARIABLE]: { label: 'Set Variable', variableName: '', expression: '' },
  [NODE_TYPES.EXPERIMENT]:   { label: 'Experiment', description: '' },
}

export function createNode(type, position) {
  const base = {
    id: uuidv4(),
    type,
    position,
    data: { ...(defaultDataMap[type] ?? { label: type }) },
  }
  if (type === NODE_TYPES.EXPERIMENT) {
    base.style  = { width: 420, height: 280 }
    base.zIndex = -1
  }
  return base
}
ENDOFFILE

# ── src/stores/workflowStore.js (add group/ungroup actions) ───────────────────
cat > src/stores/workflowStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
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

# ── src/components/canvas/SelectionToolbar.jsx ───────────────────────────────
cat > src/components/canvas/SelectionToolbar.jsx << 'ENDOFFILE'
import { useState } from 'react'
import { Panel } from '@xyflow/react'
import useWorkflowStore from '../../stores/workflowStore'

export default function SelectionToolbar() {
  const { nodes, groupSelected } = useWorkflowStore()
  const [label, setLabel] = useState('')

  // Only count top-level, non-experiment, selected nodes
  const eligible = nodes.filter(
    (n) => n.selected && n.type !== 'experimentNode' && !n.parentId
  )

  if (eligible.length < 2) return null

  const handleGroup = () => {
    groupSelected(eligible.map((n) => n.id), label.trim() || 'Experiment')
    setLabel('')
  }

  return (
    <Panel position="top-center" style={{ zIndex: 10, marginTop: 8 }}>
      <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-lg">
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
          {eligible.length} nodes selected
        </span>
        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGroup()}
          placeholder="Experiment name..."
          className="border border-gray-200 rounded-lg px-2.5 py-1 text-sm w-40 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
        />
        <button
          onClick={handleGroup}
          className="px-3 py-1.5 bg-[#CC0000] text-white text-sm rounded-lg hover:bg-red-800 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <span>⬡</span> Group as Experiment
        </button>
      </div>
    </Panel>
  )
}
ENDOFFILE

# ── src/components/canvas/WorkflowCanvas.jsx (add SelectionToolbar) ───────────
cat > src/components/canvas/WorkflowCanvas.jsx << 'ENDOFFILE'
import { useCallback, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import nodeTypes from '../nodes'
import edgeTypes from '../edges'
import { createNode } from '../../utils/nodeFactory'
import SelectionToolbar from './SelectionToolbar'

const NODE_COLORS = {
  startNode:       '#99BB44',
  endNode:         '#CC0000',
  operationNode:   '#FF9933',
  ifElseNode:      '#CCCC66',
  loopNode:        '#CC99CC',
  waitUntilNode:   '#66CCFF',
  setVariableNode: '#336699',
  experimentNode:  '#CC0000',
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

  const onNodeClick    = useCallback((_, node) => setSelectedNodeId(node.id), [setSelectedNodeId])
  const onEdgeClick    = useCallback((_, edge) => setSelectedEdgeId(edge.id), [setSelectedEdgeId])
  const onPaneClick    = useCallback(() => { setSelectedNodeId(null); setSelectedEdgeId(null) }, [setSelectedNodeId, setSelectedEdgeId])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode="Delete"
        selectionOnDrag
        panOnDrag={[1, 2]}
      >
        <SelectionToolbar />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.type] ?? '#999999'}
          maskColor="rgba(240,240,240,0.6)"
        />
      </ReactFlow>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/LeftPanel.jsx (add Grouping section) ────────────────
cat > src/components/layout/LeftPanel.jsx << 'ENDOFFILE'
import { useState } from 'react'
import { ELEMENT_PALETTE, GROUP_PALETTE } from '../../constants/nodeTypes'
import { EDGE_PALETTE } from '../../constants/edgeTypes'
import useUiStore from '../../stores/uiStore'
import useLibraryStore from '../../stores/libraryStore'
import LibraryModal from '../library/LibraryModal'

function PaletteItem({ item, hint }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={hint}
      className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-white hover:border-red-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: item.color }}
      >
        {item.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-700">{item.label}</div>
        <div className="text-xs text-gray-400">{item.description}</div>
      </div>
    </div>
  )
}

function ExperimentPaletteItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 p-2.5 border-2 border-dashed rounded-lg bg-white cursor-grab active:cursor-grabbing transition-all select-none hover:shadow-sm"
      style={{ borderColor: '#CC0000', backgroundColor: 'rgba(204,0,0,0.02)' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-dashed"
        style={{ borderColor: '#CC0000', color: '#CC0000' }}>
        {item.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium" style={{ color: '#CC0000' }}>{item.label}</div>
        <div className="text-xs text-gray-400">{item.description}</div>
      </div>
    </div>
  )
}

function EdgeTypeButton({ edge, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-2.5 border rounded-lg transition-all text-left w-full ${active ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <svg width="28" height="12" className="flex-shrink-0">
        <line x1="2" y1="6" x2="22" y2="6" stroke={edge.color} strokeWidth="2" strokeDasharray={edge.dashed ? '5 3' : undefined} />
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

const LIBRARY_TABS = [
  { key: 'samples',     label: 'Samples',     icon: '🧬' },
  { key: 'consumables', label: 'Consumables',  icon: '📦' },
  { key: 'reagents',    label: 'Reagents',     icon: '🧪' },
  { key: 'devices',     label: 'Devices',      icon: '🔧' },
]

export default function LeftPanel() {
  const { activeEdgeType, setActiveEdgeType } = useUiStore()
  const [showLibrary, setShowLibrary] = useState(false)
  const store = useLibraryStore()

  return (
    <>
      <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">

        {/* Elements */}
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Elements</div>
          <div className="flex flex-col gap-1.5">
            {ELEMENT_PALETTE.map((item) => <PaletteItem key={item.type} item={item} />)}
          </div>
        </div>

        <div className="border-t border-gray-200 mx-3" />

        {/* Grouping */}
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">Grouping</div>
          <div className="text-xs text-gray-400 px-1 mb-2">
            Drag to create a frame, or select 2+ nodes on canvas to group them
          </div>
          <div className="flex flex-col gap-1.5">
            {GROUP_PALETTE.map((item) => <ExperimentPaletteItem key={item.type} item={item} />)}
          </div>
        </div>

        <div className="border-t border-gray-200 mx-3" />

        {/* Connection Type */}
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Connection Type</div>
          <div className="flex flex-col gap-1.5">
            {EDGE_PALETTE.map((edge) => (
              <EdgeTypeButton key={edge.type} edge={edge}
                active={activeEdgeType === edge.type}
                onClick={() => setActiveEdgeType(edge.type)} />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 mx-3" />

        {/* Library */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Library</div>
            <button onClick={() => setShowLibrary(true)} className="text-xs text-[#CC0000] hover:text-red-800 font-medium">Manage →</button>
          </div>
          {LIBRARY_TABS.map(({ key, label, icon }) => (
            <div key={key} onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-600 hover:bg-white hover:shadow-sm cursor-pointer transition-all">
              <span className="text-xs">{icon}</span>
              <span>{label}</span>
              <span className="ml-auto text-xs text-gray-400">{store[key]?.length ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
    </>
  )
}
ENDOFFILE

# ── src/components/layout/RightPanel.jsx (add experiment node props) ──────────
cat > src/components/layout/RightPanel.jsx << 'ENDOFFILE'
import { useState } from 'react'
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
      {variables.length === 0 && (
        <div className="text-xs text-gray-400 mt-1">Open <span className="font-mono text-indigo-500">$ Workflow Vars</span> to add variables.</div>
      )}
    </div>
  )
}

function NodeProps({ node, update, ungroupExperimentNode }) {
  const { data, type, id } = node
  return (
    <div className="p-3 flex flex-col gap-3">
      <Field label="Label">
        <Input value={data.label} onChange={(v) => update({ label: v })} />
      </Field>

      {/* ── Experiment node ───────────────────────────────────────────── */}
      {type === 'experimentNode' && <>
        <Field label="Description">
          <Textarea value={data.description} onChange={(v) => update({ description: v })}
            placeholder="Describe this experiment..." rows={2} />
        </Field>
        <div className="pt-1 border-t border-gray-100">
          <button
            onClick={() => ungroupExperimentNode(id)}
            className="w-full py-1.5 border-2 border-dashed text-sm rounded-lg transition-colors font-medium"
            style={{ borderColor: '#CC0000', color: '#CC0000' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ⬡ Ungroup Experiment
          </button>
        </div>
      </>}

      {/* ── Operation node ────────────────────────────────────────────── */}
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
        <Field label="Variable (from workflow vars)">
          <VariableSelect value={data.variableName} onChange={(v) => update({ variableName: v })} />
        </Field>
        <Field label="Expression">
          <Input value={data.expression} onChange={(v) => update({ expression: v })} placeholder="e.g. 200 * replicates" />
        </Field>
      </>}

      <div className="pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-300 font-mono truncate">ID: {id?.slice(0, 18)}…</div>
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
  )
}

export default function RightPanel() {
  const { selectedNodeId, selectedEdgeId } = useUiStore()
  const { nodes, edges, updateNodeData, updateEdgeData, ungroupExperimentNode } = useWorkflowStore()
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
          ungroupExperimentNode={ungroupExperimentNode}
        />
      )}
      {selectedEdge && <EdgeProps edge={selectedEdge} updateEdge={(p) => updateEdgeData(selectedEdge.id, p)} />}
    </div>
  )
}
ENDOFFILE

echo ""
echo "✅ Phase 6 complete! Run: npm run dev"