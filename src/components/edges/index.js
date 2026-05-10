import SampleFlowEdge from './SampleFlowEdge'
import ReagentFlowEdge from './ReagentFlowEdge'
import LabwareFlowEdge from './LabwareFlowEdge'
import DataFlowEdge from './DataFlowEdge'
import WorkflowEdge from './WorkflowEdge'
import MaterialEdge from './MaterialEdge'
import LabwareEdge from './LabwareEdge'

const edgeTypes = {
  // ── Semantic flow edges (manual pick, op→op) ───────────────────────────
  sampleFlow:   SampleFlowEdge,
  reagentFlow:  ReagentFlowEdge,
  labwareFlow:  LabwareFlowEdge,
  dataFlow:     DataFlowEdge,
  // ── Structural edges (auto-assigned) ───────────────────────────────────
  workflowEdge: WorkflowEdge,   // default op→op flow
  materialEdge: MaterialEdge,   // material node ↔ operation (legacy)
  labwareEdge:  LabwareEdge,    // port-to-port labware connection
}

export default edgeTypes
