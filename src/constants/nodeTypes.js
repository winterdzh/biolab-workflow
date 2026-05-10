export const NODE_TYPES = {
  START:        'startNode',
  END:          'endNode',
  OPERATION:    'operationNode',
  IF_ELSE:      'ifElseNode',
  LOOP:         'loopNode',
  WAIT_UNTIL:   'waitUntilNode',
  SET_VARIABLE: 'setVariableNode',
  DATA:         'dataNode',
  NOTIFICATION: 'notificationNode',
  EXPERIMENT:   'experimentNode',
  SAMPLE:       'sampleNode',
  LABWARE:      'labwareNode',
  REAGENT:      'reagentNode',
  PARALLEL:     'parallelNode',
  PROCESS:      'processNode',
}

export const ELEMENT_PALETTE = [
  { type: 'operationNode',    label: 'Operation',     description: 'Lab operation step',           color: '#3b82f6', icon: '⚙', category: 'operation' },
  { type: 'startNode',        label: 'Start',         description: 'Workflow entry point',         color: '#FF9933', icon: '▶', category: 'control' },
  { type: 'endNode',          label: 'End',           description: 'Workflow exit point',          color: '#FF9933', icon: '⏹', category: 'control' },
  { type: 'ifElseNode',       label: 'If / Else',     description: 'Conditional branch',           color: '#FF9933', icon: '◇', category: 'control' },
  { type: 'waitUntilNode',    label: 'Wait Until',    description: 'Wait for condition',           color: '#FF9933', icon: '⏳', category: 'control' },
  { type: 'loopNode',         label: 'Loop',          description: 'Repeat steps',                color: '#FF9933', icon: '↻', category: 'control' },
  { type: 'parallelNode',     label: 'Parallel',      description: 'Fork into N branches',        color: '#FF9933', icon: '⑂', category: 'control' },
  { type: 'processNode',      label: 'Process',       description: 'Export data / set variables', color: '#7c3aed', icon: 'λ', category: 'operation' },
  { type: 'notificationNode', label: 'Note',          description: 'Annotation or question',      color: '#FF9933', icon: '📝', category: 'control' },
  { type: 'sampleNode',       label: 'Sample',        description: 'Sample in container',         color: '#3b82f6', icon: '🧬', category: 'objects' },
  { type: 'reagentNode',      label: 'Reagents',      description: 'Buffers, solutions…',         color: '#8b5cf6', icon: '🧪', category: 'objects' },
  { type: 'labwareNode',      label: 'Labware',       description: 'Plates, tips, tubes…',        color: '#06b6d4', icon: '📦', category: 'objects' },
  { type: 'dataNode',         label: 'Data',          description: 'Import / export data',        color: '#009688', icon: '⊞', category: 'objects' },
]

// Kept separate so LeftPanel can render them in a distinct section
export const GROUP_PALETTE = [
  { type: 'experimentNode',   label: 'Experiment',    description: 'Drag to create a frame', color: '#CC0000', icon: '⬡' },
]
