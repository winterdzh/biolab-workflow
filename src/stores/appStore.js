import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { OLIGO_WORKFLOW } from '../data/oligoWorkflow'
import { CELL_WORKFLOW }  from '../data/cellWorkflow'

function makeWorkflow(name = 'New Workflow') {
  return {
    id: uuidv4(),
    name,
    description: '',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    variables: [],   // workflow-scoped variables only
    tags: [],
  }
}

const useAppStore = create((set, get) => ({
  // ── Global variables (cross-workflow)
  globalVariables: [
    { id: 'gv1', name: 'projectName', type: 'string', value: 'My Project', description: 'Project identifier' },
    { id: 'gv2', name: 'operator', type: 'string', value: '', description: 'Operator name' },
  ],

  // ── Workflow list
  workflows: [makeWorkflow('Plasmid Transfection'), makeWorkflow('Cell Seeding'), OLIGO_WORKFLOW, CELL_WORKFLOW],
  activeWorkflowId: null,   // null = cover page

  // ── Global variable CRUD
  addGlobalVariable: (v) =>
    set({ globalVariables: [...get().globalVariables, { ...v, id: uuidv4() }] }),
  updateGlobalVariable: (id, patch) =>
    set({ globalVariables: get().globalVariables.map((v) => v.id === id ? { ...v, ...patch } : v) }),
  deleteGlobalVariable: (id) =>
    set({ globalVariables: get().globalVariables.filter((v) => v.id !== id) }),
  setGlobalVariables: (globalVariables) => set({ globalVariables }),

  // ── Workflow CRUD
  createWorkflow: (name, description = '') => {
    const wf = { ...makeWorkflow(name), description }
    set({ workflows: [...get().workflows, wf] })
    return wf.id
  },

  duplicateWorkflow: (id) => {
    const src = get().workflows.find((w) => w.id === id)
    if (!src) return
    const copy = { ...JSON.parse(JSON.stringify(src)), id: uuidv4(), name: src.name + ' (copy)', createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString() }
    set({ workflows: [...get().workflows, copy] })
  },

  deleteWorkflow: (id) =>
    set({ workflows: get().workflows.filter((w) => w.id !== id), activeWorkflowId: get().activeWorkflowId === id ? null : get().activeWorkflowId }),

  updateWorkflowMeta: (id, patch) =>
    set({ workflows: get().workflows.map((w) => w.id === id ? { ...w, ...patch, modifiedAt: new Date().toISOString() } : w) }),

  // ── Save current editor state back into the workflow list
  saveWorkflow: (id, { nodes, edges, variables }) =>
    set({
      workflows: get().workflows.map((w) =>
        w.id === id ? { ...w, nodes, edges, variables, modifiedAt: new Date().toISOString() } : w
      ),
    }),

  // ── Navigation
  openWorkflow: (id) => set({ activeWorkflowId: id }),
  goToCover: () => set({ activeWorkflowId: null }),

  // ── Import a workflow JSON (adds as new or replaces by id)
  importWorkflowJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (!data.nodes || !data.edges) throw new Error('Missing nodes/edges')
      const existing = get().workflows.find((w) => w.id === data.id)
      if (existing) {
        set({ workflows: get().workflows.map((w) => w.id === data.id ? { ...w, ...data } : w) })
      } else {
        const wf = {
          id: data.id ?? uuidv4(),
          name: data.metadata?.name ?? 'Imported Workflow',
          description: data.metadata?.description ?? '',
          createdAt: data.metadata?.createdAt ?? new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          nodes: data.nodes,
          edges: data.edges,
          variables: data.workflowVariables ?? [],
          tags: data.metadata?.tags ?? [],
        }
        set({ workflows: [...get().workflows, wf] })
      }
      return true
    } catch (e) {
      alert('Invalid workflow JSON: ' + e.message)
      return false
    }
  },

  // ── Export single workflow JSON (only used nodes' library items)
  exportWorkflowJSON: (id, libraryStore) => {
    const wf = get().workflows.find((w) => w.id === id)
    if (!wf) return null
    // Collect library IDs referenced in nodes
    const deviceIds = new Set()
    const sampleIds = new Set()
    wf.nodes.forEach((n) => {
      if (n.data?.device?.id) deviceIds.add(n.data.device.id)
      if (n.data?.sample?.id) sampleIds.add(n.data.sample.id)
    })
    const payload = {
      version: '1.0',
      id: wf.id,
      metadata: { name: wf.name, description: wf.description, createdAt: wf.createdAt, modifiedAt: wf.modifiedAt, tags: wf.tags },
      nodes: wf.nodes,
      edges: wf.edges,
      workflowVariables: wf.variables,
      librarySnapshot: {
        devices: libraryStore.devices.filter((d) => deviceIds.has(d.id)),
        samples: libraryStore.samples.filter((s) => sampleIds.has(s.id)),
        labware: [],
        reagents: [],
      },
    }
    return JSON.stringify(payload, null, 2)
  },

  // ── Export all workflows + full library + global vars
  exportAllJSON: (libraryStore) => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      globalVariables: get().globalVariables,
      workflows: get().workflows,
      library: {
        samples: libraryStore.samples,
        labware: libraryStore.labware,
        reagents: libraryStore.reagents,
        devices: libraryStore.devices,
      },
    }
    return JSON.stringify(payload, null, 2)
  },

  importAllJSON: (jsonString, libraryStore) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.globalVariables) set({ globalVariables: data.globalVariables })
      if (data.workflows) set({ workflows: data.workflows })
      if (data.library) {
        libraryStore.setSamples(data.library.samples ?? [])
        libraryStore.setLabware(data.library.labware ?? data.library.consumables ?? [])
        libraryStore.setReagents(data.library.reagents ?? [])
        libraryStore.setDevices(data.library.devices ?? [])
      }
      return true
    } catch (e) {
      alert('Invalid export JSON: ' + e.message)
      return false
    }
  },
}))

export default useAppStore
