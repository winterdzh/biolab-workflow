import { useState, useRef, useCallback } from 'react'
import { FlaskConical, Hash, Download, Upload, Plus, Search, MoreHorizontal, Boxes, GitBranch, Trash2, FileJson, Copy, Library } from 'lucide-react'
import useAppStore from '../stores/appStore'
import useLibraryStore from '../stores/libraryStore'
import LibraryModal from '../components/library/LibraryModal'
import GlobalVariablesPanel from '../components/panels/GlobalVariablesPanel'

function UploadCard({ onFile, compact = false }) {
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
      className={`border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all select-none apple-card ${compact ? 'p-4 min-h-[120px]' : 'p-5 min-h-[148px]'} ${
        dragOver ? 'border-red-400 bg-red-50/75' : 'border-red-200/70 bg-white/70 hover:border-red-300 hover:bg-red-50/45'
      }`}
      style={{ borderRadius: 14 }}
    >
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={onInputChange} />
      <Upload size={compact ? 22 : 24} className={`mb-2 transition-transform ${dragOver ? 'scale-125 text-red-400' : 'text-gray-400'}`} />
      <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-500`}>Import Workflow</div>
      <div className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-400 mt-1`}>Drop or click to upload <span className="font-mono">.json</span></div>
    </div>
  )
}

