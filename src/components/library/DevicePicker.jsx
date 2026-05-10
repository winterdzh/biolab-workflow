import { useState } from 'react'
import useLibraryStore from '../../stores/libraryStore'

export default function DevicePicker({ value, onChange }) {
  const devices = useLibraryStore((s) => s.devices)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const selected = devices.find((d) => d.id === value?.id)

  // Group by category, sorted alphabetically
  const groups = {}
  devices.forEach((d) => {
    const cat = d.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(d)
  })
  const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b))

  const toggleCat = (cat) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-left focus:outline-none focus:border-blue-400 hover:border-gray-300 flex items-center justify-between">
        <span className={selected ? 'text-gray-700' : 'text-gray-400'}>
          {selected ? selected.name : 'Select device...'}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Clear selection */}
          <div onClick={() => { onChange(null); setOpen(false) }}
            className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            None
          </div>

          {sortedCats.map((cat) => (
            <div key={cat}>
              {/* Category header — click to collapse */}
              <div
                onClick={() => toggleCat(cat)}
                className="flex items-center justify-between px-3 py-1.5 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none border-b border-gray-100"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{cat}</span>
                <span className="text-xs text-gray-300 flex items-center gap-1">
                  <span>{groups[cat].length}</span>
                  <span>{collapsed[cat] ? '▶' : '▼'}</span>
                </span>
              </div>

              {/* Device rows */}
              {!collapsed[cat] && groups[cat].map((d) => (
                <div key={d.id} onClick={() => { onChange(d); setOpen(false) }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-0 ${
                    selected?.id === d.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}>
                  <div className="font-medium">{d.name}</div>
                  {(d.headType || d.capacity) && (
                    <div className="text-xs text-gray-400">{[d.headType, d.capacity].filter(Boolean).join(' · ')}</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

