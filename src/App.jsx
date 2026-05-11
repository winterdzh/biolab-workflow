import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useAppStore from './stores/appStore'
import useWorkflowStore from './stores/workflowStore'
import useVariableStore from './stores/variableStore'
import CoverPage from './pages/CoverPage'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import RightPanel from './components/layout/RightPanel'
import WorkflowCanvas from './components/canvas/WorkflowCanvas'

const MIN_PANEL = 160
const MAX_PANEL = 520

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function ResizeDivider({ onDrag, onCollapse, collapsed, side }) {
  const dragging = useRef(false)

  const onMouseDown = useCallback((e) => {
    // Don't start drag if clicking the collapse button
    if (e.target.closest('button')) return
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (me) => { if (dragging.current) onDrag(me.movementX) }
    const onUp   = ()   => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [onDrag])

  const CollapseIcon = collapsed
    ? (side === 'left' ? ChevronRight : ChevronLeft)
    : (side === 'left' ? ChevronLeft  : ChevronRight)

  return (
    <div
      onMouseDown={onMouseDown}
      className="relative flex-shrink-0 flex items-center justify-center group"
      style={{ width: 12, cursor: 'col-resize', background: 'transparent', zIndex: 10 }}
    >
      <div
        className="w-px h-full group-hover:w-0.5 transition-all"
        style={{ background: '#e5e7eb' }}
      />
      {/* Collapse toggle button */}
      <button
        onClick={onCollapse}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 z-20"
        style={{ width: 18, height: 32, borderRadius: 4, cursor: 'pointer' }}
      >
        <CollapseIcon size={11} className="text-gray-500" />
      </button>
    </div>
  )
}

function WorkflowEditor({ workflowId, isMobile }) {
  const appStore = useAppStore()
  const { loadWorkflow } = useWorkflowStore()
  const varStore = useVariableStore()
  const wf = appStore.workflows.find((w) => w.id === workflowId)

  const [leftW,  setLeftW]  = useState(240)
  const [rightW, setRightW] = useState(240)
  const [leftCollapsed,  setLeftCollapsed]  = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  // Remember widths before collapse so we can restore them
  const prevLeftW  = useRef(240)
  const prevRightW = useRef(240)

  const toggleLeft  = useCallback(() => {
    setLeftCollapsed((c) => {
      if (!c) prevLeftW.current = leftW
      return !c
    })
  }, [leftW])
  const toggleRight = useCallback(() => {
    setRightCollapsed((c) => {
      if (!c) prevRightW.current = rightW
      return !c
    })
  }, [rightW])

  // Load workflow data into editor stores when opening
  useEffect(() => {
    if (wf) {
      loadWorkflow({ nodes: wf.nodes, edges: wf.edges, workflowName: wf.name })
      varStore.setVariables(wf.variables ?? [])
    }
  }, [workflowId])

  const dragLeft  = useCallback((dx) => {
    if (leftCollapsed) return
    setLeftW((w) => Math.min(MAX_PANEL, Math.max(MIN_PANEL, w + dx)))
  }, [leftCollapsed])
  const dragRight = useCallback((dx) => {
    if (rightCollapsed) return
    setRightW((w) => Math.min(MAX_PANEL, Math.max(MIN_PANEL, w - dx)))
  }, [rightCollapsed])

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
        <TopBar workflowId={workflowId} isMobile />
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
          <WorkflowCanvas readOnly />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
      <TopBar workflowId={workflowId} />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel width={leftCollapsed ? 0 : leftW} collapsed={leftCollapsed} />
        <ResizeDivider onDrag={dragLeft} onCollapse={toggleLeft} collapsed={leftCollapsed} side="left" />
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
          <WorkflowCanvas />
        </main>
        <ResizeDivider onDrag={dragRight} onCollapse={toggleRight} collapsed={rightCollapsed} side="right" />
        <RightPanel width={rightCollapsed ? 0 : rightW} collapsed={rightCollapsed} />
      </div>
    </div>
  )
}

export default function App() {
  const appStore = useAppStore()
  const activeWorkflowId = appStore.activeWorkflowId
  const isMobile = useIsMobile()

  return activeWorkflowId
    ? <WorkflowEditor workflowId={activeWorkflowId} isMobile={isMobile} />
    : <CoverPage isMobile={isMobile} />
}
