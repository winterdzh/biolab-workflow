// ─── Bioyong Island #1 — siRNA HTS Workflow ──────────────────────────────────
// Inputs to operations come exclusively from connected Objects nodes
// (sampleNode / reagentNode / labwareNode / dataNode) or from other
// operations' output ports.  Operation nodes define only outputs.

const z = { x: 0, y: 0 }
const dur = (v = '', u = 'hr') => ({ value: v, unit: u })

// ── Edge helpers ──────────────────────────────────────────────────────────────
// op-to-op material edge; portLabel = label shown on the target operation input
const mat = (id, src, tgt, srcPort, tgtPort, portType, portLabel) => ({
  id, type: 'labwareEdge',
  source: src, target: tgt,
  sourceHandle: `out-${srcPort}`, targetHandle: `in-${tgtPort}`,
  data: { portType, portLabel: portLabel ?? tgtPort },
})
// per-item edge from reagentNode/labwareNode (out-<itemId> handle)
const itm = (id, srcNode, itemId, tgtNode, tgtPortId, portType, portLabel) => ({
  id, type: 'labwareEdge',
  source: srcNode, target: tgtNode,
  sourceHandle: `out-${itemId}`, targetHandle: `in-${tgtPortId}`,
  data: { portType, portLabel },
})
// sampleNode / dataNode → operation material edge (single mat-out handle)
const obj = (id, srcNode, tgtNode, tgtPortId, portType, portLabel) => ({
  id, type: 'labwareEdge',
  source: srcNode, target: tgtNode,
  sourceHandle: 'mat-out', targetHandle: `in-${tgtPortId}`,
  data: { portType, portLabel },
})
// workflow flow edge
const flow = (id, src, tgt) => ({
  id, type: 'workflowEdge',
  source: src, target: tgt,
  sourceHandle: 'flow-out', targetHandle: 'flow-in',
})

