export function exportWorkflow({ nodes, edges, workflowName, viewport, library, variables }) {
  const payload = {
    version: '1.0',
    metadata: {
      name: workflowName,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    nodes,
    edges,
    viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
    globalVariables: variables ?? [],
    librarySnapshot: library ?? {},
  }
  return JSON.stringify(payload, null, 2)
}

export function importWorkflow(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!data.nodes || !data.edges) throw new Error('Missing nodes/edges')
    return {
      nodes: data.nodes,
      edges: data.edges,
      workflowName: data.metadata?.name ?? 'Imported Workflow',
      variables: data.globalVariables ?? [],
      library: data.librarySnapshot ?? {},
    }
  } catch (e) {
    alert('Invalid workflow JSON: ' + e.message)
    return null
  }
}

