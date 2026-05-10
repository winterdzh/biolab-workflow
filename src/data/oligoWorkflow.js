// ─── Oligo Chemical Synthesis Workflow ───────────────────────────────────────
// Start → Assay Design → Oligo Synthesis → Ammonolysis → Elution/Purification
// → QC Transfer → LC-MS → Normalization → Combine dsRNA → Transfer to I.Dot S
// → Aliquot & Randomize → Seal → Store (-80°C) → End
// Output product: sealed 384-well oligo plates ready for cell processing.

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

  // ── Assay Design inputs ────────────────────────────────────────────────────
  { id: 'obj-plate-map',   type: 'dataNode',    position: z,
    data: { label: 'Plate Map' } },
  { id: 'obj-oligo-seq',   type: 'dataNode',    position: z,
    data: { label: 'Oligo Sequences' } },

  // ── Oligo Synthesis ────────────────────────────────────────────────────────
  { id: 'obj-synth-board', type: 'labwareNode', position: z,
    data: { label: 'Solid Phase Synthesis Board',
            items: [{ id: 'sb1', name: 'Solid Phase Synthesis Board' }] } },
  { id: 'obj-synth-reag',  type: 'reagentNode', position: z,
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

  // ── Ammonolysis ────────────────────────────────────────────────────────────
  { id: 'obj-ammo-reag',   type: 'reagentNode', position: z,
    data: { label: 'Ammonolysis Reagents',
            items: [{ id: 'a1', name: 'Ammonia Water' }, { id: 'a2', name: 'Water' }] } },

  // ── Elution / Purification ─────────────────────────────────────────────────
  { id: 'obj-elut-reag',   type: 'reagentNode', position: z,
    data: { label: 'Purification Reagents',
            items: [
              { id: 'e1', name: 'Elution Buffer / Water' },
              { id: 'e2', name: 'ACN' },
              { id: 'e3', name: 'Acrylonitrile Scavenger (ANC)' },
              { id: 'e4', name: 'Formic Acid' },
            ] } },
  { id: 'obj-hplc-col',    type: 'labwareNode', position: z,
    data: { label: 'HPLC Column', items: [{ id: 'hc1', name: 'HPLC Column' }] } },

  // ── QC plates ─────────────────────────────────────────────────────────────
  { id: 'obj-qc-plates',   type: 'labwareNode', position: z,
    data: { label: 'Lunatic & LC-MS Plates',
            items: [
              { id: 'q1', name: 'Lunatic Plate 96-format ×4' },
              { id: 'q2', name: 'LC-MS Plate 96-well' },
            ] } },
  { id: 'obj-lcms-reag',   type: 'reagentNode', position: z,
    data: { label: 'LC-MS Reagents',
            items: [
              { id: 'l1', name: 'Formic Acid' },
              { id: 'l2', name: 'ACN' },
              { id: 'l3', name: 'Nitrogen Gas' },
            ] } },
  { id: 'obj-lcms-cons',   type: 'labwareNode', position: z,
    data: { label: 'LC-MS Consumables',
            items: [{ id: 'lc1', name: 'Lunatics' }, { id: 'lc2', name: 'HPLC Column' }] } },

  // ── Normalization ──────────────────────────────────────────────────────────
  { id: 'obj-norm-water',  type: 'reagentNode', position: z,
    data: { label: 'Water', items: [{ id: 'w1', name: 'Water' }] } },

  // ── I.Dot S source plates ──────────────────────────────────────────────────
  { id: 'obj-idots-plt',   type: 'labwareNode', position: z,
    data: { label: 'I.Dot S Source Plates (96-well ×4)',
            items: [{ id: 'ip1', name: 'I.Dot S Source Plates (96-well ×4)' }] } },

  // ── Aliquot randomization ──────────────────────────────────────────────────
  { id: 'obj-rand-seeds',  type: 'dataNode',    position: z,
    data: { label: 'Random Seeds / Layout' } },
  { id: 'obj-assay-plt',   type: 'labwareNode', position: z,
    data: { label: 'Cell Culture Plates (96 or 384-well)',
            items: [{ id: 'ap1', name: 'Cell Culture Plates' }] } },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  OPERATION / CONTROL NODES
// ═══════════════════════════════════════════════════════════════════════════════
const workflowNodes = [

  { id: 'start-oligo', type: 'startNode', position: z,
    data: { label: 'Oligo Chemical Synthesis' } },

  { id: 'assay-design', type: 'operationNode', position: z,
    data: { label: 'Assay Design', device: null, duration: dur(),
      description: 'Design oligo sequences and assay matrix', notes: '',
      inputs: [], outputs: [{ id: 'matrix', label: 'Designed Matrix', type: 'info' }] } },

  { id: 'oligo-synth', type: 'operationNode', position: z,
    data: { label: 'Oligo Synthesis',
      device: { id: 'shasta-768', name: 'Oligo Synthesizer Shasta 768' },
      duration: dur(), description: 'Solid-phase oligonucleotide synthesis', notes: '',
      inputs: [], outputs: [
        { id: 'board-sample', label: 'Board with Sample',  type: 'sample' },
        { id: 'synth-report', label: 'Synthesis Report',   type: 'info'   },
      ] } },

  { id: 'ammonolysis', type: 'operationNode', position: z,
    data: { label: 'Ammonolysis (C&D)',
      device: { id: 'ammonolysis-sys', name: 'Ammonolysis System' },
      duration: dur(), description: 'Cleavage & Deprotection', notes: '',
      inputs: [], outputs: [
        { id: 'crude-oligo', label: 'Crude Oligonucleotide (384-well)', type: 'sample' },
      ] } },

  { id: 'elution', type: 'operationNode', position: z,
    data: { label: 'Elution / Purification',
      device: { id: 'tecan-fluent', name: 'Tecan Fluent' },
      duration: dur(), description: 'Purification elution of crude oligonucleotides', notes: '',
      inputs: [], outputs: [
        { id: 'purified-oligos', label: 'Purified Oligos (384-well)', type: 'sample' },
        { id: 'solid-waste',     label: 'Solid Waste',                type: 'labware' },
      ] } },

  { id: 'sample-xfer-qc', type: 'operationNode', position: z,
    data: { label: 'Sample Transfer (QC)',
      device: { id: 'tecan-fluent-qc', name: 'TecanFluent' },
      duration: dur(), description: 'Transfer to Lunatic and LC-MS plates for QC', notes: '',
      inputs: [], outputs: [
        { id: 'lunatic-loaded', label: 'Lunatic Plate (loaded)', type: 'sample' },
        { id: 'lcms-loaded',    label: 'LC-MS Plate (loaded)',   type: 'sample' },
      ] } },

  { id: 'lc-ms', type: 'operationNode', position: z,
    data: { label: 'LC-MS QC',
      device: { id: 'vanquish', name: 'Vanquish' },
      duration: dur(), description: 'QC: concentration and purity by LC-MS', notes: '',
      inputs: [], outputs: [
        { id: 'qc-report', label: 'QC Report (conc. / purity)', type: 'info' },
      ] } },

  { id: 'normalization', type: 'operationNode', position: z,
    data: { label: 'Normalization',
      device: { id: 'idots', name: 'I.Dot S' },
      duration: dur(), description: 'Normalize oligos to target concentration', notes: '',
      inputs: [], outputs: [
        { id: 'sense-oligos',     label: 'Normalized Sense Oligos (384-well)',     type: 'sample' },
        { id: 'antisense-oligos', label: 'Normalized Antisense Oligos (384-well)', type: 'sample' },
        { id: 'sample-layout',    label: 'Sample Info & Layout',                   type: 'info'   },
      ] } },

  { id: 'combine-dsrna', type: 'operationNode', position: z,
    data: { label: 'Combine dsRNA',
      device: { id: 'tecan-fluent-2', name: 'TecanFluent' },
      duration: dur(), description: 'Hybridize sense and antisense strands to form dsRNA',
      notes: '384-well format ×2, 50 nM, 100 µL',
      inputs: [], outputs: [
        { id: 'dsrna-plate',  label: 'dsRNA/DNA in 384-well Plate', type: 'sample' },
        { id: 'dsrna-layout', label: 'Sample Info & Layout',        type: 'info'   },
      ] } },

  { id: 'sample-xfer-aliquot', type: 'operationNode', position: z,
    data: { label: 'Sample Transfer (to I.Dot S)',
      device: { id: 'tecan-fluent-3', name: 'TecanFluent' },
      duration: dur(), description: 'Transfer dsRNA into I.Dot S source plates', notes: '',
      inputs: [], outputs: [
        { id: 'idots-loaded', label: 'I.Dot S Source Plates (loaded)', type: 'sample' },
      ] } },

  { id: 'aliquot-random', type: 'operationNode', position: z,
    data: { label: 'Aliquot & Randomization',
      device: { id: 'idots-fluent', name: 'i.Dot S & TecanFluent' },
      duration: dur(), description: 'Dispense oligos with randomized layout', notes: '',
      inputs: [], outputs: [
        { id: 'perturbagen',  label: 'Plates with Perturbagen', type: 'sample' },
        { id: 'final-layout', label: 'Sample Info & Layout',    type: 'info'   },
      ] } },

  { id: 'seal', type: 'operationNode', position: z,
    data: { label: 'Seal', device: { id: 'sealer', name: 'Sealer' },
      duration: dur(), description: 'Seal plates for storage', notes: '',
      inputs: [], outputs: [{ id: 'sealed-out', label: 'Sealed Plates', type: 'sample' }] } },

  { id: 'store-oligos', type: 'operationNode', position: z,
    data: { label: 'Store Oligo Plates',
      device: { id: 'freezer-80a', name: '-80°C Freezer' },
      duration: dur(), description: 'Store sealed oligo plates at -80°C', notes: '',
      inputs: [], outputs: [
        { id: 'stored-oligos', label: 'Sealed Plates (stored -80°C)', type: 'sample' },
        { id: 'store-layout',  label: 'Sample Info & Layout',         type: 'info'   },
      ] } },

  { id: 'end-oligo', type: 'endNode', position: z,
    data: { label: 'End — Oligo Plates Ready' } },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  EDGES
// ═══════════════════════════════════════════════════════════════════════════════
const edges = [

  // ── Workflow flow ──────────────────────────────────────────────────────────
  flow('f-s1-ad',  'start-oligo',          'assay-design'),
  flow('f-ad-os',  'assay-design',          'oligo-synth'),
  flow('f-os-am',  'oligo-synth',           'ammonolysis'),
  flow('f-am-el',  'ammonolysis',           'elution'),
  flow('f-el-xq',  'elution',               'sample-xfer-qc'),
  flow('f-xq-lc',  'sample-xfer-qc',       'lc-ms'),
  flow('f-lc-nm',  'lc-ms',                'normalization'),
  flow('f-nm-cd',  'normalization',         'combine-dsrna'),
  flow('f-cd-xa',  'combine-dsrna',         'sample-xfer-aliquot'),
  flow('f-xa-ar',  'sample-xfer-aliquot',   'aliquot-random'),
  flow('f-ar-sl',  'aliquot-random',        'seal'),
  flow('f-sl-so',  'seal',                  'store-oligos'),
  flow('f-so-end', 'store-oligos',          'end-oligo'),

  // ── assay-design inputs ────────────────────────────────────────────────────
  obj('oe-ad-pm',  'obj-plate-map', 'assay-design', 'ad-pm', 'info', 'Plate Map'),
  obj('oe-ad-os',  'obj-oligo-seq', 'assay-design', 'ad-os', 'info', 'Oligo Sequences'),

  // ── oligo-synth inputs ─────────────────────────────────────────────────────
  mat('m-ad-os',   'assay-design',   'oligo-synth', 'matrix',     'os-mx',  'info',    'Designed Matrix'),
  itm('oe-os-sb1', 'obj-synth-board','sb1', 'oligo-synth', 'os-sb1', 'labware', 'Solid Phase Synthesis Board'),
  itm('oe-os-r1',  'obj-synth-reag', 'r1',  'oligo-synth', 'os-r1',  'reagent', 'dA/T/C/G/U'),
  itm('oe-os-r2',  'obj-synth-reag', 'r2',  'oligo-synth', 'os-r2',  'reagent', 'Activator'),
  itm('oe-os-r3',  'obj-synth-reag', 'r3',  'oligo-synth', 'os-r3',  'reagent', 'Cap A/B'),
  itm('oe-os-r4',  'obj-synth-reag', 'r4',  'oligo-synth', 'os-r4',  'reagent', 'Oxidation Solution'),
  itm('oe-os-r5',  'obj-synth-reag', 'r5',  'oligo-synth', 'os-r5',  'reagent', 'Detritylation Solution'),
  itm('oe-os-r6',  'obj-synth-reag', 'r6',  'oligo-synth', 'os-r6',  'reagent', "5'-Phosphate Phosphoramidite"),
  itm('oe-os-r7',  'obj-synth-reag', 'r7',  'oligo-synth', 'os-r7',  'reagent', 'Nitrogen Gas'),

  // ── ammonolysis inputs ─────────────────────────────────────────────────────
  mat('m-os-am',   'oligo-synth',   'ammonolysis', 'board-sample', 'am-bs', 'sample',  'Board with Sample'),
  itm('oe-am-a1',  'obj-ammo-reag', 'a1', 'ammonolysis', 'am-a1', 'reagent', 'Ammonia Water'),
  itm('oe-am-a2',  'obj-ammo-reag', 'a2', 'ammonolysis', 'am-a2', 'reagent', 'Water'),

  // ── elution inputs ─────────────────────────────────────────────────────────
  mat('m-am-el',   'ammonolysis',   'elution', 'crude-oligo', 'el-cr', 'sample', 'Crude Oligonucleotide (384-well)'),
  itm('oe-el-e1',  'obj-elut-reag', 'e1', 'elution', 'el-e1', 'reagent', 'Elution Buffer / Water'),
  itm('oe-el-e2',  'obj-elut-reag', 'e2', 'elution', 'el-e2', 'reagent', 'ACN'),
  itm('oe-el-e3',  'obj-elut-reag', 'e3', 'elution', 'el-e3', 'reagent', 'Acrylonitrile Scavenger (ANC)'),
  itm('oe-el-e4',  'obj-elut-reag', 'e4', 'elution', 'el-e4', 'reagent', 'Formic Acid'),
  itm('oe-el-hc1', 'obj-hplc-col',  'hc1','elution', 'el-hc1','labware', 'HPLC Column'),

  // ── sample-xfer-qc inputs ──────────────────────────────────────────────────
  mat('m-el-xq',   'elution',       'sample-xfer-qc', 'purified-oligos', 'xq-pu', 'sample', 'Purified Oligos'),
  itm('oe-xq-q1',  'obj-qc-plates', 'q1', 'sample-xfer-qc', 'xq-q1', 'labware', 'Lunatic Plate 96-format ×4'),
  itm('oe-xq-q2',  'obj-qc-plates', 'q2', 'sample-xfer-qc', 'xq-q2', 'labware', 'LC-MS Plate 96-well'),

  // ── lc-ms inputs ──────────────────────────────────────────────────────────
  mat('m-xq-lc',   'sample-xfer-qc','lc-ms', 'lcms-loaded', 'lc-pl',  'sample', 'LC-MS Plate (loaded)'),
  itm('oe-lc-l1',  'obj-lcms-reag', 'l1',  'lc-ms', 'lc-l1',  'reagent', 'Formic Acid'),
  itm('oe-lc-l2',  'obj-lcms-reag', 'l2',  'lc-ms', 'lc-l2',  'reagent', 'ACN'),
  itm('oe-lc-l3',  'obj-lcms-reag', 'l3',  'lc-ms', 'lc-l3',  'reagent', 'Nitrogen Gas'),
  itm('oe-lc-lc1', 'obj-lcms-cons', 'lc1', 'lc-ms', 'lc-lc1', 'labware', 'Lunatics'),
  itm('oe-lc-lc2', 'obj-lcms-cons', 'lc2', 'lc-ms', 'lc-lc2', 'labware', 'HPLC Column'),

  // ── normalization inputs ───────────────────────────────────────────────────
  mat('m-xq-nm',   'sample-xfer-qc','normalization', 'lunatic-loaded', 'nm-lu', 'sample', 'Lunatic Plate (loaded)'),
  mat('m-lc-nm',   'lc-ms',         'normalization', 'qc-report',      'nm-qc', 'info',   'QC Report (conc./purity)'),
  itm('oe-nm-w1',  'obj-norm-water', 'w1', 'normalization', 'nm-w1', 'reagent', 'Water'),

  // ── combine-dsrna inputs ───────────────────────────────────────────────────
  mat('m-nm-s',    'normalization', 'combine-dsrna', 'sense-oligos',     'cd-se', 'sample', 'Normalized Sense Oligos'),
  mat('m-nm-a',    'normalization', 'combine-dsrna', 'antisense-oligos', 'cd-an', 'sample', 'Normalized Antisense Oligos'),
  mat('m-nm-ly',   'normalization', 'combine-dsrna', 'sample-layout',    'cd-ly', 'info',   'Sample Info & Layout'),

  // ── sample-xfer-aliquot inputs ─────────────────────────────────────────────
  mat('m-cd-xa',   'combine-dsrna', 'sample-xfer-aliquot', 'dsrna-plate',  'xa-ds', 'sample', 'dsRNA/DNA in 384-well Plate'),
  mat('m-cd-ly',   'combine-dsrna', 'sample-xfer-aliquot', 'dsrna-layout', 'xa-ly', 'info',   'Sample Info & Layout'),
  itm('oe-xa-ip1', 'obj-idots-plt', 'ip1', 'sample-xfer-aliquot', 'xa-ip1', 'labware', 'I.Dot S Source Plates (96-well ×4)'),

  // ── aliquot-random inputs ──────────────────────────────────────────────────
  mat('m-xa-ar',   'sample-xfer-aliquot', 'aliquot-random', 'idots-loaded', 'ar-id', 'sample', 'I.Dot S Source Plates (loaded)'),
  obj('oe-ar-rs',  'obj-rand-seeds', 'aliquot-random', 'ar-rs',   'info',    'Random Seeds / Layout'),
  itm('oe-ar-ap1', 'obj-assay-plt',  'ap1', 'aliquot-random', 'ar-ap1', 'labware', 'Cell Culture Plates'),

  // ── seal → store-oligos ────────────────────────────────────────────────────
  mat('m-ar-sl',   'aliquot-random', 'seal',         'perturbagen',   'sl-pe', 'sample', 'Plates with Perturbagen'),
  mat('m-sl-so',   'seal',           'store-oligos', 'sealed-out',    'so-se', 'sample', 'Sealed Plates'),
]

// ═══════════════════════════════════════════════════════════════════════════════
export const OLIGO_WORKFLOW = {
  id:          'bioyong-oligo-synthesis',
  name:        'Oligo Chemical Synthesis',
  description: 'Solid-phase oligo synthesis → ammonolysis (C&D) → purification → LC-MS QC ' +
               '→ normalization → dsRNA formation → aliquot & randomize → seal & store at -80°C.\n' +
               'Output: sealed 384-well oligo plates, ready for cell-based transfection.',
  createdAt:   '2025-06-01T00:00:00.000Z',
  modifiedAt:  '2025-06-01T00:00:00.000Z',
  nodes:       [...objectNodes, ...workflowNodes],
  edges,
  variables:   [],
  tags:        ['oligo', 'synthesis', 'bioyong'],
}
