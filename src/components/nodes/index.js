import StartNode        from './StartNode'
import EndNode          from './EndNode'
import OperationNode    from './OperationNode'
import IfElseNode       from './IfElseNode'
import LoopNode         from './LoopNode'
import WaitUntilNode    from './WaitUntilNode'
import SetVariableNode  from './SetVariableNode'
import DataNode         from './DataNode'
import NotificationNode from './NotificationNode'
import ExperimentNode   from './ExperimentNode'
import SampleNode       from './SampleNode'
import LabwareNode      from './LabwareNode'
import ReagentNode      from './ReagentNode'
import ParallelNode     from './ParallelNode'
import ProcessNode      from './ProcessNode'
import { NODE_TYPES }   from '../../constants/nodeTypes'

const nodeTypes = {
  [NODE_TYPES.START]:        StartNode,
  [NODE_TYPES.END]:          EndNode,
  [NODE_TYPES.OPERATION]:    OperationNode,
  [NODE_TYPES.IF_ELSE]:      IfElseNode,
  [NODE_TYPES.LOOP]:         LoopNode,
  [NODE_TYPES.WAIT_UNTIL]:   WaitUntilNode,
  [NODE_TYPES.SET_VARIABLE]: SetVariableNode,
  [NODE_TYPES.DATA]:         DataNode,
  [NODE_TYPES.NOTIFICATION]: NotificationNode,
  [NODE_TYPES.EXPERIMENT]:   ExperimentNode,
  [NODE_TYPES.SAMPLE]:       SampleNode,
  [NODE_TYPES.LABWARE]:      LabwareNode,
  [NODE_TYPES.REAGENT]:      ReagentNode,
  [NODE_TYPES.PARALLEL]:     ParallelNode,
  [NODE_TYPES.PROCESS]:      ProcessNode,
}

export default nodeTypes
