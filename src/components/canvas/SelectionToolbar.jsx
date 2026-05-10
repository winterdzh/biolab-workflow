import { useState } from 'react'
import { Panel } from '@xyflow/react'
import { Layers } from 'lucide-react'
import useWorkflowStore from '../../stores/workflowStore'

export default function SelectionToolbar() {
  const { nodes, groupSelected } = useWorkflowStore()
  const [label, setLabel] = useState('')

  // Only count top-level, non-experiment, selected nodes
  const eligible = nodes.filter(
    (n) => n.selected && n.type !== 'experimentNode' && !n.parentId
  )

  if (eligible.length < 2) return null

  const handleGroup = () => {
    groupSelected(eligible.map((n) => n.id), label.trim() || 'Experiment')
    setLabel('')
  }

  return (
    <Panel position="top-center" style={{ zIndex: 10, marginTop: 8 }}>
      <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 shadow-md" style={{ borderRadius: 4 }}>
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
          {eligible.length} nodes selected
        </span>
        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGroup()}
          placeholder="Experiment name..."
          className="border border-gray-200 px-2.5 py-1 text-sm w-40 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
          style={{ borderRadius: 4 }}
        />
        <button
          onClick={handleGroup}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#CC0000] text-white text-sm hover:bg-red-800 font-medium transition-colors whitespace-nowrap"
          style={{ borderRadius: 4 }}
        >
          <Layers size={14} /> Group as Experiment
        </button>
      </div>
    </Panel>
  )
}
