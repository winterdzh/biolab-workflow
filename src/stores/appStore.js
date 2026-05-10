import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { DEMO_WORKFLOW } from '../data/demoWorkflow'

const APP_STATE_STORAGE_KEY = 'biolab.appState.v1'
const CONFIDENTIAL_NAME_REGEX = /(oligo|cell\s*culture|cell\s*processing|bac[-\s]?expression)/i
const REMOVED_PLACEHOLDER_NAMES = new Set(['plasmid transfection', 'cell seeding'])

function normalizeName(name = '') {
  return String(name).trim().toLowerCase()
}

function orderWorkflows(workflows = []) {
  const demoId = DEMO_WORKFLOW.id
  const demo = workflows.find((w) => w.id === demoId)
  const rest = workflows.filter((w) => w.id !== demoId)
  return demo ? [demo, ...rest] : rest
}

function ensureDemoWorkflow(workflows = []) {
  const demoId = DEMO_WORKFLOW.id
  if (workflows.some((w) => w.id === demoId)) return workflows
  return [DEMO_WORKFLOW, ...workflows]
}

function sanitizeWorkflows(workflows = []) {
  const filtered = (workflows ?? []).filter((w) => {
    if (!w) return false
    const name = String(w.name ?? '')
    const tags = Array.isArray(w.tags) ? w.tags.join(' ') : ''
    const normalizedName = normalizeName(name)
    if (REMOVED_PLACEHOLDER_NAMES.has(normalizedName)) return false
    return !(CONFIDENTIAL_NAME_REGEX.test(name) || CONFIDENTIAL_NAME_REGEX.test(tags))
  })
  return orderWorkflows(ensureDemoWorkflow(filtered))
}

function getWorkflowFingerprint(workflows = []) {
  return workflows
    .map((w) => `${w.id}:${w.modifiedAt ?? ''}:${w.nodes?.length ?? 0}:${w.edges?.length ?? 0}`)
    .sort()
    .join('|')
}

function loadPersistedAppState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return null
    if (!Array.isArray(parsed.workflows) || !Array.isArray(parsed.globalVariables)) return null
    return {
      ...parsed,
      workflows: sanitizeWorkflows(parsed.workflows),
    }
  } catch {
    return null
  }
}

function toPersistedPayload(state) {
  return {
    version: 1,
    globalVariables: state.globalVariables,
    workflows: state.workflows,
    activeWorkflowId: state.activeWorkflowId,
    lastBackupAt: state.lastBackupAt,
    lastBackupFingerprint: state.lastBackupFingerprint,
    dismissedBackupFingerprint: state.dismissedBackupFingerprint,
  }
}

function savePersistedAppState(state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(toPersistedPayload(state)))
  } catch {
    // Ignore write failures (private mode / quota exceeded).
  }
}

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

const persisted = loadPersistedAppState()
const defaultWorkflows = orderWorkflows([DEMO_WORKFLOW])
const initialWorkflows = (persisted?.workflows?.length ? persisted.workflows : defaultWorkflows)
const initialGlobalVariables = persisted?.globalVariables ?? [
  { id: 'gv1', name: 'projectName', type: 'string', value: 'My Project', description: 'Project identifier' },
  { id: 'gv2', name: 'operator', type: 'string', value: '', description: 'Operator name' },
]
const initialActiveWorkflowId = (persisted?.activeWorkflowId && initialWorkflows.some((w) => w.id === persisted.activeWorkflowId))
  ? persisted.activeWorkflowId
  : null
const initialLastBackupAt = persisted?.lastBackupAt ?? null
const initialLastBackupFingerprint = persisted?.lastBackupFingerprint ?? null
const initialDismissedBackupFingerprint = persisted?.dismissedBackupFingerprint ?? null

const useAppStore = create((set, get) => ({
  // ── Global variables (cross-workflow)
  globalVariables: initialGlobalVariables,

  // ── Workflow list
  workflows: initialWorkflows,
  activeWorkflowId: initialActiveWorkflowId,   // null = cover page

  // ── Backup reminder metadata
  lastBackupAt: initialLastBackupAt,
  lastBackupFingerprint: initialLastBackupFingerprint,
  dismissedBackupFingerprint: initialDismissedBackupFingerprint,

  getWorkflowsFingerprint: () => getWorkflowFingerprint(get().workflows),
  needsBackupReminder: () => {
    const current = getWorkflowFingerprint(get().workflows)
    if (!current) return false
    if (get().dismissedBackupFingerprint === current) return false
    return get().lastBackupFingerprint !== current
  },
  markBackupExported: () => {
    const current = getWorkflowFingerprint(get().workflows)
    set({
      lastBackupAt: new Date().toISOString(),
      lastBackupFingerprint: current,
      dismissedBackupFingerprint: null,
    })
  },
  dismissBackupReminder: () => {
    set({ dismissedBackupFingerprint: getWorkflowFingerprint(get().workflows) })
  },

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
    set({ workflows: orderWorkflows([...get().workflows, wf]) })
    return wf.id
  },

  duplicateWorkflow: (id) => {
    const src = get().workflows.find((w) => w.id === id)
    if (!src) return
    const copy = { ...JSON.parse(JSON.stringify(src)), id: uuidv4(), name: src.name + ' (copy)', createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString() }
    set({ workflows: orderWorkflows([...get().workflows, copy]) })
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
        const merged = sanitizeWorkflows(get().workflows.map((w) => w.id === data.id ? { ...w, ...data } : w))
        set({ workflows: merged })
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
        set({ workflows: sanitizeWorkflows([...get().workflows, wf]) })
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
      if (data.workflows) set({ workflows: sanitizeWorkflows(data.workflows) })
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

if (typeof window !== 'undefined') {
  useAppStore.subscribe((state) => {
    savePersistedAppState(state)
  })
}

export default useAppStore
