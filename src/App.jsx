import { useEffect, useRef, useState, useCallback } from 'react'
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

function ResizeDivider({ onDrag }) {
  const dragging = useRef(false)

  const onMouseDown = useCallback((e) => {
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

  return (
    <div
      onMouseDown={onMouseDown}
      className="flex-shrink-0 flex items-center justify-center group"
      style={{ width: 5, cursor: 'col-resize', background: 'transparent', zIndex: 10 }}
    >
      <div
        className="w-px h-full group-hover:w-0.5 transition-all"
        style={{ background: '#e5e7eb' }}
      />
    </div>
  )
}

function WorkflowEditor({ workflowId }) {
  const appStore = useAppStore()
  const { loadWorkflow } = useWorkflowStore()
  const varStore = useVariableStore()
  const wf = appStore.workflows.find((w) => w.id === workflowId)

  const [leftW,  setLeftW]  = useState(240)
  const [rightW, setRightW] = useState(240)

  // Load workflow data into editor stores when opening
  useEffect(() => {
    if (wf) {
      loadWorkflow({ nodes: wf.nodes, edges: wf.edges, workflowName: wf.name })
      varStore.setVariables(wf.variables ?? [])
    }
  }, [workflowId])

  const dragLeft  = useCallback((dx) => setLeftW( (w) => Math.min(MAX_PANEL, Math.max(MIN_PANEL, w + dx))), [])
  const dragRight = useCallback((dx) => setRightW((w) => Math.min(MAX_PANEL, Math.max(MIN_PANEL, w - dx))), [])

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <TopBar workflowId={workflowId} />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel width={leftW} />
        <ResizeDivider onDrag={dragLeft} />
        <main className="flex-1 overflow-hidden bg-gray-50">
          <WorkflowCanvas />
        </main>
        <ResizeDivider onDrag={dragRight} />
        <RightPanel width={rightW} />
      </div>
    </div>
  )
}

export default function App() {
  const activeWorkflowId = useAppStore((s) => s.activeWorkflowId)
  return activeWorkflowId ? <WorkflowEditor workflowId={activeWorkflowId} /> : <CoverPage />
}