function WorkflowCard({ wf, onOpen, onDuplicate, onDelete, onExport, compact = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const date = new Date(wf.modifiedAt).toLocaleDateString()
  return (
    <div
      className={`apple-card border border-black/5 hover:shadow-xl transition-all group cursor-pointer relative flex flex-col ${compact ? 'p-3 gap-2' : 'p-4 gap-3'}`}
      style={{ borderRadius: 14 }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
          <div className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: 'rgba(253,232,232,0.92)', borderRadius: 10 }}>
            <FlaskConical size={compact ? 16 : 18} style={{ color: '#CC0000' }} />
          </div>
          <div>
            <div className={`${compact ? 'text-[13px]' : 'text-sm'} font-semibold text-gray-800 leading-tight`}>{wf.name}</div>
            <div className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-400 mt-0.5`}>Modified {date}</div>
          </div>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity w-7 h-7 hover:bg-gray-100 flex items-center justify-center text-gray-400"
            style={{ borderRadius: 10 }}
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
      {wf.description && <div className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-500 line-clamp-2`}>{wf.description}</div>}
      <div className={`flex items-center gap-3 ${compact ? 'text-[11px]' : 'text-xs'} text-gray-400 mt-auto pt-2 border-t border-gray-100`}>
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
      <div className="bg-white/90 shadow-2xl w-96 overflow-hidden" style={{ borderRadius: 20, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">New Workflow</h2>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cell Seeding Protocol"
              autoFocus
              className="w-full apple-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-100" style={{ borderRadius: 10 }} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Brief description of this workflow..."
              className="w-full apple-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-100 resize-none" style={{ borderRadius: 10 }} />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={() => name.trim() && onCreate(name.trim(), desc)} disabled={!name.trim()}
            className={`flex-1 h-8 text-sm font-medium transition-colors ${name.trim() ? 'bg-[#CC0000] text-white hover:bg-red-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            style={{ borderRadius: 10 }}>
            Create
          </button>
          <button onClick={onClose} className="flex-1 h-8 text-sm border border-gray-200/80 text-gray-600 hover:bg-gray-50 transition-colors" style={{ borderRadius: 10 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function MobileTopActions({
  search,
  setSearch,
  onOpenGlobalVars,
  onOpenLibrary,
  onImportAll,
  onExportAll,
  onNewWorkflow,
}) {
  return (
    <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <FlaskConical size={22} color="white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-white font-semibold text-[16px] leading-tight tracking-[-0.01em]">BioLab Workflow</h1>
          <p className="text-xs text-red-100/80 mt-0.5">Mobile dashboard</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full text-white/80 bg-white/10 flex-shrink-0">iPhone</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workflows..."
          className="w-full apple-input pl-8 pr-3 py-2 text-sm focus:outline-none"
          style={{ borderRadius: 12 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onOpenGlobalVars} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 border border-white/20 text-white text-xs font-medium hover:bg-white/14 transition-colors" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.10)' }}>
          <Hash size={13} /> Vars
        </button>
        <button onClick={onOpenLibrary} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 border border-white/20 text-white text-xs font-medium hover:bg-white/14 transition-colors" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.10)' }}>
          <Library size={13} /> Library
        </button>
        <button onClick={onImportAll} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 border border-white/20 text-white text-xs font-medium hover:bg-white/14 transition-colors" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.10)' }}>
          <Upload size={13} /> Import
        </button>
        <button onClick={onExportAll} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 bg-white text-[#CC0000] text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm" style={{ borderRadius: 12 }}>
          <Download size={13} /> Export
        </button>
      </div>

      <button onClick={onNewWorkflow} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 bg-[#CC0000] text-white text-sm font-medium hover:bg-red-800 transition-colors shadow-sm" style={{ borderRadius: 12 }}>
        <Plus size={14} /> New Workflow
      </button>
    </div>
  )
}

export default function CoverPage({ isMobile = false }) {
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
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(180,0,0,0.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.15)' }}>
        {isMobile ? (
          <MobileTopActions
            search={search}
            setSearch={setSearch}
            onOpenGlobalVars={() => setShowGlobalVars(true)}
            onOpenLibrary={() => setShowLibrary(true)}
            onImportAll={handleImportAll}
            onExportAll={handleExportAll}
            onNewWorkflow={() => setShowNewModal(true)}
          />
        ) : (
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
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/25 text-white text-sm hover:bg-white/14 transition-colors"
              style={{ borderRadius: 10 }}>
              <Hash size={14} /> Global Variables
              {appStore.globalVariables.length > 0 && (
                <span className="bg-white text-[#CC0000] text-xs px-1.5 rounded-[8px] font-semibold leading-4">{appStore.globalVariables.length}</span>
              )}
            </button>
            <button onClick={() => setShowLibrary(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/25 text-white text-sm hover:bg-white/14 transition-colors"
              style={{ borderRadius: 10 }}>
              Library
            </button>
            <div className="w-px h-5 bg-white/25" />
            <button onClick={handleImportAll}
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/25 text-white text-sm hover:bg-white/14 transition-colors"
              style={{ borderRadius: 10 }}>
              <Upload size={14} /> Import All
            </button>
            <button onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-white text-[#CC0000] text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm"
              style={{ borderRadius: 10 }}>
              <Download size={14} /> Export All
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto apple-scroll">
        <div className="max-w-6xl mx-auto w-full px-6 py-6">
          {!isMobile && (
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full apple-input pl-8 pr-3 py-1.5 text-sm focus:outline-none" style={{ borderRadius: 10 }} />
              </div>
              <div className="flex-1" />
              <button onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#CC0000] text-white text-sm font-medium hover:bg-red-800 transition-colors shadow-sm"
                style={{ borderRadius: 10 }}>
                <Plus size={15} /> New Workflow
              </button>
            </div>
          )}

          {isMobile && (
            <div className="mb-4">
              <button onClick={() => setShowNewModal(true)} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 bg-[#CC0000] text-white text-sm font-medium hover:bg-red-800 transition-colors shadow-sm w-full" style={{ borderRadius: 12 }}>
                <Plus size={15} /> New Workflow
              </button>
            </div>
          )}

          {/* Grid — upload card always first */}
          <div className={isMobile ? 'grid grid-cols-1 gap-3 pb-8' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8'}>
            <UploadCard onFile={processFile} compact={isMobile} />
            {filtered.map((wf) => (
              <WorkflowCard key={wf.id} wf={wf}
                compact={isMobile}
                onOpen={() => appStore.openWorkflow(wf.id)}
                onDuplicate={() => appStore.duplicateWorkflow(wf.id)}
                onDelete={() => { if (confirm(`Delete "${wf.name}"?`)) appStore.deleteWorkflow(wf.id) }}
                onExport={() => handleExport(wf.id)} />
            ))}
            {filtered.length === 0 && !search && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300 col-span-1 sm:col-span-2 lg:col-span-3">
                <FlaskConical size={36} className="mb-3 text-gray-200" />
                <div className="text-sm text-gray-400">No workflows yet. Create one or import a JSON file.</div>
              </div>
            )}
          </div>
          <div className="pt-2 pb-4">
            <div className={isMobile ? 'border-t border-gray-200/80 bg-white/75 backdrop-blur-md' : 'border-t border-gray-200 bg-white'} style={isMobile ? { borderRadius: 14 } : {}}>
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-400">© 2026 Zhenhao Dong. Built with GitHub Copilot.</span>
                <a
                  href="https://github.com/winterdzh/biolab-workflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showGlobalVars && <GlobalVariablesPanel scope="global" onClose={() => setShowGlobalVars(false)} />}
      {showNewModal && <NewWorkflowModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
    </div>
  )
}
