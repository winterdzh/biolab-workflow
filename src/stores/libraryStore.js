import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import defaultSamples from '../data/defaultLibraries/samples.json'
import defaultLabware from '../data/defaultLibraries/labware.json'
import defaultReagents from '../data/defaultLibraries/reagents.json'
import defaultDevices from '../data/defaultLibraries/devices.json'

const useLibraryStore = create((set, get) => ({
  samples: defaultSamples,
  labware: defaultLabware,
  reagents: defaultReagents,
  devices: defaultDevices,

  setSamples: (samples) => set({ samples }),
  setLabware: (labware) => set({ labware }),
  setReagents: (reagents) => set({ reagents }),
  setDevices: (devices) => set({ devices }),

  addItem: (category, item) =>
    set({ [category]: [...get()[category], { ...item, id: uuidv4() }] }),
  updateItem: (category, id, patch) =>
    set({ [category]: get()[category].map((x) => x.id === id ? { ...x, ...patch } : x) }),
  deleteItem: (category, id) =>
    set({ [category]: get()[category].filter((x) => x.id !== id) }),

  exportLibraryJSON: (category) => JSON.stringify(get()[category], null, 2),
  importLibraryJSON: (category, jsonString) => {
    try {
      const items = JSON.parse(jsonString)
      if (!Array.isArray(items)) throw new Error()
      set({ [category]: items.map((x) => ({ ...x, id: x.id ?? uuidv4() })) })
      return true
    } catch { alert('Invalid JSON format'); return false }
  },
  importLibraryCSV: (category, csvString) => {
    try {
      const lines = csvString.trim().split('\n')
      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
      const items = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))
        const obj = { id: uuidv4() }
        headers.forEach((h, i) => { if (h && h !== 'id') obj[h] = values[i] ?? '' })
        return obj
      })
      set({ [category]: [...get()[category], ...items] })
      return true
    } catch { alert('Invalid CSV format'); return false }
  },
}))

export default useLibraryStore
