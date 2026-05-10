export const EDGE_TYPES = {
  WORKFLOW:      'workflowEdge',
  LABWARE_EDGE:  'labwareEdge',
  SAMPLE_FLOW:   'sampleFlow',
  REAGENT_FLOW:  'reagentFlow',
  LABWARE_FLOW:  'labwareFlow',
  DATA_FLOW:     'dataFlow',
}

export const EDGE_PALETTE = [
  { type: 'workflowEdge',  label: 'Workflow',       description: 'Default op→op control flow',    color: '#64748b', dashed: false },
  { type: 'sampleFlow',    label: 'Sample Flow',    description: 'Biological sample movement',     color: '#3b82f6', dashed: false },
  { type: 'reagentFlow',   label: 'Reagent Flow',   description: 'Reagent / buffer movement',      color: '#8b5cf6', dashed: false },
  { type: 'labwareFlow',   label: 'Labware Flow',   description: 'Empty container movement',       color: '#06b6d4', dashed: false },
  { type: 'dataFlow',      label: 'Data Flow',      description: 'Data / instruction transfer',    color: '#009688', dashed: true  },
]
