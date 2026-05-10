import { v4 as uuidv4 } from 'uuid'

const INNER_PAD = 48
const HEADER_H  = 48
const NODE_W    = 200
const NODE_H    = 90

export function groupSelectedNodes(nodes, selectedIds, label = 'Experiment') {
  const toGroup = nodes.filter(
    (n) => selectedIds.includes(n.id) && !n.parentId && n.type !== 'experimentNode'
  )
  if (toGroup.length < 2) return null

  const minX = Math.min(...toGroup.map((n) => n.position.x)) - INNER_PAD
  const minY = Math.min(...toGroup.map((n) => n.position.y)) - INNER_PAD - HEADER_H
  const maxX = Math.max(...toGroup.map((n) => n.position.x + NODE_W)) + INNER_PAD
  const maxY = Math.max(...toGroup.map((n) => n.position.y + NODE_H)) + INNER_PAD

  const groupId = uuidv4()
  const groupNode = {
    id: groupId,
    type: 'experimentNode',
    position: { x: minX, y: minY },
    style: { width: maxX - minX, height: maxY - minY },
    data: { label, description: '' },
    zIndex: -1,
    selected: false,
  }

  const updatedNodes = nodes.map((n) => {
    if (!selectedIds.includes(n.id) || n.parentId || n.type === 'experimentNode')
      return { ...n, selected: false }
    return {
      ...n,
      parentId: groupId,
      extent: 'parent',
      position: { x: n.position.x - minX, y: n.position.y - minY },
      selected: false,
    }
  })

  // Experiment node must appear BEFORE its children (renders behind them)
  return [groupNode, ...updatedNodes]
}

export function ungroupExperiment(nodes, experimentId) {
  const exp = nodes.find((n) => n.id === experimentId)
  if (!exp) return nodes
  return nodes
    .filter((n) => n.id !== experimentId)
    .map((n) => {
      if (n.parentId !== experimentId) return n
      const { parentId, extent, ...rest } = n
      return {
        ...rest,
        position: {
          x: exp.position.x + n.position.x,
          y: exp.position.y + n.position.y,
        },
      }
    })
}