// ═══════════════════════════════════════════════════════════════════════════════
//  OBJECTS NODES  (raw material sources — no workflow flow handles)
// ═══════════════════════════════════════════════════════════════════════════════
const objectNodes = [

  // ── Assay Design data inputs ──────────────────────────────────────────────
  { id: 'obj-plate-map',   type: 'dataNode',        position: z,
    data: { label: 'Plate Map' } },
  { id: 'obj-oligo-seq',   type: 'dataNode',        position: z,
    data: { label: 'Oligo Sequences' } },

  // ── Oligo Synthesis raw materials ─────────────────────────────────────────
  { id: 'obj-synth-board', type: 'labwareNode',  position: z,
    data: { label: 'Solid Phase Synthesis Board', items: [{ id: 'sb1', name: 'Solid Phase Synthesis Board' }] } },
  { id: 'obj-synth-reag',  type: 'reagentNode',     position: z,
    data: { label: 'Synthesis Reagents',
            items: [
              { id: 'r1', name: 'dA/T/C/G/U' },
              { id: 'r2', name: 'Activator' },
              { id: 'r3', name: 'Cap A/B' },
              { id: 'r4', name: 'Oxidation Solution' },
              { id: 'r5', name: 'Detritylation Solution' },
              { id: 'r6', name: "5'-Phosphate Phosphoramidite" },
              { id: 'r7', name: 'Nitrogen Gas' },
            ] } },

  // ── Ammonolysis reagents ───────────────────────────────────────────────────
  { id: 'obj-ammo-reag',   type: 'reagentNode',     position: z,
    data: { label: 'Ammonolysis Reagents',
            items: [{ id: 'a1', name: 'Ammonia Water' }, { id: 'a2', name: 'Water' }] } },

  // ── Elution / Purification ─────────────────────────────────────────────────
  { id: 'obj-elut-reag',   type: 'reagentNode',     position: z,
    data: { label: 'Purification Reagents',
            items: [
              { id: 'e1', name: 'Elution Buffer / Water' },
              { id: 'e2', name: 'ACN' },
              { id: 'e3', name: 'Acrylonitrile Scavenger (ANC)' },
              { id: 'e4', name: 'Formic Acid' },
            ] } },
  { id: 'obj-hplc-col',    type: 'labwareNode',  position: z,
    data: { label: 'HPLC Column', items: [{ id: 'hc1', name: 'HPLC Column' }] } },

  // ── QC Transfer plates ────────────────────────────────────────────────────
  { id: 'obj-qc-plates',   type: 'labwareNode',  position: z,
    data: { label: 'Lunatic & LC-MS Plates',
            items: [{ id: 'q1', name: 'Lunatic Plate 96-format ×4' }, { id: 'q2', name: 'LC-MS Plate 96-well' }] } },

  // ── LC-MS reagents & consumables ──────────────────────────────────────────
  { id: 'obj-lcms-reag',   type: 'reagentNode',     position: z,
    data: { label: 'LC-MS Reagents',
            items: [{ id: 'l1', name: 'Formic Acid' }, { id: 'l2', name: 'ACN' }, { id: 'l3', name: 'Nitrogen Gas' }] } },
  { id: 'obj-lcms-cons',   type: 'labwareNode',  position: z,
    data: { label: 'LC-MS Consumables',
            items: [{ id: 'lc1', name: 'Lunatics' }, { id: 'lc2', name: 'HPLC Column' }] } },

  // ── Normalization ─────────────────────────────────────────────────────────
  { id: 'obj-norm-water',  type: 'reagentNode',     position: z,
    data: { label: 'Water', items: [{ id: 'w1', name: 'Water' }] } },

  // ── I.Dot S source plates ─────────────────────────────────────────────────
  { id: 'obj-idots-plt',   type: 'labwareNode',  position: z,
    data: { label: 'I.Dot S Source Plates (96-well ×4)', items: [{ id: 'ip1', name: 'I.Dot S Source Plates (96-well ×4)' }] } },

  // ── Aliquot randomization ─────────────────────────────────────────────────
  { id: 'obj-rand-seeds',  type: 'dataNode',        position: z,
    data: { label: 'Random Seeds / Layout' } },
  { id: 'obj-assay-plt',   type: 'labwareNode',  position: z,
    data: { label: 'Cell Culture Plates (96 or 384-well)', items: [{ id: 'ap1', name: 'Cell Culture Plates' }] } },

  // ── Thaw cell materials ───────────────────────────────────────────────────
  { id: 'obj-cryo-cells',  type: 'sampleNode',      position: z,
    data: { label: 'Cryopreserved Cells', containerType: 'cryo_tube' } },
  { id: 'obj-thaw-reag',   type: 'reagentNode',     position: z,
    data: { label: 'Thaw Reagents',
            items: [{ id: 'th1', name: 'Cell Culture Medium' }, { id: 'th2', name: 'Liquid Nitrogen' }] } },
  { id: 'obj-cryo-tube-t', type: 'labwareNode',  position: z,
    data: { label: 'Cryo Tubes', items: [{ id: 'ct1', name: 'Cryo Tubes' }] } },

  // ── Cell passage reagents ─────────────────────────────────────────────────
  { id: 'obj-pass-reag',   type: 'reagentNode',     position: z,
    data: { label: 'Passage Reagents',
            items: [{ id: 'p1', name: 'DPBS' }, { id: 'p2', name: 'TripLE' }, { id: 'p3', name: 'Cell Culture Medium' }] } },
  { id: 'obj-pass-cons',   type: 'labwareNode',  position: z,
    data: { label: 'Passage Consumables',
            items: [{ id: 'pc1', name: 'AutoFlask' }, { id: 'pc2', name: 'Reservoir' }] } },

  // ── Cell count ────────────────────────────────────────────────────────────
  { id: 'obj-trypan',      type: 'reagentNode',     position: z,
    data: { label: 'Trypan Blue', items: [{ id: 'ty1', name: 'Trypan Blue' }] } },

  // ── Cell cryopreservation ─────────────────────────────────────────────────
  { id: 'obj-cryo-reag',   type: 'reagentNode',     position: z,
    data: { label: 'Cryopreservation Reagents',
            items: [{ id: 'cr1', name: 'DMSO' }, { id: 'cr2', name: 'FBS' }, { id: 'cr3', name: 'Preservation Solution' }] } },
  { id: 'obj-cryo-tube-c', type: 'labwareNode',  position: z,
    data: { label: 'Cryo Tubes', items: [{ id: 'cc1', name: 'Cryo Tubes' }] } },

  // ── Cell storage ──────────────────────────────────────────────────────────
  { id: 'obj-ln2-tank',    type: 'labwareNode',  position: z,
    data: { label: 'Liquid Nitrogen Tank', items: [{ id: 'lnt1', name: 'Liquid Nitrogen Tank' }] } },

  // ── Transfection prep ─────────────────────────────────────────────────────
  { id: 'obj-trans-reag',  type: 'reagentNode',     position: z,
    data: { label: 'Transfection Reagents',
            items: [{ id: 'tr1', name: 'Transfection Medium' }, { id: 'tr2', name: 'Transfection Lipid Reagent' }] } },
  { id: 'obj-trans-cons',  type: 'labwareNode',  position: z,
    data: { label: 'Reservoir', items: [{ id: 'tco1', name: 'Reservoir' }] } },

  // ── Cell seeding ──────────────────────────────────────────────────────────
  { id: 'obj-seed-medium', type: 'reagentNode',     position: z,
    data: { label: 'Cell Culture Medium', items: [{ id: 'sm1', name: 'Cell Culture Medium' }] } },
  { id: 'obj-seed-cons',   type: 'labwareNode',  position: z,
    data: { label: 'Reservoir', items: [{ id: 'sco1', name: 'Reservoir' }] } },

  // ── Cell culture (assay) ──────────────────────────────────────────────────
  { id: 'obj-assay-medium',type: 'reagentNode',     position: z,
    data: { label: 'Cell Culture Medium', items: [{ id: 'amd1', name: 'Cell Culture Medium' }] } },

  // ── Cell lysis ────────────────────────────────────────────────────────────
  { id: 'obj-lysis-buf',   type: 'reagentNode',     position: z,
    data: { label: 'Lysis Buffer',
            items: [{ id: 'lb1', name: 'Lysis Buffer in Reservoir' }] } },

  // ── RNA extraction ────────────────────────────────────────────────────────
  { id: 'obj-rna-kit',     type: 'reagentNode',     position: z,
    data: { label: 'KingFisher RNA Kit & Elution Buffer',
            items: [{ id: 'rk1', name: 'KingFisher RNA Purification Kit' }, { id: 'rk2', name: 'Elution Buffer / Water' }] } },
  { id: 'obj-deep-well',   type: 'labwareNode',  position: z,
    data: { label: 'Deep Well Plates (96-well)', items: [{ id: 'dw1', name: 'Deep Well Plates (96-well)' }] } },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  OPERATION / CONTROL NODES
// ═══════════════════════════════════════════════════════════════════════════════
const workflowNodes = [

  // ── Island A: Oligo Synthesis ─────────────────────────────────────────────
  { id: 'start-oligo', type: 'startNode', position: z,
    data: { label: 'Oligo Synthesis Process' } },

  { id: 'assay-design', type: 'operationNode', position: z,
    data: {
      label: 'Assay Design', device: null, duration: dur(),
      description: 'Design oligo sequences and assay matrix', notes: '',
      inputs: [], outputs: [
        { id: 'matrix', label: 'Designed Matrix', type: 'info' },
      ],
    },
  },
  { id: 'oligo-synth', type: 'operationNode', position: z,
    data: {
      label: 'Oligo Synthesis',
      device: { id: 'shasta-768', name: 'Oligo Synthesizer Shasta 768' },
      duration: dur(), description: 'Solid-phase oligonucleotide synthesis', notes: '',
      inputs: [], outputs: [
        { id: 'board-sample', label: 'Board with Sample',   type: 'sample' },
        { id: 'synth-report', label: 'Synthesis Report',    type: 'info'   },
      ],
    },
  },
  { id: 'ammonolysis', type: 'operationNode', position: z,
    data: {
      label: 'Ammonolysis (C&D)',
      device: { id: 'ammonolysis-sys', name: 'Ammonolysis System' },
      duration: dur(), description: 'Cleavage & Deprotection', notes: '',
      inputs: [], outputs: [
        { id: 'crude-oligo', label: 'Crude Oligonucleotide (384-well)', type: 'sample' },
      ],
    },
  },
  { id: 'elution', type: 'operationNode', position: z,
    data: {
      label: 'Elution / Purification',
      device: { id: 'tecan-fluent', name: 'Tecan Fluent' },
      duration: dur(), description: 'Purification elution of crude oligonucleotides', notes: '',
      inputs: [], outputs: [
        { id: 'purified-oligos', label: 'Purified Oligos (384-well)', type: 'sample' },
        { id: 'solid-waste',     label: 'Solid Waste',                type: 'labware' },
      ],
    },
  },
  { id: 'sample-xfer-qc', type: 'operationNode', position: z,
    data: {
      label: 'Sample Transfer (QC)',
      device: { id: 'tecan-fluent-qc', name: 'TecanFluent' },
      duration: dur(), description: 'Transfer to Lunatic and LC-MS plates for QC', notes: '',
      inputs: [], outputs: [
        { id: 'lunatic-loaded', label: 'Lunatic Plate (loaded)',  type: 'sample' },
        { id: 'lcms-loaded',    label: 'LC-MS Plate (loaded)',   type: 'sample' },
      ],
    },
  },
  { id: 'lc-ms', type: 'operationNode', position: z,
    data: {
      label: 'LC-MS QC',
      device: { id: 'vanquish', name: 'Vanquish' },
      duration: dur(), description: 'QC: concentration and purity by LC-MS', notes: '',
      inputs: [], outputs: [
        { id: 'qc-report', label: 'QC Report (conc. / purity)', type: 'info' },
      ],
    },
  },
  { id: 'normalization', type: 'operationNode', position: z,
    data: {
      label: 'Normalization',
      device: { id: 'idots', name: 'I.Dot S' },
      duration: dur(), description: 'Normalize oligos to target concentration', notes: '',
      inputs: [], outputs: [
        { id: 'sense-oligos',     label: 'Normalized Sense Oligos (384-well)',     type: 'sample' },
        { id: 'antisense-oligos', label: 'Normalized Antisense Oligos (384-well)', type: 'sample' },
        { id: 'sample-layout',    label: 'Sample Info & Layout',                   type: 'info'   },
      ],
    },
  },
  { id: 'combine-dsrna', type: 'operationNode', position: z,
    data: {
      label: 'Combine dsRNA',
      device: { id: 'tecan-fluent-2', name: 'TecanFluent' },
      duration: dur(), description: 'Hybridize sense and antisense strands to form dsRNA',
      notes: '384-well format ×2, 50 nM, 100 µL',
      inputs: [], outputs: [
        { id: 'dsrna-plate',  label: 'dsRNA/DNA in 384-well Plate', type: 'sample' },
        { id: 'dsrna-layout', label: 'Sample Info & Layout',        type: 'info'   },
      ],
    },
  },
  { id: 'sample-xfer-aliquot', type: 'operationNode', position: z,
    data: {
      label: 'Sample Transfer (to I.Dot S)',
      device: { id: 'tecan-fluent-3', name: 'TecanFluent' },
      duration: dur(), description: 'Transfer dsRNA into I.Dot S source plates', notes: '',
      inputs: [], outputs: [
        { id: 'idots-loaded', label: 'I.Dot S Source Plates (loaded)', type: 'sample' },
      ],
    },
  },
  { id: 'aliquot-random', type: 'operationNode', position: z,
    data: {
      label: 'Aliquot & Randomization',
      device: { id: 'idots-fluent', name: 'i.Dot S & TecanFluent' },
      duration: dur(), description: 'Dispense oligos with randomized layout', notes: '',
      inputs: [], outputs: [
        { id: 'perturbagen',  label: 'Plates with Perturbagen', type: 'sample' },
        { id: 'final-layout', label: 'Sample Info & Layout',    type: 'info'   },
      ],
    },
  },
  { id: 'seal', type: 'operationNode', position: z,
    data: {
      label: 'Seal', device: { id: 'sealer', name: 'Sealer' },
      duration: dur(), description: 'Seal plates for storage', notes: '',
      inputs: [], outputs: [
        { id: 'sealed-out', label: 'Sealed Plates', type: 'sample' },
      ],
    },
  },
  { id: 'store-oligos', type: 'operationNode', position: z,
    data: {
      label: 'Store Oligo Plates',
      device: { id: 'freezer-80a', name: '-80°C Freezer' },
      duration: dur(), description: 'Store sealed oligo plates at -80°C', notes: '',
      inputs: [], outputs: [
        { id: 'stored-oligos', label: 'Sealed Plates (stored -80°C)', type: 'sample' },
        { id: 'store-layout',  label: 'Sample Info & Layout',         type: 'info'   },
      ],
    },
  },
  { id: 'peel', type: 'operationNode', position: z,
    data: {
      label: 'Peel', device: { id: 'pealer', name: 'Pealer' },
      duration: dur('5', 'min'), description: 'Peel seal before transfection use', notes: '',
      inputs: [], outputs: [
        { id: 'peeled-oligos', label: 'Oligos in 384-well Plate', type: 'sample' },
      ],
    },
  },

  // ── Island B: Cell Culture ────────────────────────────────────────────────
  { id: 'start-cell', type: 'startNode', position: z,
    data: { label: 'Cell Culture & Treatment Process' } },

  { id: 'thaw-cell', type: 'operationNode', position: z,
    data: {
      label: 'Thaw Cell',
      device: { id: 'thawstar', name: 'ThawSTAR & Cryovial Capper' },
      duration: dur(), description: 'Thaw cryopreserved cells', notes: '',
      inputs: [], outputs: [
        { id: 'thawed-cell', label: 'Cell in AutoFlask', type: 'sample' },
      ],
    },
  },
  { id: 'cell-passage', type: 'operationNode', position: z,
    data: {
      label: 'Cell Passage',
      device: { id: 'lh-centrifuge', name: 'Liquid Handler & Centrifuge' },
      duration: dur(), description: 'Enzymatic dissociation and replating', notes: '',
      inputs: [], outputs: [
        { id: 'cell-autoflask', label: 'Cell in AutoFlask',    type: 'sample' },
        { id: 'cell-reservoir', label: 'Cell in Reservoir',    type: 'sample' },
      ],
    },
  },
  { id: 'cell-culture-expand', type: 'operationNode', position: z,
    data: {
      label: 'Cell Culture (Expansion)',
      device: { id: 'cytomat-1', name: 'Cytomat' },
      duration: dur('3-5', 'day'), description: 'Expand cells in automated incubator', notes: '',
      inputs: [], outputs: [
        { id: 'cell-expanded', label: 'Cell in AutoFlask', type: 'sample' },
      ],
    },
  },
  { id: 'cell-imaging-qc', type: 'operationNode', position: z,
    data: {
      label: 'Cell Imaging (QC)',
      device: { id: 'cytation-qc', name: 'Cytation' },
      duration: dur(), description: 'Brightfield imaging — confluency check', notes: '',
      inputs: [], outputs: [
        { id: 'confluence-data',  label: 'Cell Confluence Data', type: 'info'   },
        { id: 'cell-img-qc-out',  label: 'Cell in AutoFlask',    type: 'sample' },
      ],
    },
  },
  { id: 'cell-count', type: 'operationNode', position: z,
    data: {
      label: 'Cell Count',
      device: { id: 'cellcounter', name: 'CellCounter' },
      duration: dur(), description: 'Count cells (Trypan blue exclusion)', notes: '',
      inputs: [], outputs: [
        { id: 'cell-qc-data', label: 'Cell QC Data',    type: 'info'   },
        { id: 'counted-cell', label: 'Cell (counted)',  type: 'sample' },
      ],
    },
  },
  { id: 'cell-cryo', type: 'operationNode', position: z,
    data: {
      label: 'Cell Cryopreservation',
      device: { id: 'lh-cryo', name: 'Liquid Handler & Cryovial Capper' },
      duration: dur(), description: 'Cryopreserve surplus cells for banking', notes: '',
      inputs: [], outputs: [
        { id: 'cryo-cell-out', label: 'Cell in Cryo Tube', type: 'sample' },
      ],
    },
  },
  { id: 'store-cells', type: 'operationNode', position: z,
    data: {
      label: 'Store Cells',
      device: { id: 'freezer-80b', name: '-80°C Freezer' },
      duration: dur(), description: 'Long-term cryogenic storage', notes: '',
      inputs: [], outputs: [],
    },
  },
  { id: 'end-cryo', type: 'endNode', position: z,
    data: { label: 'End (Cell Bank)' } },

  // ── Convergence & Downstream ──────────────────────────────────────────────
  { id: 'transfect-prep', type: 'operationNode', position: z,
    data: {
      label: 'Prepare Transfection System',
      device: { id: 'lh-transfect', name: 'Liquid Handler' },
      duration: dur(), description: 'Prepare transfection mix (lipoplex)', notes: '',
      inputs: [], outputs: [
        { id: 'lipoplex-out', label: 'Plates with Perturbagen', type: 'sample' },
      ],
    },
  },
  { id: 'cell-seeding', type: 'operationNode', position: z,
    data: {
      label: 'Cell Seeding & Transfection',
      device: { id: 'lh-seeding', name: 'Liquid Handler' },
      duration: dur(), description: 'Seed cells and apply siRNA perturbagen', notes: '',
      inputs: [], outputs: [
        { id: 'cell-plates-out', label: 'Cell Plates', type: 'sample' },
      ],
    },
  },
  { id: 'cell-culture-assay', type: 'operationNode', position: z,
    data: {
      label: 'Cell Culture (Assay)',
      device: { id: 'cytomat-2', name: 'Cytomat' },
      duration: dur('3-5', 'day'), description: 'Incubate transfected cells for phenotype', notes: '',
      inputs: [], outputs: [
        { id: 'assay-plates', label: 'Cell Plates (Assay Ready)', type: 'sample' },
      ],
    },
  },
  { id: 'cell-imaging-assay', type: 'operationNode', position: z,
    data: {
      label: 'Cell Imaging (Assay)',
      device: { id: 'cytation-assay', name: 'Cytation' },
      duration: dur(), description: 'High-content phenotypic imaging', notes: '',
      inputs: [], outputs: [
        { id: 'imaging-data', label: 'Imaging Data', type: 'info' },
      ],
    },
  },
  { id: 'cell-lysis', type: 'operationNode', position: z,
    data: {
      label: 'Cell Lysis',
      device: { id: 'lh-lysis', name: 'Liquid Handler' },
      duration: dur(), description: 'Lyse cells for RNA extraction', notes: '',
      inputs: [], outputs: [
        { id: 'cell-lysate', label: 'Cell Lysate', type: 'sample' },
      ],
    },
  },
  { id: 'rna-extract', type: 'operationNode', position: z,
    data: {
      label: 'RNA Extraction',
      device: { id: 'kingfisher', name: 'KingFisher & Liquid Handler' },
      duration: dur(), description: 'Extract total RNA via magnetic bead kit', notes: '',
      inputs: [], outputs: [
        { id: 'total-rna', label: 'Total RNA', type: 'sample' },
      ],
    },
  },
  { id: 'store-rna', type: 'operationNode', position: z,
    data: {
      label: 'Store RNA',
      device: { id: 'freezer-80c', name: '-80°C Freezer' },
      duration: dur(), description: 'Store total RNA at -80°C', notes: '',
      inputs: [], outputs: [],
    },
  },
  { id: 'end-workflow', type: 'endNode', position: z,
    data: { label: 'End' } },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  EDGES
// ═══════════════════════════════════════════════════════════════════════════════
const edges = [

  // ── Island A: Oligo Synthesis — workflow flow ──────────────────────────────
  flow('f-s1-ad',  'start-oligo',        'assay-design'),
  flow('f-ad-os',  'assay-design',        'oligo-synth'),
  flow('f-os-am',  'oligo-synth',         'ammonolysis'),
  flow('f-am-el',  'ammonolysis',         'elution'),
  flow('f-el-xq',  'elution',             'sample-xfer-qc'),
  flow('f-xq-lc',  'sample-xfer-qc',     'lc-ms'),
  flow('f-lc-nm',  'lc-ms',              'normalization'),
  flow('f-nm-cd',  'normalization',       'combine-dsrna'),
  flow('f-cd-xa',  'combine-dsrna',       'sample-xfer-aliquot'),
  flow('f-xa-ar',  'sample-xfer-aliquot', 'aliquot-random'),
  flow('f-ar-sl',  'aliquot-random',      'seal'),
  flow('f-sl-so',  'seal',               'store-oligos'),
  flow('f-so-pl',  'store-oligos',        'peel'),
  flow('f-pl-tp',  'peel',               'transfect-prep'),

  // ── assay-design inputs ────────────────────────────────────────────────────
  // dataNode → single mat-out handle
  obj('oe-ad-pm',  'obj-plate-map',  'assay-design', 'ad-pm', 'info', 'Plate Map'),
  obj('oe-ad-os',  'obj-oligo-seq',  'assay-design', 'ad-os', 'info', 'Oligo Sequences'),

  // ── oligo-synth inputs ─────────────────────────────────────────────────────
  mat('m-ad-os',   'assay-design',  'oligo-synth', 'matrix',      'os-mx',  'info',       'Designed Matrix'),
  // labwareNode: per-item handle
  itm('oe-os-sb1', 'obj-synth-board', 'sb1', 'oligo-synth', 'os-sb1', 'labware', 'Solid Phase Synthesis Board'),
  // reagentNode: one edge per reagent (7 items)
  itm('oe-os-r1',  'obj-synth-reag',  'r1',  'oligo-synth', 'os-r1',  'reagent',    'dA/T/C/G/U'),
  itm('oe-os-r2',  'obj-synth-reag',  'r2',  'oligo-synth', 'os-r2',  'reagent',    'Activator'),
  itm('oe-os-r3',  'obj-synth-reag',  'r3',  'oligo-synth', 'os-r3',  'reagent',    'Cap A/B'),
  itm('oe-os-r4',  'obj-synth-reag',  'r4',  'oligo-synth', 'os-r4',  'reagent',    'Oxidation Solution'),
  itm('oe-os-r5',  'obj-synth-reag',  'r5',  'oligo-synth', 'os-r5',  'reagent',    'Detritylation Solution'),
  itm('oe-os-r6',  'obj-synth-reag',  'r6',  'oligo-synth', 'os-r6',  'reagent',    "5'-Phosphate Phosphoramidite"),
  itm('oe-os-r7',  'obj-synth-reag',  'r7',  'oligo-synth', 'os-r7',  'reagent',    'Nitrogen Gas'),

  // ── ammonolysis inputs ─────────────────────────────────────────────────────
  mat('m-os-am',   'oligo-synth',   'ammonolysis', 'board-sample', 'am-bs',  'sample',     'Board with Sample'),
  itm('oe-am-a1',  'obj-ammo-reag', 'a1', 'ammonolysis', 'am-a1', 'reagent', 'Ammonia Water'),
  itm('oe-am-a2',  'obj-ammo-reag', 'a2', 'ammonolysis', 'am-a2', 'reagent', 'Water'),

  // ── elution / purification inputs ──────────────────────────────────────────
  mat('m-am-el',   'ammonolysis',   'elution', 'crude-oligo', 'el-cr', 'sample',     'Crude Oligonucleotide (384-well)'),
  itm('oe-el-e1',  'obj-elut-reag', 'e1', 'elution', 'el-e1', 'reagent',    'Elution Buffer / Water'),
  itm('oe-el-e2',  'obj-elut-reag', 'e2', 'elution', 'el-e2', 'reagent',    'ACN'),
  itm('oe-el-e3',  'obj-elut-reag', 'e3', 'elution', 'el-e3', 'reagent',    'Acrylonitrile Scavenger (ANC)'),
  itm('oe-el-e4',  'obj-elut-reag', 'e4', 'elution', 'el-e4', 'reagent',    'Formic Acid'),
  itm('oe-el-hc1', 'obj-hplc-col',  'hc1','elution', 'el-hc1','labware', 'HPLC Column'),

  // ── sample-xfer-qc inputs ─────────────────────────────────────────────────
  mat('m-el-xq',   'elution',       'sample-xfer-qc', 'purified-oligos', 'xq-pu', 'sample',     'Purified Oligos'),
  itm('oe-xq-q1',  'obj-qc-plates', 'q1', 'sample-xfer-qc', 'xq-q1', 'labware', 'Lunatic Plate 96-format ×4'),
  itm('oe-xq-q2',  'obj-qc-plates', 'q2', 'sample-xfer-qc', 'xq-q2', 'labware', 'LC-MS Plate 96-well'),

  // ── lc-ms inputs ──────────────────────────────────────────────────────────
  mat('m-xq-lc',   'sample-xfer-qc','lc-ms', 'lcms-loaded',  'lc-pl',  'sample',     'LC-MS Plate (loaded)'),
  itm('oe-lc-l1',  'obj-lcms-reag', 'l1',  'lc-ms', 'lc-l1',  'reagent',    'Formic Acid'),
  itm('oe-lc-l2',  'obj-lcms-reag', 'l2',  'lc-ms', 'lc-l2',  'reagent',    'ACN'),
  itm('oe-lc-l3',  'obj-lcms-reag', 'l3',  'lc-ms', 'lc-l3',  'reagent',    'Nitrogen Gas'),
  itm('oe-lc-lc1', 'obj-lcms-cons', 'lc1', 'lc-ms', 'lc-lc1', 'labware', 'Lunatics'),
  itm('oe-lc-lc2', 'obj-lcms-cons', 'lc2', 'lc-ms', 'lc-lc2', 'labware', 'HPLC Column'),

  // ── normalization inputs ───────────────────────────────────────────────────
  mat('m-xq-nm',   'sample-xfer-qc','normalization', 'lunatic-loaded', 'nm-lu', 'sample', 'Lunatic Plate (loaded)'),
  mat('m-lc-nm',   'lc-ms',         'normalization', 'qc-report',      'nm-qc', 'info',   'QC Report (conc./purity)'),
  itm('oe-nm-w1',  'obj-norm-water', 'w1', 'normalization', 'nm-w1', 'reagent', 'Water'),

  // ── combine-dsrna inputs ───────────────────────────────────────────────────
  mat('m-nm-s',    'normalization',  'combine-dsrna', 'sense-oligos',     'cd-se', 'sample', 'Normalized Sense Oligos'),
  mat('m-nm-a',    'normalization',  'combine-dsrna', 'antisense-oligos', 'cd-an', 'sample', 'Normalized Antisense Oligos'),
  mat('m-nm-ly',   'normalization',  'combine-dsrna', 'sample-layout',    'cd-ly', 'info',   'Sample Info & Layout'),

  // ── sample-xfer-aliquot inputs ────────────────────────────────────────────
  mat('m-cd-xa',   'combine-dsrna', 'sample-xfer-aliquot', 'dsrna-plate',  'xa-ds', 'sample',     'dsRNA/DNA in 384-well Plate'),
  mat('m-cd-ly',   'combine-dsrna', 'sample-xfer-aliquot', 'dsrna-layout', 'xa-ly', 'info',       'Sample Info & Layout'),
  itm('oe-xa-ip1', 'obj-idots-plt', 'ip1', 'sample-xfer-aliquot', 'xa-ip1', 'labware', 'I.Dot S Source Plates (96-well ×4)'),

  // ── aliquot-random inputs ─────────────────────────────────────────────────
  mat('m-xa-ar',   'sample-xfer-aliquot', 'aliquot-random', 'idots-loaded', 'ar-id', 'sample',     'I.Dot S Source Plates (loaded)'),
  obj('oe-ar-rs',  'obj-rand-seeds',  'aliquot-random', 'ar-rs',   'info',       'Random Seeds / Layout'),
  itm('oe-ar-ap1', 'obj-assay-plt',   'ap1', 'aliquot-random', 'ar-ap1', 'labware', 'Cell Culture Plates'),

  // ── seal → store-oligos → peel → transfect-prep (op-to-op) ───────────────
  mat('m-ar-sl',   'aliquot-random', 'seal',         'perturbagen',   'sl-pe', 'sample', 'Plates with Perturbagen'),
  mat('m-sl-so',   'seal',           'store-oligos', 'sealed-out',    'so-se', 'sample', 'Sealed Plates'),
  mat('m-so-pl',   'store-oligos',   'peel',         'stored-oligos', 'pl-st', 'sample', 'Sealed Plates (stored -80°C)'),
  mat('m-pl-tp',   'peel',           'transfect-prep','peeled-oligos','tp-ol', 'sample', 'Oligos in 384-well Plate'),

  // ── transfect-prep inputs ─────────────────────────────────────────────────
  itm('oe-tp-tr1', 'obj-trans-reag', 'tr1',  'transfect-prep', 'tp-tr1', 'reagent',    'Transfection Medium'),
  itm('oe-tp-tr2', 'obj-trans-reag', 'tr2',  'transfect-prep', 'tp-tr2', 'reagent',    'Transfection Lipid Reagent'),
  itm('oe-tp-tc1', 'obj-trans-cons', 'tco1', 'transfect-prep', 'tp-tc1', 'labware', 'Reservoir'),

  // ── Island B: Cell Culture — workflow flow ─────────────────────────────────
  flow('f-s2-tc',  'start-cell',          'thaw-cell'),
  flow('f-tc-cp',  'thaw-cell',           'cell-passage'),
  flow('f-cp-ce',  'cell-passage',        'cell-culture-expand'),
  flow('f-ce-iq',  'cell-culture-expand', 'cell-imaging-qc'),
  flow('f-iq-cc',  'cell-imaging-qc',     'cell-count'),
  flow('f-cc-cr',  'cell-count',          'cell-cryo'),
  flow('f-cr-sc',  'cell-cryo',           'store-cells'),
  flow('f-sc-ec',  'store-cells',         'end-cryo'),

  // ── thaw-cell inputs ──────────────────────────────────────────────────────
  obj('oe-tc-cc',  'obj-cryo-cells',  'thaw-cell', 'tc-cc',  'sample',     'Cryopreserved Cells'),
  itm('oe-tc-th1', 'obj-thaw-reag',   'th1', 'thaw-cell', 'tc-th1', 'reagent',    'Cell Culture Medium'),
  itm('oe-tc-th2', 'obj-thaw-reag',   'th2', 'thaw-cell', 'tc-th2', 'reagent',    'Liquid Nitrogen'),
  itm('oe-tc-ct1', 'obj-cryo-tube-t', 'ct1', 'thaw-cell', 'tc-ct1', 'labware', 'Cryo Tubes'),

  // ── cell-passage inputs ───────────────────────────────────────────────────
  mat('m-tc-cp',   'thaw-cell',    'cell-passage', 'thawed-cell', 'cp-tc', 'sample', 'Cell in AutoFlask'),
  itm('oe-cp-p1',  'obj-pass-reag','p1',  'cell-passage', 'cp-p1',  'reagent',    'DPBS'),
  itm('oe-cp-p2',  'obj-pass-reag','p2',  'cell-passage', 'cp-p2',  'reagent',    'TripLE'),
  itm('oe-cp-p3',  'obj-pass-reag','p3',  'cell-passage', 'cp-p3',  'reagent',    'Cell Culture Medium'),
  itm('oe-cp-pc1', 'obj-pass-cons','pc1', 'cell-passage', 'cp-pc1', 'labware', 'AutoFlask'),
  itm('oe-cp-pc2', 'obj-pass-cons','pc2', 'cell-passage', 'cp-pc2', 'labware', 'Reservoir'),

  // ── cell-culture-expand → cell-imaging-qc → cell-count ────────────────────
  mat('m-cp-ce',   'cell-passage',        'cell-culture-expand', 'cell-autoflask',  'ce-fl', 'sample', 'Cell in AutoFlask'),
  mat('m-ce-iq',   'cell-culture-expand', 'cell-imaging-qc',     'cell-expanded',   'iq-ce', 'sample', 'Cell in AutoFlask'),
  mat('m-iq-cc',   'cell-imaging-qc',     'cell-count',          'cell-img-qc-out', 'cc-iq', 'sample', 'Cell in AutoFlask'),
  itm('oe-cc-ty1', 'obj-trypan',          'ty1', 'cell-count', 'cc-ty1', 'reagent', 'Trypan Blue'),

  // ── cell-cryo inputs ──────────────────────────────────────────────────────
  mat('m-cc-cr',   'cell-count',  'cell-cryo', 'counted-cell', 'cr-cc',  'sample',     'Cell (counted)'),
  itm('oe-cr-cr1', 'obj-cryo-reag',  'cr1', 'cell-cryo', 'cr-cr1', 'reagent',    'DMSO'),
  itm('oe-cr-cr2', 'obj-cryo-reag',  'cr2', 'cell-cryo', 'cr-cr2', 'reagent',    'FBS'),
  itm('oe-cr-cr3', 'obj-cryo-reag',  'cr3', 'cell-cryo', 'cr-cr3', 'reagent',    'Preservation Solution'),
  itm('oe-cr-cc1', 'obj-cryo-tube-c','cc1', 'cell-cryo', 'cr-cc1', 'labware', 'Cryo Tubes'),

  // ── store-cells inputs ────────────────────────────────────────────────────
  mat('m-cr-sc',    'cell-cryo',  'store-cells', 'cryo-cell-out', 'sc-cv',  'sample',     'Cell in Cryo Tube'),
  itm('oe-sc-lnt1', 'obj-ln2-tank','lnt1', 'store-cells', 'sc-lnt1', 'labware', 'Liquid Nitrogen Tank'),

  // ── Convergence: both islands → cell-seeding ──────────────────────────────
  flow('f-tp-cs',  'transfect-prep', 'cell-seeding'),
  flow('f-cp-cs',  'cell-passage',   'cell-seeding'),

  mat('m-tp-cs',   'transfect-prep', 'cell-seeding', 'lipoplex-out',   'cs-lp', 'sample',     'Plates with Perturbagen'),
  mat('m-cp-cs',   'cell-passage',   'cell-seeding', 'cell-reservoir', 'cs-re', 'sample',     'Cell in Reservoir'),
  itm('oe-cs-sm1', 'obj-seed-medium','sm1',  'cell-seeding', 'cs-sm1', 'reagent',    'Cell Culture Medium'),
  itm('oe-cs-sc1', 'obj-seed-cons',  'sco1', 'cell-seeding', 'cs-sc1', 'labware', 'Reservoir'),

  // ── Downstream — workflow flow ─────────────────────────────────────────────
  flow('f-cs-ca',  'cell-seeding',       'cell-culture-assay'),
  flow('f-ca-ci',  'cell-culture-assay', 'cell-imaging-assay'),
  flow('f-ca-cl',  'cell-culture-assay', 'cell-lysis'),
  flow('f-cl-re',  'cell-lysis',         'rna-extract'),
  flow('f-re-sr',  'rna-extract',        'store-rna'),
  flow('f-sr-end', 'store-rna',          'end-workflow'),
  flow('f-ci-end', 'cell-imaging-assay', 'end-workflow'),

  // ── cell-culture-assay inputs ─────────────────────────────────────────────
  mat('m-cs-ca',   'cell-seeding',      'cell-culture-assay', 'cell-plates-out', 'ca-pl', 'sample',  'Cell Plates'),
  itm('oe-ca-am1', 'obj-assay-medium',  'amd1', 'cell-culture-assay', 'ca-am1', 'reagent', 'Cell Culture Medium'),

  // ── cell-imaging-assay inputs ─────────────────────────────────────────────
  mat('m-ca-ci',   'cell-culture-assay', 'cell-imaging-assay', 'assay-plates', 'ci-pl', 'sample', 'Cell Plates (Assay Ready)'),

  // ── cell-lysis inputs ─────────────────────────────────────────────────────
  mat('m-ca-cl',   'cell-culture-assay', 'cell-lysis', 'assay-plates', 'cl-pl', 'sample',  'Cell Plates (Assay Ready)'),
  itm('oe-cl-lb1', 'obj-lysis-buf',     'lb1', 'cell-lysis', 'cl-lb1', 'reagent', 'Lysis Buffer in Reservoir'),

  // ── rna-extract inputs ────────────────────────────────────────────────────
  mat('m-cl-re',   'cell-lysis',    'rna-extract', 'cell-lysate', 're-ly',  'sample',     'Cell Lysate'),
  itm('oe-re-rk1', 'obj-rna-kit',   'rk1', 'rna-extract', 're-rk1', 'reagent',    'KingFisher RNA Purification Kit'),
  itm('oe-re-rk2', 'obj-rna-kit',   'rk2', 'rna-extract', 're-rk2', 'reagent',    'Elution Buffer / Water'),
  itm('oe-re-dw1', 'obj-deep-well', 'dw1', 'rna-extract', 're-dw1', 'labware', 'Deep Well Plates (96-well)'),

  // ── store-rna inputs ──────────────────────────────────────────────────────
  mat('m-re-sr',   'rna-extract',  'store-rna', 'total-rna', 'sr-rn', 'sample', 'Total RNA'),
]

// ═══════════════════════════════════════════════════════════════════════════════
export const BIOYONG_WORKFLOW = {
  id: 'bioyong-island-1',
  name: 'Bioyong',
  description: 'Bioyong Island #1 — siRNA HTS workflow. ' +
    'Oligo synthesis + cell culture, converging at transfection and phenotypic readout.',
  createdAt: '2025-06-01T00:00:00.000Z',
  modifiedAt: '2025-06-01T00:00:00.000Z',
  nodes: [...objectNodes, ...workflowNodes],
  edges,
}

