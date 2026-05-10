import { useState } from 'react'
import {
  Play, Square, Settings, GitBranch, RefreshCw, Clock, Hash, Layers,
  FlaskConical, Package, Droplets, Cpu, Database, StickyNote, GitFork, Zap,
} from 'lucide-react'
import { ELEMENT_PALETTE, GROUP_PALETTE } from '../../constants/nodeTypes'
import useLibraryStore from '../../stores/libraryStore'
import LibraryModal from '../library/LibraryModal'

const NODE_ICONS = {
  startNode:        Play,
  endNode:          Square,
  operationNode:    Settings,
  ifElseNode:       GitBranch,
  loopNode:         RefreshCw,
  waitUntilNode:    Clock,
  setVariableNode:  Hash,
  dataNode:         Database,
  notificationNode: StickyNote,
  experimentNode:   Layers,
  sampleNode:       FlaskConical,
  labwareNode:      Package,
  reagentNode:      Droplets,
  parallelNode:     GitFork,
  processNode:      Zap,
}

const CATEGORY_LABELS = {
  operation: 'Operation',
  control:   'Control',
  objects:   'Objects',
}

function PaletteItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  const Icon = NODE_ICONS[item.type]
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2 py-1 bg-white/80 hover:bg-white/92 cursor-grab active:cursor-grabbing transition-all select-none shadow-sm"
      style={{ borderRadius: 10 }}
    >
      <div
        className="w-5 h-5 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: item.color, borderRadius: 6 }}
      >
        {Icon && <Icon size={11} color="white" strokeWidth={2.5} />}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-gray-700 leading-tight">{item.label}</div>
      </div>
    </div>
  )
}

function ExperimentPaletteItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2 py-1 border-2 border-dashed bg-white/88 cursor-grab active:cursor-grabbing transition-colors select-none hover:bg-red-50/45 shadow-sm"
      style={{ borderColor: '#CC0000', borderRadius: 10 }}
    >
      <div
        className="w-5 h-5 flex items-center justify-center flex-shrink-0 border-2 border-dashed"
        style={{ borderColor: '#CC0000', borderRadius: 6 }}
      >
        <Layers size={11} color="#CC0000" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium leading-tight" style={{ color: '#CC0000' }}>{item.label}</div>
      </div>
    </div>
  )
}

const LIBRARY_ICONS = {
  samples: FlaskConical,
  labware:  Package,
  reagents: Droplets,
  devices:  Cpu,
}

const LIBRARY_TABS = [
  { key: 'samples',  label: 'Samples' },
  { key: 'labware',  label: 'Labware' },
  { key: 'reagents', label: 'Reagents' },
  { key: 'devices',  label: 'Devices' },
]

export default function LeftPanel({ width = 240 }) {
  const [showLibrary, setShowLibrary] = useState(false)
  const store = useLibraryStore()

  return (
    <>
      <div className="apple-glass flex flex-col flex-shrink-0" style={{ width, boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.65)' }}>
        <div className="flex-1 overflow-y-auto min-h-0 apple-scroll">

        {/* Elements - grouped by category */}
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-0.5">Elements</div>
          {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
            const items = ELEMENT_PALETTE.filter(i => i.category === cat)
            if (!items.length) return null
            return (
              <div key={cat} className="mb-2">
                <div className="text-xs text-gray-400 font-medium px-0.5 mb-1">{catLabel}</div>
                <div className="flex flex-col gap-0.5">
                  {items.map(item => <PaletteItem key={item.type} item={item} />)}
                </div>
              </div>
            )
          })}
          {/* Group */}
          <div className="mb-1">
            <div className="text-xs text-gray-400 font-medium px-0.5 mb-1">Group</div>
            <div className="text-xs text-gray-500 px-0.5 mb-1.5">Drag to canvas, or select 2+ nodes</div>
            <div className="flex flex-col gap-0.5">
              {GROUP_PALETTE.map(item => <ExperimentPaletteItem key={item.type} item={item} />)}
            </div>
          </div>
        </div>

        <div className="mx-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

        {/* Library */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Library</div>
            <button onClick={() => setShowLibrary(true)} className="text-xs text-[#CC0000] hover:text-red-800 font-medium">Manage →</button>
          </div>
          {LIBRARY_TABS.map(({ key, label }) => {
            const Icon = LIBRARY_ICONS[key]
            return (
              <div key={key} onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 hover:bg-white/92 cursor-pointer transition-all shadow-sm"
                style={{ borderRadius: 10 }}
              >
                {Icon && <Icon size={13} className="text-gray-400 flex-shrink-0" />}
                <span>{label}</span>
                <span className="ml-auto text-xs text-gray-400">{store[key]?.length ?? 0}</span>
              </div>
            )
          })}
        </div>
        </div>
      </div>
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
    </>
  )
}

