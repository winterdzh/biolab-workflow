import { beforeEach, describe, expect, it } from 'vitest'
import useAppStore from './appStore'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

const initial = (() => {
  const s = useAppStore.getState()
  return {
    globalVariables: clone(s.globalVariables),
    workflows: clone(s.workflows),
    activeWorkflowId: s.activeWorkflowId,
    lastBackupAt: s.lastBackupAt,
    lastBackupFingerprint: s.lastBackupFingerprint,
    dismissedBackupFingerprint: s.dismissedBackupFingerprint,
  }
})()

describe('appStore persistence helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAppStore.setState({
      globalVariables: clone(initial.globalVariables),
      workflows: clone(initial.workflows),
      activeWorkflowId: initial.activeWorkflowId,
      lastBackupAt: initial.lastBackupAt,
      lastBackupFingerprint: initial.lastBackupFingerprint,
      dismissedBackupFingerprint: initial.dismissedBackupFingerprint,
    })
  })

  it('imports a workflow JSON into workflows list', () => {
    const store = useAppStore.getState()
    const before = store.workflows.length

    const payload = {
      id: 'test-wf-1',
      metadata: { name: 'Imported WF', description: 'for test' },
      nodes: [{ id: 'start-1', type: 'startNode', position: { x: 0, y: 0 }, data: { label: 'Start' } }],
      edges: [],
      workflowVariables: [],
    }

    const ok = store.importWorkflowJSON(JSON.stringify(payload))
    expect(ok).toBe(true)

    const afterState = useAppStore.getState()
    expect(afterState.workflows.length).toBe(before + 1)
    expect(afterState.workflows.some((w) => w.id === 'test-wf-1')).toBe(true)
  })

  it('tracks backup reminder lifecycle by workflow fingerprint', () => {
    const store = useAppStore.getState()

    store.markBackupExported()
    expect(useAppStore.getState().needsBackupReminder()).toBe(false)

    store.createWorkflow('New Workflow From Test')
    expect(useAppStore.getState().needsBackupReminder()).toBe(true)

    store.dismissBackupReminder()
    expect(useAppStore.getState().needsBackupReminder()).toBe(false)
  })
})
