#!/bin/bash
set -e
echo "Setting up BioLab Workflow Designer - Phase 1..."

mkdir -p src/components/canvas src/components/layout src/components/nodes src/stores src/constants src/utils
rm -f src/App.css

# ── vite.config.js ──────────────────────────────────────────────────────────
cat > vite.config.js << 'ENDOFFILE'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
ENDOFFILE

# ── src/index.css ────────────────────────────────────────────────────────────
cat > src/index.css << 'ENDOFFILE'
@import "tailwindcss";
ENDOFFILE

# ── src/main.jsx ─────────────────────────────────────────────────────────────
cat > src/main.jsx << 'ENDOFFILE'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
ENDOFFILE

# ── src/constants/nodeTypes.js ───────────────────────────────────────────────
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
  {
    type: NODE_TYPES.START,
    label: 'Start',
    description: 'Workflow entry point',
    color: '#22c55e',
    icon: '▶',
  },
  {
    type: NODE_TYPES.END,
    label: 'End',
    description: 'Workflow exit point',
    color: '#ef4444',
    icon: '⏹',
  },
  {
    type: NODE_TYPES.OPERATION,
    label: 'Operation',
    description: 'Lab operation step',
    color: '#3b82f6',
    icon: '⚙',
  },
]
ENDOFFILE

# ── src/utils/nodeFactory.js ─────────────────────────────────────────────────
cat > src/utils/nodeFactory.js << 'ENDOFFILE'
import { v4 as uuidv4 } from 'uuid'
import { NODE_TYPES } from '../constants/nodeTypes'

const defaultDataMap = {
  [NODE_TYPES.START]: { label: 'Start' },
  [NODE_TYPES.END]: { label: 'End' },
  [NODE_TYPES.OPERATION]: {
    label: 'New Operation',
    device: null,
    sample: null,
    consumables: [],
    reagents: [],
    duration: { value: 0, unit: 'min' },
    description: '',
  },
  [NODE_TYPES.IF_ELSE]: {
    label: 'Condition',
    condition: '',
    trueLabel: 'Yes',
    falseLabel: 'No',
  },
  [NODE_TYPES.LOOP]: { label: 'Loop', loopType: 'count', count: 3, condition: '' },
  [NODE_TYPES.WAIT_UNTIL]: { label: 'Wait Until', condition: '' },
  [NODE_TYPES.SET_VARIABLE]: { label: 'Set Variable', variableName: '', expression: '' },
}

export function createNode(type, position) {
  return {
    id: uuidv4(),
    type,
    position,
    data: { ...(defaultDataMap[type] ?? { label: type }) },
  }
}
ENDOFFILE

# ── src/utils/importExport.js ────────────────────────────────────────────────
cat > src/utils/importExport.js << 'ENDOFFILE'
export function exportWorkflow({ nodes, edges, workflowName }) {
  return JSON.stringify(
    {
      version: '1.0',
      metadata: {
        name: workflowName,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      nodes,
      edges,
    },
    null,
    2
  )
}

export function importWorkflow(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!data.nodes || !data.edges) throw new Error('Invalid format')
    return {
      nodes: data.nodes,
      edges: data.edges,
      workflowName: data.metadata?.name ?? 'Imported Workflow',
    }
  } catch {
    alert('Invalid workflow JSON file')
    return null
  }
}
ENDOFFILE

# ── src/stores/workflowStore.js ──────────────────────────────────────────────
cat > src/stores/workflowStore.js << 'ENDOFFILE'
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowName: 'Untitled Workflow',

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, animated: false }, get().edges) }),

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  updateNodeData: (nodeId, patch) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
      ),
    }),

  setWorkflowName: (name) => set({ workflowName: name }),
  clearWorkflow: () => set({ nodes: [], edges: [] }),
  loadWorkflow: ({ nodes, edges, workflowName }) =>
    set({ nodes, edges, workflowName }),
}))

export default useWorkflowStore
ENDOFFILE

