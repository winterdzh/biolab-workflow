// Demo Workflow: siRNA cherry-pick and cell-based assay readout pipeline (384-well)

const z = { x: 0, y: 0 }
const dur = (value = '', unit = 'min') => ({ value, unit })

const flow = (id, source, target) => ({
  id,
  type: 'workflowEdge',
  source,
  target,
  sourceHandle: 'flow-out',
  targetHandle: 'flow-in',
})

const obj = (id, source, target, targetHandle, portType, portLabel) => ({
  id,
  type: 'labwareEdge',
  source,
  target,
  sourceHandle: 'mat-out',
  targetHandle: `in-${targetHandle}`,
  data: { portType, portLabel },
})

const itm = (id, source, itemId, target, targetHandle, portType, portLabel) => ({
  id,
  type: 'labwareEdge',
  source,
  target,
  sourceHandle: `out-${itemId}`,
  targetHandle: `in-${targetHandle}`,
  data: { portType, portLabel },
})

const mat = (id, source, target, outputId, targetHandle, portType, portLabel) => ({
  id,
  type: 'labwareEdge',
  source,
  target,
  sourceHandle: `out-${outputId}`,
  targetHandle: `in-${targetHandle}`,
  data: { portType, portLabel },
})

const objectNodes = [
  {
    id: 'obj-cherry-pick-file',
    type: 'dataNode',
    position: z,
    data: {
      label: 'Cherry Pick File',
      files: [{ id: 'cpf1', name: 'CherryPick_384.csv' }],
      kvPairs: [{ id: 'cpk1', key: 'format', value: '384-well' }],
    },
  },
  {
    id: 'obj-sirna-source',
    type: 'sampleNode',
    position: z,
    data: { label: 'siRNA Source Plate', containerType: 'well_384' },
  },
  {
    id: 'obj-cells',
    type: 'sampleNode',
    position: z,
    data: { label: 'Cell Suspension', containerType: 'reservoir' },
  },
  {
    id: 'obj-transfection-reag',
    type: 'reagentNode',
    position: z,
    data: {
      label: 'Transfection Reagents',
      items: [
        { id: 'tr1', name: 'Transfection Reagent' },
        { id: 'tr2', name: 'Opti-MEM' },
      ],
    },
  },
  {
    id: 'obj-culture-reag',
    type: 'reagentNode',
    position: z,
    data: {
      label: 'Culture Reagents',
      items: [
        { id: 'cr1', name: 'Complete Medium' },
        { id: 'cr2', name: 'PBS' },
      ],
    },
  },
  {
    id: 'obj-htrf-reag',
    type: 'reagentNode',
    position: z,
    data: {
      label: 'HTRF Reagents',
      items: [
        { id: 'hr1', name: 'HTRF Lysis Buffer' },
        { id: 'hr2', name: 'HTRF Detection Mix' },
      ],
    },
  },
  {
    id: 'obj-consumables',
    type: 'labwareNode',
    position: z,
    data: {
      label: 'Consumables',
      items: [
        { id: 'co1', name: '384-well Assay Plate' },
        { id: 'co2', name: 'Reservoir' },
        { id: 'co3', name: 'Filter Tips' },
      ],
    },
  },
]

const workflowNodes = [
  { id: 'start-demo', type: 'startNode', position: z, data: { label: 'Start — Demo Assay' } },
  {
    id: 'echo-cherry-pick',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Echo Cherry Pick siRNA',
      device: { id: 'echo-525', name: 'Echo 525' },
      duration: dur('20', 'min'),
      description: 'Cherry-pick siRNA according to file and dispense to 384 assay plate.',
      notes: '',
      inputs: [],
      outputs: [
        { id: 'sirna-picked-plate', label: 'siRNA Picked 384 Plate', type: 'sample' },
        { id: 'pick-log', label: 'Cherry Pick Log', type: 'info' },
      ],
    },
  },
  {
    id: 'fluent-seeding',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Fluent1080 Cell Culture & Seeding',
      device: { id: 'fluent-1080', name: 'Fluent 1080' },
      duration: dur('45', 'min'),
      description: 'Seed cells and prepare transfection mix in 384 format.',
      notes: '',
      inputs: [],
      outputs: [{ id: 'seeded-transfected-plate', label: 'Seeded/Transfected 384 Plate', type: 'sample' }],
    },
  },
  {
    id: 'fluent-treatment',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Fluent1080 Cell Treatment',
      device: { id: 'fluent-1080-b', name: 'Fluent 1080' },
      duration: dur('30', 'min'),
      description: 'Apply treatment workflow using medium and PBS handling in 384 plates.',
      notes: '',
      inputs: [],
      outputs: [{ id: 'treated-plate', label: 'Treated 384 Plate', type: 'sample' }],
    },
  },
  {
    id: 'cytation-imaging',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Cytation Imaging',
      device: { id: 'cytation', name: 'Cytation Imaging Reader' },
      duration: dur('25', 'min'),
      description: 'Acquire plate images for morphology and confluency readout.',
      notes: '',
      inputs: [],
      outputs: [
        { id: 'imaged-plate', label: 'Imaged 384 Plate', type: 'sample' },
        { id: 'image-report', label: 'Image Report', type: 'info' },
      ],
    },
  },
  {
    id: 'cytomat-overnight',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Overnight Incubation',
      device: { id: 'cytomat-2c4', name: 'Cytomat 2 C4' },
      duration: dur('16', 'hr'),
      description: 'Overnight incubation before endpoint lysis/readout.',
      notes: '',
      inputs: [],
      outputs: [{ id: 'overnight-plate', label: 'Overnight Incubated Plate', type: 'sample' }],
    },
  },
  {
    id: 'lysis-htrf',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Cell Lysis + HTRF Reagent',
      device: { id: 'fluent-1080-c', name: 'Fluent 1080' },
      duration: dur('35', 'min'),
      description: 'Lyse cells and add HTRF reagents to assay plates.',
      notes: '',
      inputs: [],
      outputs: [{ id: 'htrf-ready-plate', label: 'HTRF-Ready Plate', type: 'sample' }],
    },
  },
  {
    id: 'envision-read',
    type: 'operationNode',
    position: z,
    data: {
      label: 'Envision Plate Read',
      device: { id: 'envision-reader', name: 'EnVision Plate Reader' },
      duration: dur('20', 'min'),
      description: 'Read HTRF signal on EnVision and export endpoint data.',
      notes: '',
      inputs: [],
      outputs: [{ id: 'htrf-signal', label: 'HTRF Signal Data', type: 'info' }],
    },
  },
  { id: 'end-demo', type: 'endNode', position: z, data: { label: 'End — Demo Completed' } },
]

