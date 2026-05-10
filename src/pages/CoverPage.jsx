import { useState, useRef, useCallback } from 'react'
import { FlaskConical, Hash, Download, Upload, Plus, Search, MoreHorizontal, Boxes, GitBranch, Trash2, FileJson, Copy } from 'lucide-react'
import useAppStore from '../stores/appStore'
import useLibraryStore from '../stores/libraryStore'
import LibraryModal from '../components/library/LibraryModal'
import GlobalVariablesPanel from '../components/panels/GlobalVariablesPanel'

function UploadCard({ onFile }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }
  const onDragLeave = (e) => { e.stopPropagation(); setDragOver(false) }
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }
  const onClick = () => inputRef.current?.click()
  const onInputChange = (e) => { const f = e.target.files[0]; if (f) onFile(f) }

  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onClick}
      className={`border-2 border-dashed p-5 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[148px] select-none ${
        dragOver ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-red-300 hover:bg-red-50/40'
      }`}
      style={{ borderRadius: 4 }}
    >
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={onInputChange} />
      <Upload size={24} className={`mb-2 transition-transform ${dragOver ? 'scale-125 text-red-400' : 'text-gray-400'}`} />
      <div className="text-sm font-medium text-gray-500">Import Workflow</div>
      <div className="text-xs text-gray-400 mt-1">Drop or click to upload <span className="font-mono">.json</span></div>
    </div>
  )
}

function WorkflowCard({ wf, onOpen, onDuplicate, onDelete, onExport }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const date = new Date(wf.modifiedAt).toLocaleDateString()
  return (
    <div
      className="bg-white border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all group cursor-pointer relative flex flex-col gap-3"
      style={{ borderRadius: 4 }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fde8e8', borderRadius: 4 }}>
            <FlaskConical size={18} style={{ color: '#CC0000' }} />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{wf.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">Modified {date}</div>
          </div>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 hover:bg-gray-100 flex items-center justify-center text-gray-400"
            style={{ borderRadius: 4 }}
          ><MoreHorizontal size={16} /></button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 w-40 overflow-hidden py-1"
              style={{ borderRadius: 4 }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button onClick={() => { onOpen(); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FileJson size={13} className="text-gray-400" /> Open</button>
              <button onClick={() => { onExport(); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={13} className="text-gray-400" /> Export JSON</button>
              <button onClick={() => { onDuplicate(); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Copy size={13} className="text-gray-400" /> Duplicate</button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={13} /> Delete</button>
            </div>
          )}
        </div>
      </div>
      {wf.description && <div className="text-xs text-gray-500 line-clamp-2">{wf.description}</div>}
      <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1"><Boxes size={11} /> {wf.nodes?.length ?? 0} nodes</span>
        <span className="flex items-center gap-1"><GitBranch size={11} /> {wf.edges?.length ?? 0} connections</span>
        {wf.variables?.length > 0 && <span className="flex items-center gap-1"><Hash size={11} /> {wf.variables.length} vars</span>}
      </div>
    </div>
  )
}

function NewWorkflowModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white shadow-2xl w-96 overflow-hidden" style={{ borderRadius: 4 }}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">New Workflow</h2>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cell Seeding Protocol"
              autoFocus
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" style={{ borderRadius: 4 }} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Brief description of this workflow..."
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" style={{ borderRadius: 4 }} />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={() => name.trim() && onCreate(name.trim(), desc)} disabled={!name.trim()}
            className={`flex-1 h-8 text-sm font-medium transition-colors ${name.trim() ? 'bg-[#CC0000] text-white hover:bg-red-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            style={{ borderRadius: 4 }}>
            Create
          </button>
          <button onClick={onClose} className="flex-1 h-8 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ borderRadius: 4 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function CoverPage() {
  const appStore = useAppStore()
  const libraryStore = useLibraryStore()
  const [showLibrary, setShowLibrary] = useState(false)
  const [showGlobalVars, setShowGlobalVars] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = appStore.workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (name, desc) => {
    const id = appStore.createWorkflow(name, desc)
    appStore.openWorkflow(id)
    setShowNewModal(false)
  }

  const handleExport = (wfId) => {
    const json = appStore.exportWorkflowJSON(wfId, libraryStore)
    if (!json) return
    const wf = appStore.workflows.find((w) => w.id === wfId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(wf?.name ?? 'workflow').replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    const json = appStore.exportAllJSON(libraryStore)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `biolab_export_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportAll = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => appStore.importAllJSON(ev.target.result, libraryStore)
      reader.readAsText(file)
    }
    input.click()
  }

  const processFile = useCallback((file) => {
    if (!file?.name.endsWith('.json')) { alert('Please select a .json workflow file'); return }
    const reader = new FileReader()
    reader.onload = (ev) => appStore.importWorkflowJSON(ev.target.result)
    reader.readAsText(file)
  }, [appStore])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#CC0000]" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <FlaskConical size={24} color="white" />
            <div>
              <h1 className="font-semibold text-white text-base leading-tight">BioLab Workflow Designer</h1>
              <p className="text-xs text-red-200">Lab automation workflow builder</p>
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowGlobalVars(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/35 text-white text-sm hover:bg-white/15 transition-colors"
            style={{ borderRadius: 4 }}>
            <Hash size={14} /> Global Variables
            {appStore.globalVariables.length > 0 && (
              <span className="bg-white text-[#CC0000] text-xs px-1.5 rounded-sm font-semibold leading-4">{appStore.globalVariables.length}</span>
            )}
          </button>
          <button onClick={() => setShowLibrary(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/35 text-white text-sm hover:bg-white/15 transition-colors"
            style={{ borderRadius: 4 }}>
            Library
          </button>
          <div className="w-px h-5 bg-white/25" />
          <button onClick={handleImportAll}
            className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/35 text-white text-sm hover:bg-white/15 transition-colors"
            style={{ borderRadius: 4 }}>
            <Upload size={14} /> Import All
          </button>
          <button onClick={handleExportAll}
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-white text-[#CC0000] text-sm font-semibold hover:bg-red-50 transition-colors"
            style={{ borderRadius: 4 }}>
            <Download size={14} /> Export All
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows..."
              className="w-full border border-gray-200 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-red-400 bg-white" style={{ borderRadius: 4 }} />
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#CC0000] text-white text-sm font-medium hover:bg-red-800 transition-colors"
            style={{ borderRadius: 4 }}>
            <Plus size={15} /> New Workflow
          </button>
        </div>

        {/* Grid — upload card always first */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <UploadCard onFile={processFile} />
          {filtered.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf}
              onOpen={() => appStore.openWorkflow(wf.id)}
              onDuplicate={() => appStore.duplicateWorkflow(wf.id)}
              onDelete={() => { if (confirm(`Delete "${wf.name}"?`)) appStore.deleteWorkflow(wf.id) }}
              onExport={() => handleExport(wf.id)} />
          ))}
          {filtered.length === 0 && !search && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 col-span-2">
              <FlaskConical size={36} className="mb-3 text-gray-200" />
              <div className="text-sm text-gray-400">No workflows yet. Create one or import a JSON file.</div>
            </div>
          )}
        </div>
      </div>

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showGlobalVars && <GlobalVariablesPanel scope="global" onClose={() => setShowGlobalVars(false)} />}
      {showNewModal && <NewWorkflowModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">© 2026 Zhenhao Dong. Built with GitHub Copilot.</span>
          <a
            href="https://github.com/winterdzh/biolab-workflow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
