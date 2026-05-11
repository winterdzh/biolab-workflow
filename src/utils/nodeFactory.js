import { v4 as uuidv4 } from 'uuid'
import { NODE_TYPES } from '../constants/nodeTypes'

const defaultDataMap = {
  [NODE_TYPES.START]:        { label: 'Start' },
  [NODE_TYPES.END]:          { label: 'End' },
  [NODE_TYPES.OPERATION]:    { label: 'New Operation', device: null, duration: { value: 0, unit: 'min' }, description: '', notes: '', inputs: [], outputs: [] },
  [NODE_TYPES.IF_ELSE]:      { label: 'Condition', condition: '', trueLabel: 'Yes', falseLabel: 'No' },
  [NODE_TYPES.LOOP]:         { label: 'Loop', loopType: 'count', count: 3, condition: '' },
  [NODE_TYPES.WAIT_UNTIL]:   { label: 'Wait Until', condition: '' },
  [NODE_TYPES.SET_VARIABLE]: { label: 'Set Variable', variableName: '', expression: '' },
  [NODE_TYPES.PROCESS]:      { label: 'Process', mode: 'export', inputs: [], destination: '', format: 'csv', assignments: [], webhookUrl: '', webhookMethod: 'POST', description: '' },
  [NODE_TYPES.DATA]:         { label: 'Data', items: [] },
  [NODE_TYPES.NOTIFICATION]: { label: 'Note', message: '', noteType: 'note' },
  [NODE_TYPES.EXPERIMENT]:   { label: 'Experiment', description: '' },
  [NODE_TYPES.SAMPLE]:       { label: 'Sample', items: [] },
  [NODE_TYPES.LABWARE]:      { label: 'Labware', items: [] },
  [NODE_TYPES.REAGENT]:      { label: 'Reagents', items: [] },
  [NODE_TYPES.PARALLEL]:     { label: 'Parallel', branches: 2 },
}

export function createNode(type, position) {
  const base = {
    id: uuidv4(),
    type,
    position,
    data: { ...(defaultDataMap[type] ?? { label: type }) },
  }
  if (type === NODE_TYPES.EXPERIMENT) {
    base.style  = { width: 420, height: 280 }
    base.zIndex = -1
  }
  return base
}