const edges = [
  flow('f-start-echo', 'start-demo', 'echo-cherry-pick'),
  flow('f-echo-seed', 'echo-cherry-pick', 'fluent-seeding'),
  flow('f-seed-treat', 'fluent-seeding', 'fluent-treatment'),
  flow('f-treat-img', 'fluent-treatment', 'cytation-imaging'),
  flow('f-img-inc', 'cytation-imaging', 'cytomat-overnight'),
  flow('f-inc-lysis', 'cytomat-overnight', 'lysis-htrf'),
  flow('f-lysis-read', 'lysis-htrf', 'envision-read'),
  flow('f-read-end', 'envision-read', 'end-demo'),

  itm('e-cp-file', 'obj-cherry-pick-file', 'cpf1', 'echo-cherry-pick', 'cp-file', 'info', 'CherryPick_384.csv'),
  obj('e-sirna-src', 'obj-sirna-source', 'echo-cherry-pick', 'sirna-src', 'sample', 'siRNA Source Plate'),
  itm('e-plate-echo', 'obj-consumables', 'co1', 'echo-cherry-pick', 'echo-plate', 'labware', '384-well Assay Plate'),

  mat('m-echo-seed', 'echo-cherry-pick', 'fluent-seeding', 'sirna-picked-plate', 'seed-in', 'sample', 'siRNA Picked 384 Plate'),
  obj('e-cells-seed', 'obj-cells', 'fluent-seeding', 'cells', 'sample', 'Cell Suspension'),
  itm('e-tr1-seed', 'obj-transfection-reag', 'tr1', 'fluent-seeding', 'tr1', 'reagent', 'Transfection Reagent'),
  itm('e-tr2-seed', 'obj-transfection-reag', 'tr2', 'fluent-seeding', 'tr2', 'reagent', 'Opti-MEM'),
  itm('e-cr1-seed', 'obj-culture-reag', 'cr1', 'fluent-seeding', 'cr1', 'reagent', 'Complete Medium'),
  itm('e-co2-seed', 'obj-consumables', 'co2', 'fluent-seeding', 'co2', 'labware', 'Reservoir'),
  itm('e-co3-seed', 'obj-consumables', 'co3', 'fluent-seeding', 'co3', 'labware', 'Filter Tips'),

  mat('m-seed-treat', 'fluent-seeding', 'fluent-treatment', 'seeded-transfected-plate', 'treat-in', 'sample', 'Seeded/Transfected 384 Plate'),
  itm('e-cr2-treat', 'obj-culture-reag', 'cr2', 'fluent-treatment', 'cr2', 'reagent', 'PBS'),
  itm('e-cr1-treat', 'obj-culture-reag', 'cr1', 'fluent-treatment', 'cr1', 'reagent', 'Complete Medium'),

  mat('m-treat-img', 'fluent-treatment', 'cytation-imaging', 'treated-plate', 'img-in', 'sample', 'Treated 384 Plate'),
  mat('m-img-inc', 'cytation-imaging', 'cytomat-overnight', 'imaged-plate', 'inc-in', 'sample', 'Imaged 384 Plate'),

  mat('m-inc-lysis', 'cytomat-overnight', 'lysis-htrf', 'overnight-plate', 'lysis-in', 'sample', 'Overnight Incubated Plate'),
  itm('e-hr1-lysis', 'obj-htrf-reag', 'hr1', 'lysis-htrf', 'hr1', 'reagent', 'HTRF Lysis Buffer'),
  itm('e-hr2-lysis', 'obj-htrf-reag', 'hr2', 'lysis-htrf', 'hr2', 'reagent', 'HTRF Detection Mix'),

  mat('m-lysis-read', 'lysis-htrf', 'envision-read', 'htrf-ready-plate', 'read-in', 'sample', 'HTRF-Ready Plate'),
]

export const DEMO_WORKFLOW = {
  id: 'demo-sirna-echo-fluent-htrf',
  name: 'Demo — siRNA Echo to HTRF Readout',
  description:
    'Demo workflow: Echo cherry-pick based on file, Fluent 1080 cell culture/treatment in 384-well, Cytation imaging, Cytomat 2 C4 overnight incubation, cell lysis + HTRF, and EnVision plate readout.',
  createdAt: '2026-05-10T00:00:00.000Z',
  modifiedAt: '2026-05-10T00:00:00.000Z',
  nodes: [...objectNodes, ...workflowNodes],
  edges,
  variables: [],
  tags: ['demo', 'sirna', 'echo', 'fluent', 'htrf'],
}
