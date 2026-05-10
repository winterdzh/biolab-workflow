import dagre from 'dagre'

// ── Material/supply node types ─────────────────────────────────────────────
const MATERIAL_TYPES = new Set(['sampleNode', 'consumableNode', 'reagentNode'])

// ── Estimated rendered dimensions per node type (LR layout) ─────────────────
const TYPE_W = {
  startNode:        60,
  endNode:          60,
  operationNode:    380,
  ifElseNode:       176,
  loopNode:         176,
  waitUntilNode:    176,
  setVariableNode:  176,
  dataNode:         192,
  notificationNode: 176,
  experimentNode:   420,
  sampleNode:       176,
  labwareNode:      176,
  reagentNode:      176,
  parallelNode:     80,
}
const TYPE_H = {
  startNode:        60,
  endNode:          60,
  operationNode:    200,
  ifElseNode:       90,
  loopNode:         90,
  waitUntilNode:    90,
  setVariableNode:  90,
  dataNode:         140,
  notificationNode: 140,
  experimentNode:   300,
  sampleNode:       140,
  labwareNode:      100,
  reagentNode:      100,
  parallelNode:     160,
}
const DEFAULT_W  = 192
const DEFAULT_H  = 120
const INNER_PAD  = 48
const HEADER_H   = 48
const RANK_SEP   = 140
const NODE_SEP   = 80
const COMP_GAP   = 200
const MARGIN_X   = 60
const MARGIN_Y   = 60

function nodeW(n, expSizes) {
  if (expSizes[n.id]) return expSizes[n.id].width
  return TYPE_W[n.type] ?? DEFAULT_W
}
function nodeH(n, expSizes, edges = []) {
  if (expSizes[n.id]) return expSizes[n.id].height
  if (n.type === 'operationNode') {
    const inCount  = edges.filter((e) => e.target === n.id && e.type === 'labwareEdge').length
    const outCount = (n.data?.outputs ?? []).length
    const rows     = Math.max(inCount, outCount, 1)
    // header 36 + footer 30 + padding top/bottom 8 + rows
    return rows * 24 + 74
  }
  if (n.type === 'reagentNode' || n.type === 'labwareNode') {
    const itemCount = (n.data?.items ?? []).length
    // header ~52 + per-item row 20px + body padding 16
    return itemCount > 0 ? 52 + itemCount * 20 + 16 : 72
  }
  return TYPE_H[n.type] ?? DEFAULT_H
}

export function applyAutoLayout(nodes, edges, direction = 'LR') {
  const experiments = nodes.filter((n) => n.type === 'experimentNode')
  let result        = [...nodes]
  const expSizes    = {}

  // ── Pass 1: layout children within each experiment ───────────────────────
  for (const exp of experiments) {
    const children = nodes.filter((n) => n.parentId === exp.id)
    if (children.length === 0) {
      expSizes[exp.id] = { width: exp.style?.width ?? 400, height: exp.style?.height ?? 250 }
      continue
    }
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: direction, ranksep: RANK_SEP, nodesep: NODE_SEP })
    children.forEach((n) => g.setNode(n.id, { width: nodeW(n, {}), height: nodeH(n, {}, edges) }))
    const childIds = new Set(children.map((n) => n.id))
    edges.filter((e) => childIds.has(e.source) && childIds.has(e.target))
         .forEach((e) => g.setEdge(e.source, e.target))
    dagre.layout(g)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    children.forEach((n) => {
      const p = g.node(n.id); const w = nodeW(n, {}); const h = nodeH(n, {}, edges)
      minX = Math.min(minX, p.x - w / 2); minY = Math.min(minY, p.y - h / 2)
      maxX = Math.max(maxX, p.x + w / 2); maxY = Math.max(maxY, p.y + h / 2)
    })
    const fw = maxX - minX + INNER_PAD * 2
    const fh = maxY - minY + INNER_PAD * 2 + HEADER_H
    expSizes[exp.id] = { width: fw, height: fh }
    result = result.map((n) => {
      if (n.parentId !== exp.id) return n
      const p = g.node(n.id); const w = nodeW(n, {}); const h = nodeH(n, {}, edges)
      return { ...n, position: {
        x: p.x - w / 2 - minX + INNER_PAD,
        y: p.y - h / 2 - minY + INNER_PAD + HEADER_H,
      }}
    })
    result = result.map((n) =>
      n.id === exp.id ? { ...n, style: { ...n.style, width: fw, height: fh } } : n
    )
  }

  // ── Pass 2: layout all top-level nodes in LR ──────────────────────────────
  const topLevel = result.filter((n) => !n.parentId)
  if (topLevel.length === 0) return result

  const toTop = {}
  result.forEach((n) => { toTop[n.id] = n.parentId ?? n.id })

  const topIds = new Set(topLevel.map((n) => n.id))
  const topEdges = edges.filter(
    (e) => topIds.has(toTop[e.source]) && topIds.has(toTop[e.target]) && toTop[e.source] !== toTop[e.target],
  )

  // Union-Find for connected components
  const parent = {}
  topLevel.forEach((n) => { parent[n.id] = n.id })
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] }
    return x
  }
  const union = (a, b) => { parent[find(a)] = find(b) }
  topEdges.forEach((e) => union(toTop[e.source], toTop[e.target]))

  const compMap = {}
  topLevel.forEach((n) => {
    const root = find(n.id)
    if (!compMap[root]) compMap[root] = []
    compMap[root].push(n)
  })
  const componentGroups = Object.values(compMap).sort((a, b) => b.length - a.length)

  // Stack disconnected components vertically below the main one
  let offsetY = MARGIN_Y
  const layoutResults = {}

  for (const group of componentGroups) {
    const groupIds = new Set(group.map((n) => n.id))
    const g2 = new dagre.graphlib.Graph()
    g2.setDefaultEdgeLabel(() => ({}))
    g2.setGraph({ rankdir: direction, ranksep: RANK_SEP, nodesep: NODE_SEP })
    group.forEach((n) => g2.setNode(n.id, { width: nodeW(n, expSizes), height: nodeH(n, expSizes, edges) }))

    const addedEdges = new Set()
    edges.forEach((e) => {
      const src = toTop[e.source]; const tgt = toTop[e.target]
      if (!src || !tgt || src === tgt) return
      if (!groupIds.has(src) || !groupIds.has(tgt)) return
      const key = `${src}||${tgt}`
      if (!addedEdges.has(key)) { addedEdges.add(key); g2.setEdge(src, tgt) }
    })
    dagre.layout(g2)

    let minLeft = Infinity, minTop = Infinity, maxBottom = -Infinity
    group.forEach((n) => {
      const p = g2.node(n.id); if (!p) return
      const h = nodeH(n, expSizes, edges)
      minLeft = Math.min(minLeft, p.x - nodeW(n, expSizes) / 2)
      minTop  = Math.min(minTop,  p.y - h / 2)
      maxBottom = Math.max(maxBottom, p.y + h / 2)
    })

    group.forEach((n) => {
      const p = g2.node(n.id); if (!p) return
      const w = nodeW(n, expSizes); const h = nodeH(n, expSizes, edges)
      layoutResults[n.id] = {
        x: p.x - w / 2 - minLeft + MARGIN_X,
        y: p.y - h / 2 - minTop  + offsetY,
      }
    })

    const compHeight = maxBottom - minTop
    offsetY += compHeight + COMP_GAP
  }

  return result.map((n) => {
    if (n.parentId) return n
    const pos = layoutResults[n.id]
    return pos ? { ...n, position: pos } : n
  })
}
