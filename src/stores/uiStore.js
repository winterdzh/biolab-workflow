import { create } from 'zustand'

const useUiStore = create((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  // ── Flow visibility filter ─────────────────────────────────────────────────
  visibleFlows: { workflow: true, sample: true, reagent: true, labware: true, data: true },
  toggleFlow: (key) =>
    set((s) => ({ visibleFlows: { ...s.visibleFlows, [key]: !s.visibleFlows[key] } })),
  setAllFlows: (visible) =>
    set({ visibleFlows: { workflow: visible, sample: visible, reagent: visible, labware: visible, data: visible } }),
}))

export default useUiStore