# ── src/stores/uiStore.js ────────────────────────────────────────────────────
cat > src/stores/uiStore.js << 'ENDOFFILE'
import { create } from 'zustand'

const useUiStore = create((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  clearSelection: () => set({ selectedNodeId: null }),
}))

export default useUiStore
ENDOFFILE

# ── src/components/nodes/StartNode.jsx ──────────────────────────────────────
cat > src/components/nodes/StartNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function StartNode({ data, selected }) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 rounded-full border-2 shadow-md transition-all ${
        selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-green-500'
      } bg-green-50`}
    >
      <div className="text-center pointer-events-none">
        <div className="text-green-600 text-lg">▶</div>
        <div className="text-green-700 font-semibold text-xs">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/EndNode.jsx ────────────────────────────────────────
cat > src/components/nodes/EndNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function EndNode({ data, selected }) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 rounded-full border-2 shadow-md transition-all ${
        selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-red-500'
      } bg-red-50`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
      <div className="text-center pointer-events-none">
        <div className="text-red-600 text-lg">⏹</div>
        <div className="text-red-700 font-semibold text-xs">{data.label}</div>
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/OperationNode.jsx ──────────────────────────────────
cat > src/components/nodes/OperationNode.jsx << 'ENDOFFILE'
import { Handle, Position } from '@xyflow/react'

