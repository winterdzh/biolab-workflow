import { useState } from 'react'
import useLibraryStore from '../../stores/libraryStore'

export default function SamplePicker({ value, onChange }) {
  const samples = useLibraryStore((s) => s.samples)
  const [open, setOpen] = useState(false)
  const selected = samples.find((s) => s.id === value?.id)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-left focus:outline-none focus:border-blue-400 hover:border-gray-300 flex items-center justify-between">
        <span className={selected ? 'text-gray-700' : 'text-gray-400'}>
          {selected ? selected.name : 'Select sample...'}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div onClick={() => { onChange(null); setOpen(false) }}
            className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            None
          </div>
          {samples.map((s) => (
            <div key={s.id} onClick={() => { onChange(s); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-green-50 ${selected?.id === s.id ? 'bg-green-50 text-green-700' : 'text-gray-700'}`}>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-400">{s.type} · {s.species}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
