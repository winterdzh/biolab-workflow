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