export default function OperationNode({ data, selected }) {
  return (
    <div
      className={`bg-white border-2 rounded-xl shadow-md min-w-48 transition-all ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-blue-300 hover:border-blue-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <div className="bg-blue-50 border-b border-blue-200 px-3 py-2 rounded-t-xl flex items-center gap-2">
        <span className="text-blue-500 text-sm">⚙</span>
        <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
      </div>
      <div className="px-3 py-2 space-y-1">
        {data.device ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>🔧</span><span className="font-medium">{data.device.name}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No device</div>
        )}
        {data.sample ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>🧬</span><span>{data.sample.name}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No sample</div>
        )}
        {data.description && (
          <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
            {data.description}
          </div>
        )}
        {(data.duration?.value ?? 0) > 0 && (
          <div className="text-xs text-gray-400">
            ⏱ {data.duration.value} {data.duration.unit}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  )
}
ENDOFFILE

# ── src/components/nodes/index.js ───────────────────────────────────────────
cat > src/components/nodes/index.js << 'ENDOFFILE'
import StartNode from './StartNode'
import EndNode from './EndNode'
import OperationNode from './OperationNode'
import { NODE_TYPES } from '../../constants/nodeTypes'

const nodeTypes = {
  [NODE_TYPES.START]: StartNode,
  [NODE_TYPES.END]: EndNode,
  [NODE_TYPES.OPERATION]: OperationNode,
}

export default nodeTypes
ENDOFFILE

# ── src/components/canvas/WorkflowCanvas.jsx ────────────────────────────────
cat > src/components/canvas/WorkflowCanvas.jsx << 'ENDOFFILE'
import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'
import nodeTypes from '../nodes'
import { createNode } from '../../utils/nodeFactory'

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef(null)
  const [rfInstance, setRfInstance] = useState(null)

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useWorkflowStore()
  const { setSelectedNodeId } = useUiStore()

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !rfInstance) return
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      addNode(createNode(type, position))
    },
    [rfInstance, addNode]
  )

  const onNodeClick = useCallback(
    (_, node) => setSelectedNodeId(node.id),
    [setSelectedNodeId]
  )

  const onPaneClick = useCallback(
    () => setSelectedNodeId(null),
    [setSelectedNodeId]
  )

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'startNode') return '#22c55e'
            if (node.type === 'endNode') return '#ef4444'
            if (node.type === 'operationNode') return '#3b82f6'
            return '#94a3b8'
          }}
        />
      </ReactFlow>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/TopBar.jsx ────────────────────────────────────────
cat > src/components/layout/TopBar.jsx << 'ENDOFFILE'
import useWorkflowStore from '../../stores/workflowStore'
import { exportWorkflow, importWorkflow } from '../../utils/importExport'

export default function TopBar() {
  const { workflowName, setWorkflowName, nodes, edges, clearWorkflow, loadWorkflow } =
    useWorkflowStore()

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

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-blue-600 text-xl">🧬</span>
        <span className="font-bold text-gray-700 text-sm">BioLab Workflow Designer</span>
      </div>
      <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
      <input
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className="border border-gray-200 rounded-md px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-52"
        placeholder="Workflow name..."
      />
      <div className="flex-1" />
      <button
        onClick={clearWorkflow}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
      >
        Clear
      </button>
      <button
        onClick={handleImport}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Import JSON
      </button>
      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Export JSON
      </button>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/LeftPanel.jsx ─────────────────────────────────────
cat > src/components/layout/LeftPanel.jsx << 'ENDOFFILE'
import { ELEMENT_PALETTE } from '../../constants/nodeTypes'

function PaletteItem({ item }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', item.type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-white hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none"
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

export default function LeftPanel() {
  return (
    <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Elements
        </div>
        <div className="flex flex-col gap-1.5">
          {ELEMENT_PALETTE.map((item) => (
            <PaletteItem key={item.type} item={item} />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 mx-3 my-1" />

      <div className="p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Library
        </div>
        {['Samples', 'Reagents', 'Consumables', 'Devices'].map((lib) => (
          <div
            key={lib}
            className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-400 opacity-50 cursor-not-allowed"
            title="Coming in Phase 3"
          >
            <span className="text-xs">📚</span>
            <span>{lib}</span>
            <span className="ml-auto text-xs bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded">
              soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/components/layout/RightPanel.jsx ────────────────────────────────────
cat > src/components/layout/RightPanel.jsx << 'ENDOFFILE'
import useWorkflowStore from '../../stores/workflowStore'
import useUiStore from '../../stores/uiStore'

export default function RightPanel() {
  const { selectedNodeId } = useUiStore()
  const { nodes, updateNodeData } = useWorkflowStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="w-60 bg-gray-50 border-l border-gray-200 flex items-center justify-center flex-shrink-0">
        <div className="text-center text-gray-300 p-6">
          <div className="text-3xl mb-2">✦</div>
          <div className="text-xs">Click a node to edit its properties</div>
        </div>
      </div>
    )
  }

  const { data, type, id } = selectedNode
  const update = (patch) => updateNodeData(id, patch)

  return (
    <div className="w-60 bg-white border-l border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Properties
        </div>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">
          {type?.replace('Node', '')} node
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Label</label>
          <input
            value={data.label ?? ''}
            onChange={(e) => update({ label: e.target.value })}
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {type === 'operationNode' && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
              <textarea
                value={data.description ?? ''}
                onChange={(e) => update({ description: e.target.value })}
                rows={3}
                placeholder="Describe this operation..."
                className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={data.duration?.value ?? 0}
                  onChange={(e) =>
                    update({ duration: { ...data.duration, value: Number(e.target.value) } })
                  }
                  className="w-20 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                />
                <select
                  value={data.duration?.unit ?? 'min'}
                  onChange={(e) =>
                    update({ duration: { ...data.duration, unit: e.target.value } })
                  }
                  className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="sec">sec</option>
                  <option value="min">min</option>
                  <option value="hr">hr</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5 text-xs text-blue-400">
              Device & sample linking available after Library setup (Phase 3)
            </div>
          </>
        )}

        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-300 font-mono truncate" title={id}>
            ID: {id?.slice(0, 18)}…
          </div>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

# ── src/App.jsx ──────────────────────────────────────────────────────────────
cat > src/App.jsx << 'ENDOFFILE'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import RightPanel from './components/layout/RightPanel'
import WorkflowCanvas from './components/canvas/WorkflowCanvas'

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <main className="flex-1 overflow-hidden bg-gray-50">
          <WorkflowCanvas />
        </main>
        <RightPanel />
      </div>
    </div>
  )
}
ENDOFFILE

echo ""
echo "✅ Phase 1 setup complete! Run: npm run dev"