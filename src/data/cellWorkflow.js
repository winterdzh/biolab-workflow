// ─── Cell Processing Workflow ─────────────────────────────────────────────────
// Two parallel entry paths converge at Cell Seeding & Transfection:
//   Path A (Oligo): Peel sealed plates → Prepare Transfection System → Cell Seeding
//   Path B (Cell):  Thaw Cell → Passage → Expansion → QC → Count
//                   ├─ [branch] Cryopreservation → Store → End (Cell Bank)
//                   └─ Cell Seeding (parallel output from Passage)
// Downstream: Cell Culture (Assay) → [Imaging → End] + [Lysis → KingFisher RNA → Store → End]

const z   = { x: 0, y: 0 }
const dur = (v = '', u = 'hr') => ({ value: v, unit: u })

const mat  = (id, src, tgt, srcPort, tgtPort, portType, portLabel) => ({
  id, type: 'labwareEdge', source: src, target: tgt,
  sourceHandle: `out-${srcPort}`, targetHandle: `in-${tgtPort}`,
  data: { portType, portLabel: portLabel ?? tgtPort },
})
const itm  = (id, srcNode, itemId, tgtNode, tgtPortId, portType, portLabel) => ({
  id, type: 'labwareEdge', source: srcNode, target: tgtNode,
  sourceHandle: `out-${itemId}`, targetHandle: `in-${tgtPortId}`,
  data: { portType, portLabel },
})
const obj  = (id, srcNode, tgtNode, tgtPortId, portType, portLabel) => ({
  id, type: 'labwareEdge', source: srcNode, target: tgtNode,
  sourceHandle: 'mat-out', targetHandle: `in-${tgtPortId}`,
  data: { portType, portLabel },
})
const flow = (id, src, tgt) => ({
  id, type: 'workflowEdge', source: src, target: tgt,
  sourceHandle: 'flow-out', targetHandle: 'flow-in',
})

