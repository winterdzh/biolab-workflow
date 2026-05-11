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
  setVariableNode: '#336699', experimentNode: '#CC0000', processNode: '#7c3aed',
  sampleNode: '#3b82f6', labwareNode: '#06b6d4', reagentNode: '#8b5cf6',
}

// Object node types — cannot participate in workflow flow edges
const OBJECT_NODE_TYPES = new Set(['sampleNode', 'labwareNode', 'reagentNode', 'dataNode'])

export default function WorkflowCanvas({ readOnly = false }) {
  const reactFlowWrapper = useRef(null)
  const [rfInstance, setRfInstance] = useState(null)
  const [showMinimap, setShowMinimap] = useState(true)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode,
          clipboard, copyNode, pasteNode } = useWorkflowStore()
  const { selectedNodeId, setSelectedNodeId, setSelectedEdgeId, visibleFlows } = useUiStore()

  // Keyboard shortcuts: Ctrl+C copy selected node, Ctrl+V paste
  useEffect(() => {
    if (readOnly) return
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

  // ── Connection validation ──────────────────────────────────────────────────
  // Rules:
  //   out-* / mat-out (source) → in-* / new-input / mat-in (target) : material/data connection
  //   flow handles → workflow connections only, never to/from object nodes
  const isValidConnection = useCallback(
    ({ source, target, sourceHandle, targetHandle }) => {
      if (source === target) return false
      const srcNode = nodes.find((n) => n.id === source)
      const tgtNode = nodes.find((n) => n.id === target)
      const srcIsPort = sourceHandle?.startsWith('out-') || sourceHandle === 'mat-out'
      const tgtIsPort = targetHandle?.startsWith('in-') || targetHandle === 'new-input' || targetHandle === 'mat-in'
      // Material/data connections: both sides must be port/mat handles
      if (srcIsPort || tgtIsPort) {
        if (!(srcIsPort && tgtIsPort)) return false
        // Each item handle (out-<id>) on an object node can only have one outgoing edge
        if (sourceHandle?.startsWith('out-') && OBJECT_NODE_TYPES.has(srcNode?.type)) {
          const alreadyConnected = edges.some((e) => e.source === source && e.sourceHandle === sourceHandle)
          if (alreadyConnected) return false
        }
        return true
      }
      // Workflow flow connections: neither side may be an object node
      if (OBJECT_NODE_TYPES.has(srcNode?.type) || OBJECT_NODE_TYPES.has(tgtNode?.type)) return false
      return true
    },
    [nodes, edges],
  )

  // ── node type → port type (for objects nodes) ─────────────────────────────
  const OBJ_PORT_TYPE = {
    sampleNode: 'sample', reagentNode: 'reagent',
    labwareNode: 'labware', dataNode: 'info',
  }

  // ── Auto edge type + port metadata ───────────────────────────────────────
  const handleConnect = useCallback(
    (connection) => {
      const { source, sourceHandle, targetHandle } = connection
      const srcIsPort = sourceHandle?.startsWith('out-') || sourceHandle === 'mat-out'

      if (srcIsPort) {
        const srcNode = nodes.find((n) => n.id === source)
        let portType  = 'consumable'
        let portLabel = ''

        if (sourceHandle === 'mat-out') {
          // SampleNode / DataNode — single handle, derive from node type + label
          portType  = OBJ_PORT_TYPE[srcNode?.type] ?? 'consumable'
          portLabel = srcNode?.data?.label ?? ''
        } else if (srcNode && OBJ_PORT_TYPE[srcNode.type]) {
          // Per-item handle from ReagentNode / LabwareNode / DataNode (out-<itemId>)
          const itemId = sourceHandle.slice(4)
          let item
          if (srcNode.type === 'dataNode') {
            item = srcNode.data?.items?.find((o) => o.id === itemId)
              ?? srcNode.data?.files?.find((o) => o.id === itemId)
              ?? srcNode.data?.outputs?.find((o) => o.id === itemId)
          } else {
            item = srcNode.data?.items?.find((it) => it.id === itemId)
          }
          portType  = OBJ_PORT_TYPE[srcNode.type] ?? 'consumable'
          portLabel = item?.name ?? srcNode?.data?.label ?? ''
        } else {
          // Operation output port (out-<portId>)
          const portId = sourceHandle.slice(4)
          const port   = srcNode?.data?.outputs?.find((p) => p.id === portId)
          portType  = port?.type  ?? 'consumable'
          portLabel = port?.label ?? ''
        }

        // If landing on new-input handle, generate a real in-<id> target handle
        const finalTargetHandle = (targetHandle === 'new-input')
          ? `in-${Math.random().toString(36).slice(2, 8)}`
          : targetHandle

        onConnect({ ...connection, targetHandle: finalTargetHandle, type: 'labwareEdge', data: { portType, portLabel } })
      } else {
        onConnect({ ...connection, type: 'workflowEdge' })
      }
    },
    [onConnect, nodes],
  )

  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), [setSelectedNodeId])
  const onEdgeClick = useCallback((_, edge) => setSelectedEdgeId(edge.id), [setSelectedEdgeId])
  const onPaneClick = useCallback(() => { setSelectedNodeId(null); setSelectedEdgeId(null) }, [setSelectedNodeId, setSelectedEdgeId])

  // ── Flow visibility: classify each edge and apply hidden flag ─────────────
  const displayEdges = edges.map((e) => {
    let flow
    switch (e.type) {
      case 'workflowEdge':  flow = 'workflow'; break
      case 'sampleFlow':    flow = 'sample';   break
      case 'reagentFlow':   flow = 'reagent';  break
      case 'labwareFlow':   flow = 'labware';  break
      case 'dataFlow':      flow = 'data';     break
      case 'labwareEdge':
      case 'materialEdge':
        switch (e.data?.portType) {
          case 'sample':  flow = 'sample';  break
          case 'reagent': flow = 'reagent'; break
          case 'info':    flow = 'data';    break
          default:        flow = 'labware'; break
        }
        break
      default:             flow = 'workflow'; break
    }
    const hidden = !visibleFlows[flow]
    return hidden === e.hidden ? e : { ...e, hidden }
  })

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes} edges={displayEdges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={handleConnect} onInit={setRfInstance}
        isValidConnection={isValidConnection}
        onDrop={onDrop} onDragOver={onDragOver}
        onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        fitView deleteKeyCode={readOnly ? null : 'Delete'}
        selectionOnDrag={!readOnly} panOnDrag={readOnly ? true : [1, 2]}
        nodesDraggable={!readOnly} nodesConnectable={!readOnly} elementsSelectable={!readOnly}
        elevateEdgesOnSelect
      >
        {!readOnly && <SelectionToolbar />}

        {/* Paste button — only visible when clipboard has content */}
        {!readOnly && clipboard && (
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

        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(60,60,67,0.25)" />
        <Controls />
        {/* MiniMap + toggle button — wrapped together so they never overlap */}
        <Panel position="bottom-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={() => setShowMinimap(v => !v)}
            title={showMinimap ? 'Hide minimap' : 'Show minimap'}
            style={{
              padding: '3px 8px', fontSize: 10, lineHeight: 1.4,
              background: 'rgba(250,250,252,0.9)', border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 10, cursor: 'pointer', color: '#6e6e73',
              display: 'flex', alignItems: 'center', gap: 3,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            {showMinimap ? '▾' : '▸'} map
          </button>
          {showMinimap && (
            <MiniMap
              nodeColor={(n) => NODE_COLORS[n.type] ?? '#999999'}
              maskColor="rgba(240,240,240,0.6)"
              style={{ position: 'static', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', margin: 0, background: 'rgba(250,250,252,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            />
          )}
        </Panel>
      </ReactFlow>
    </div>
  )
}
