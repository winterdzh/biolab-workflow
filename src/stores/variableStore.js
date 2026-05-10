// Thin wrapper — actual storage is inside each workflow in appStore.
// The editor uses this for convenient reactive access to the active workflow's variables.
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export const VAR_TYPES = ['number', 'string', 'boolean', 'list']

const useVariableStore = create((set, get) => ({
  variables: [],   // workflow-scoped variables (loaded when opening a workflow)

  setVariables: (variables) => set({ variables }),

  addVariable: (v) => set({ variables: [...get().variables, { ...v, id: uuidv4() }] }),
  updateVariable: (id, patch) =>
    set({ variables: get().variables.map((v) => v.id === id ? { ...v, ...patch } : v) }),
  deleteVariable: (id) =>
    set({ variables: get().variables.filter((v) => v.id !== id) }),
}))

export default useVariableStore