// ═══════════════════════════════════════════════════════════════════════════════
//  OBJECT NODES
// ═══════════════════════════════════════════════════════════════════════════════
const objectNodes = [

  // ── Cross-workflow input: sealed oligo plates from synthesis workflow ───────
  { id: 'obj-stored-oligos', type: 'sampleNode', position: z,
    data: { label: 'Sealed Oligo Plates (from Synthesis)', containerType: '384_well_plate' } },

  // ── Cell revival ────────────────────────────────────────────────────────────
  { id: 'obj-cryo-cells',  type: 'sampleNode',  position: z,
    data: { label: 'Cryopreserved Cells', containerType: 'cryo_tube' } },
  { id: 'obj-thaw-reag',   type: 'reagentNode', position: z,
    data: { label: 'Thaw Reagents',
            items: [{ id: 'th1', name: 'Cell Culture Medium' }, { id: 'th2', name: 'Liquid Nitrogen' }] } },
  { id: 'obj-cryo-tube-t', type: 'labwareNode', position: z,
    data: { label: 'Cryo Tubes', items: [{ id: 'ct1', name: 'Cryo Tubes' }] } },

  // ── Cell passage ────────────────────────────────────────────────────────────
  { id: 'obj-pass-reag',   type: 'reagentNode', position: z,
    data: { label: 'Passage Reagents',
            items: [
              { id: 'p1', name: 'DPBS' },
              { id: 'p2', name: 'TripLE' },
              { id: 'p3', name: 'Cell Culture Medium' },
            ] } },
  { id: 'obj-pass-cons',   type: 'labwareNode', position: z,
    data: { label: 'Passage Consumables',
            items: [{ id: 'pc1', name: 'AutoFlask' }, { id: 'pc2', name: 'Reservoir' }] } },

  // ── Cell count ─────────────────────────────────────────────────────────────
  { id: 'obj-trypan',      type: 'reagentNode', position: z,
    data: { label: 'Trypan Blue', items: [{ id: 'ty1', name: 'Trypan Blue' }] } },

  // ── Cryopreservation ───────────────────────────────────────────────────────
  { id: 'obj-cryo-reag',   type: 'reagentNode', position: z,
    data: { label: 'Cryopreservation Reagents',
            items: [
              { id: 'cr1', name: 'DMSO' },
              { id: 'cr2', name: 'FBS' },
              { id: 'cr3', name: 'Preservation Solution' },
            ] } },
  { id: 'obj-cryo-tube-c', type: 'labwareNode', position: z,
    data: { label: 'Cryo Tubes', items: [{ id: 'cc1', name: 'Cryo Tubes' }] } },
  { id: 'obj-ln2-tank',    type: 'labwareNode', position: z,
    data: { label: 'Liquid Nitrogen Tank',
            items: [{ id: 'lnt1', name: 'Liquid Nitrogen Tank' }] } },

  // ── Transfection prep ──────────────────────────────────────────────────────
  { id: 'obj-trans-reag',  type: 'reagentNode', position: z,
    data: { label: 'Transfection Reagents',
            items: [
              { id: 'tr1', name: 'Transfection Medium' },
              { id: 'tr2', name: 'Transfection Lipid Reagent' },
            ] } },
  { id: 'obj-trans-cons',  type: 'labwareNode', position: z,
    data: { label: 'Reservoir', items: [{ id: 'tco1', name: 'Reservoir' }] } },

  // ── Cell seeding ───────────────────────────────────────────────────────────
  { id: 'obj-seed-medium', type: 'reagentNode', position: z,
    data: { label: 'Cell Culture Medium',
            items: [{ id: 'sm1', name: 'Cell Culture Medium' }] } },
  { id: 'obj-seed-cons',   type: 'labwareNode', position: z,
    data: { label: 'Reservoir', items: [{ id: 'sco1', name: 'Reservoir' }] } },

  // ── Assay culture ──────────────────────────────────────────────────────────
  { id: 'obj-assay-medium',type: 'reagentNode', position: z,
    data: { label: 'Cell Culture Medium',
            items: [{ id: 'amd1', name: 'Cell Culture Medium' }] } },

  // ── Cell lysis ─────────────────────────────────────────────────────────────
  { id: 'obj-lysis-buf',   type: 'reagentNode', position: z,
    data: { label: 'Lysis Buffer',
            items: [{ id: 'lb1', name: 'Lysis Buffer in Reservoir' }] } },

  // ── RNA extraction (KingFisher) ────────────────────────────────────────────
  { id: 'obj-rna-kit',     type: 'reagentNode', position: z,
    data: { label: 'KingFisher RNA Kit & Elution Buffer',
            items: [
              { id: 'rk1', name: 'KingFisher RNA Purification Kit' },
              { id: 'rk2', name: 'Elution Buffer / Water' },
            ] } },
  { id: 'obj-deep-well',   type: 'labwareNode', position: z,
    data: { label: 'Deep Well Plates (96-well)',
            items: [{ id: 'dw1', name: 'Deep Well Plates (96-well)' }] } },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  OPERATION / CONTROL NODES
// ═══════════════════════════════════════════════════════════════════════════════
const workflowNodes = [

  // ── Path A: Oligo plates input ────────────────────────────────────────────
  { id: 'start-transfect', type: 'startNode', position: z,
    data: { label: 'Oligo Plates Input' } },

  { id: 'peel', type: 'operationNode', position: z,
    data: { label: 'Peel', device: { id: 'pealer', name: 'Pealer' },
      duration: dur('5', 'min'), description: 'Remove seal from stored oligo plates', notes: '',
      inputs: [], outputs: [
        { id: 'peeled-oligos', label: 'Oligos in 384-well Plate', type: 'sample' },
      ] } },

  { id: 'transfect-prep', type: 'operationNode', position: z,
    data: { label: 'Prepare Transfection System',
      device: { id: 'lh-transfect', name: 'Liquid Handler' },
      duration: dur(), description: 'Prepare transfection mix (lipoplex)', notes: '',
      inputs: [], outputs: [
        { id: 'lipoplex-out', label: 'Plates with Perturbagen', type: 'sample' },
      ] } },

  // ── Path B: Cell culture & expansion ─────────────────────────────────────
  { id: 'start-cell', type: 'startNode', position: z,
    data: { label: 'Cell Culture & Treatment' } },

  { id: 'thaw-cell', type: 'operationNode', position: z,
    data: { label: 'Thaw Cell',
      device: { id: 'thawstar', name: 'ThawSTAR & Cryovial Capper' },
      duration: dur(), description: 'Thaw cryopreserved cells', notes: '',
      inputs: [], outputs: [
        { id: 'thawed-cell', label: 'Cell in AutoFlask', type: 'sample' },
      ] } },

  { id: 'cell-passage', type: 'operationNode', position: z,
    data: { label: 'Cell Passage',
      device: { id: 'lh-centrifuge', name: 'Liquid Handler & Centrifuge' },
      duration: dur(), description: 'Enzymatic dissociation and replating', notes: '',
      inputs: [], outputs: [
        { id: 'cell-autoflask', label: 'Cell in AutoFlask', type: 'sample' },
        { id: 'cell-reservoir', label: 'Cell in Reservoir', type: 'sample' },
      ] } },

  { id: 'cell-culture-expand', type: 'operationNode', position: z,
    data: { label: 'Cell Culture (Expansion)',
      device: { id: 'cytomat-1', name: 'Cytomat' },
      duration: dur('3-5', 'day'), description: 'Expand cells in automated incubator', notes: '',
      inputs: [], outputs: [
        { id: 'cell-expanded', label: 'Cell in AutoFlask', type: 'sample' },
      ] } },

  { id: 'cell-imaging-qc', type: 'operationNode', position: z,
    data: { label: 'Cell Imaging (QC)',
      device: { id: 'cytation-qc', name: 'Cytation' },
      duration: dur(), description: 'Brightfield imaging — confluency check', notes: '',
      inputs: [], outputs: [
        { id: 'confluence-data',  label: 'Cell Confluence Data', type: 'info'   },
        { id: 'cell-img-qc-out',  label: 'Cell in AutoFlask',    type: 'sample' },
      ] } },

  { id: 'cell-count', type: 'operationNode', position: z,
    data: { label: 'Cell Count',
      device: { id: 'cellcounter', name: 'CellCounter' },
      duration: dur(), description: 'Count cells (Trypan blue exclusion)', notes: '',
      inputs: [], outputs: [
        { id: 'cell-qc-data', label: 'Cell QC Data',   type: 'info'   },
        { id: 'counted-cell', label: 'Cell (counted)', type: 'sample' },
      ] } },

  // ── Branch: Cryopreservation (parallel to seeding) ────────────────────────
  { id: 'cell-cryo', type: 'operationNode', position: z,
    data: { label: 'Cell Cryopreservation',
      device: { id: 'lh-cryo', name: 'Liquid Handler & Cryovial Capper' },
      duration: dur(), description: 'Cryopreserve surplus cells for banking', notes: '',
      inputs: [], outputs: [
        { id: 'cryo-cell-out', label: 'Cell in Cryo Tube', type: 'sample' },
      ] } },

  { id: 'store-cells', type: 'operationNode', position: z,
    data: { label: 'Store Cells',
      device: { id: 'freezer-80b', name: '-80°C Freezer' },
      duration: dur(), description: 'Long-term cryogenic storage', notes: '',
      inputs: [], outputs: [] } },

  { id: 'end-cryo', type: 'endNode', position: z,
    data: { label: 'End — Cell Bank' } },

  // ── Convergence: Transfection & Assay ─────────────────────────────────────
  { id: 'cell-seeding', type: 'operationNode', position: z,
    data: { label: 'Cell Seeding & Transfection',
      device: { id: 'lh-seeding', name: 'Liquid Handler' },
      duration: dur(), description: 'Seed cells and apply siRNA perturbagen', notes: '',
      inputs: [], outputs: [
        { id: 'cell-plates-out', label: 'Cell Plates', type: 'sample' },
      ] } },

  { id: 'cell-culture-assay', type: 'operationNode', position: z,
    data: { label: 'Cell Culture (Assay)',
      device: { id: 'cytomat-2', name: 'Cytomat' },
      duration: dur('3-5', 'day'),
      description: 'Incubate transfected cells for phenotype development', notes: '',
      inputs: [], outputs: [
        { id: 'assay-plates', label: 'Cell Plates (Assay Ready)', type: 'sample' },
      ] } },

  { id: 'cell-imaging-assay', type: 'operationNode', position: z,
    data: { label: 'Cell Imaging (Assay)',
      device: { id: 'cytation-assay', name: 'Cytation' },
      duration: dur(), description: 'High-content phenotypic imaging', notes: '',
      inputs: [], outputs: [
        { id: 'imaging-data', label: 'Imaging Data', type: 'info' },
      ] } },

  { id: 'cell-lysis', type: 'operationNode', position: z,
    data: { label: 'Cell Lysis',
      device: { id: 'lh-lysis', name: 'Liquid Handler' },
      duration: dur(), description: 'Lyse cells for RNA extraction', notes: '',
      inputs: [], outputs: [
        { id: 'cell-lysate', label: 'Cell Lysate', type: 'sample' },
      ] } },

  { id: 'rna-extract', type: 'operationNode', position: z,
    data: { label: 'RNA Extraction (KingFisher)',
      device: { id: 'kingfisher', name: 'KingFisher & Liquid Handler' },
      duration: dur(), description: 'Extract total RNA via magnetic bead kit', notes: '',
      inputs: [], outputs: [
        { id: 'total-rna', label: 'Total RNA', type: 'sample' },
      ] } },

  { id: 'store-rna', type: 'operationNode', position: z,
    data: { label: 'Store RNA',
      device: { id: 'freezer-80c', name: '-80°C Freezer' },
      duration: dur(), description: 'Store total RNA at -80°C', notes: '',
      inputs: [], outputs: [] } },

  { id: 'end-workflow', type: 'endNode', position: z,
    data: { label: 'End' } },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  EDGES
// ═══════════════════════════════════════════════════════════════════════════════
const edges = [

  // ── Path A: Oligo → Transfect → Seeding ───────────────────────────────────
  flow('f-st-pl',  'start-transfect', 'peel'),
  flow('f-pl-tp',  'peel',            'transfect-prep'),
  flow('f-tp-cs',  'transfect-prep',  'cell-seeding'),

  // ── Path B: Cell Culture ───────────────────────────────────────────────────
  flow('f-s2-tc',  'start-cell',          'thaw-cell'),
  flow('f-tc-cp',  'thaw-cell',           'cell-passage'),
  flow('f-cp-ce',  'cell-passage',        'cell-culture-expand'),
  flow('f-ce-iq',  'cell-culture-expand', 'cell-imaging-qc'),
  flow('f-iq-cc',  'cell-imaging-qc',     'cell-count'),
  flow('f-cc-cr',  'cell-count',          'cell-cryo'),
  flow('f-cr-sc',  'cell-cryo',           'store-cells'),
  flow('f-sc-ec',  'store-cells',         'end-cryo'),
  // Parallel branch: passage → seeding
  flow('f-cp-cs',  'cell-passage',        'cell-seeding'),

  // ── Downstream ────────────────────────────────────────────────────────────
  flow('f-cs-ca',  'cell-seeding',        'cell-culture-assay'),
  flow('f-ca-ci',  'cell-culture-assay',  'cell-imaging-assay'),
  flow('f-ca-cl',  'cell-culture-assay',  'cell-lysis'),
  flow('f-cl-re',  'cell-lysis',          'rna-extract'),
  flow('f-re-sr',  'rna-extract',         'store-rna'),
  flow('f-sr-end', 'store-rna',           'end-workflow'),
  flow('f-ci-end', 'cell-imaging-assay',  'end-workflow'),

  // ── peel inputs ────────────────────────────────────────────────────────────
  obj('oe-pl-so',  'obj-stored-oligos', 'peel', 'pl-so', 'sample', 'Sealed Oligo Plates'),

  // ── transfect-prep inputs ──────────────────────────────────────────────────
  mat('m-pl-tp',   'peel',            'transfect-prep', 'peeled-oligos', 'tp-ol', 'sample',  'Oligos in 384-well Plate'),
  itm('oe-tp-tr1', 'obj-trans-reag',  'tr1',  'transfect-prep', 'tp-tr1', 'reagent', 'Transfection Medium'),
  itm('oe-tp-tr2', 'obj-trans-reag',  'tr2',  'transfect-prep', 'tp-tr2', 'reagent', 'Transfection Lipid Reagent'),
  itm('oe-tp-tc1', 'obj-trans-cons',  'tco1', 'transfect-prep', 'tp-tc1', 'labware', 'Reservoir'),

  // ── thaw-cell inputs ───────────────────────────────────────────────────────
  obj('oe-tc-cc',  'obj-cryo-cells',   'thaw-cell', 'tc-cc',  'sample',  'Cryopreserved Cells'),
  itm('oe-tc-th1', 'obj-thaw-reag',    'th1', 'thaw-cell', 'tc-th1', 'reagent', 'Cell Culture Medium'),
  itm('oe-tc-th2', 'obj-thaw-reag',    'th2', 'thaw-cell', 'tc-th2', 'reagent', 'Liquid Nitrogen'),
  itm('oe-tc-ct1', 'obj-cryo-tube-t',  'ct1', 'thaw-cell', 'tc-ct1', 'labware', 'Cryo Tubes'),

  // ── cell-passage inputs ────────────────────────────────────────────────────
  mat('m-tc-cp',   'thaw-cell',     'cell-passage', 'thawed-cell', 'cp-tc', 'sample', 'Cell in AutoFlask'),
  itm('oe-cp-p1',  'obj-pass-reag', 'p1',  'cell-passage', 'cp-p1',  'reagent', 'DPBS'),
  itm('oe-cp-p2',  'obj-pass-reag', 'p2',  'cell-passage', 'cp-p2',  'reagent', 'TripLE'),
  itm('oe-cp-p3',  'obj-pass-reag', 'p3',  'cell-passage', 'cp-p3',  'reagent', 'Cell Culture Medium'),
  itm('oe-cp-pc1', 'obj-pass-cons', 'pc1', 'cell-passage', 'cp-pc1', 'labware', 'AutoFlask'),
  itm('oe-cp-pc2', 'obj-pass-cons', 'pc2', 'cell-passage', 'cp-pc2', 'labware', 'Reservoir'),

  // ── expand → imaging-qc → count ───────────────────────────────────────────
  mat('m-cp-ce',   'cell-passage',        'cell-culture-expand', 'cell-autoflask',  'ce-fl', 'sample', 'Cell in AutoFlask'),
  mat('m-ce-iq',   'cell-culture-expand', 'cell-imaging-qc',     'cell-expanded',   'iq-ce', 'sample', 'Cell in AutoFlask'),
  mat('m-iq-cc',   'cell-imaging-qc',     'cell-count',          'cell-img-qc-out', 'cc-iq', 'sample', 'Cell in AutoFlask'),
  itm('oe-cc-ty1', 'obj-trypan',          'ty1', 'cell-count', 'cc-ty1', 'reagent', 'Trypan Blue'),

  // ── cell-cryo inputs ──────────────────────────────────────────────────────
  mat('m-cc-cr',   'cell-count',     'cell-cryo', 'counted-cell', 'cr-cc',  'sample', 'Cell (counted)'),
  itm('oe-cr-cr1', 'obj-cryo-reag',  'cr1', 'cell-cryo', 'cr-cr1', 'reagent', 'DMSO'),
  itm('oe-cr-cr2', 'obj-cryo-reag',  'cr2', 'cell-cryo', 'cr-cr2', 'reagent', 'FBS'),
  itm('oe-cr-cr3', 'obj-cryo-reag',  'cr3', 'cell-cryo', 'cr-cr3', 'reagent', 'Preservation Solution'),
  itm('oe-cr-cc1', 'obj-cryo-tube-c','cc1', 'cell-cryo', 'cr-cc1', 'labware', 'Cryo Tubes'),

  // ── store-cells inputs ─────────────────────────────────────────────────────
  mat('m-cr-sc',    'cell-cryo',   'store-cells', 'cryo-cell-out', 'sc-cv',   'sample',  'Cell in Cryo Tube'),
  itm('oe-sc-lnt1', 'obj-ln2-tank','lnt1', 'store-cells', 'sc-lnt1', 'labware', 'Liquid Nitrogen Tank'),

  // ── cell-seeding inputs ────────────────────────────────────────────────────
  mat('m-tp-cs',   'transfect-prep', 'cell-seeding', 'lipoplex-out',   'cs-lp', 'sample', 'Plates with Perturbagen'),
  mat('m-cp-cs',   'cell-passage',   'cell-seeding', 'cell-reservoir', 'cs-re', 'sample', 'Cell in Reservoir'),
  itm('oe-cs-sm1', 'obj-seed-medium','sm1',  'cell-seeding', 'cs-sm1', 'reagent', 'Cell Culture Medium'),
  itm('oe-cs-sc1', 'obj-seed-cons',  'sco1', 'cell-seeding', 'cs-sc1', 'labware', 'Reservoir'),

  // ── cell-culture-assay inputs ──────────────────────────────────────────────
  mat('m-cs-ca',   'cell-seeding',     'cell-culture-assay', 'cell-plates-out', 'ca-pl',  'sample',  'Cell Plates'),
  itm('oe-ca-am1', 'obj-assay-medium', 'amd1', 'cell-culture-assay', 'ca-am1', 'reagent', 'Cell Culture Medium'),

  // ── cell-imaging-assay inputs ──────────────────────────────────────────────
  mat('m-ca-ci',   'cell-culture-assay', 'cell-imaging-assay', 'assay-plates', 'ci-pl', 'sample', 'Cell Plates (Assay Ready)'),

  // ── cell-lysis inputs ──────────────────────────────────────────────────────
  mat('m-ca-cl',   'cell-culture-assay', 'cell-lysis', 'assay-plates', 'cl-pl', 'sample',  'Cell Plates (Assay Ready)'),
  itm('oe-cl-lb1', 'obj-lysis-buf',      'lb1', 'cell-lysis', 'cl-lb1', 'reagent', 'Lysis Buffer in Reservoir'),

  // ── rna-extract inputs ────────────────────────────────────────────────────
  mat('m-cl-re',   'cell-lysis',    'rna-extract', 'cell-lysate', 're-ly',  'sample',  'Cell Lysate'),
  itm('oe-re-rk1', 'obj-rna-kit',   'rk1', 'rna-extract', 're-rk1', 'reagent', 'KingFisher RNA Purification Kit'),
  itm('oe-re-rk2', 'obj-rna-kit',   'rk2', 'rna-extract', 're-rk2', 'reagent', 'Elution Buffer / Water'),
  itm('oe-re-dw1', 'obj-deep-well', 'dw1', 'rna-extract', 're-dw1', 'labware', 'Deep Well Plates (96-well)'),

  // ── store-rna inputs ──────────────────────────────────────────────────────
  mat('m-re-sr',   'rna-extract',  'store-rna', 'total-rna', 'sr-rn', 'sample', 'Total RNA'),
]

// ═══════════════════════════════════════════════════════════════════════════════
export const CELL_WORKFLOW = {
  id:          'bioyong-cell-processing',
  name:        'Cell Processing',
  description: 'Takes sealed oligo plates from synthesis + cryopreserved cells as inputs.\n' +
               'Steps: cell revival → passage → expansion → confluency QC → count → ' +
               'cryopreservation (bank branch) + transfection prep → cell seeding & transfection → ' +
               'assay culture → high-content imaging + cell lysis → KingFisher RNA extraction → store.',
  createdAt:   '2025-06-01T00:00:00.000Z',
  modifiedAt:  '2025-06-01T00:00:00.000Z',
  nodes:       [...objectNodes, ...workflowNodes],
  edges,
  variables:   [],
  tags:        ['cell', 'transfection', 'rna', 'kingfisher', 'bioyong'],
}
