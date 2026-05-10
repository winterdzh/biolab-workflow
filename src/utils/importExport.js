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

// ── URL sharing helpers ───────────────────────────────────────────────────────
// Encodes a workflow JSON string to a URL-safe base64url string (UTF-8 safe).
export function encodeWorkflowForURL(jsonString) {
  const bytes = new TextEncoder().encode(jsonString)
  const binStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Decodes a base64url string back to a JSON string.
export function decodeWorkflowFromURL(encoded) {
  const binStr = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
