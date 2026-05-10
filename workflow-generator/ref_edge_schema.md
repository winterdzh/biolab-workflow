# Edge Schema Reference
**biolab-workflow v1.0**

All edges share a base structure:
```json
{
  "id": "<unique string>",
  "type": "<edgeType>",
  "source": "<sourceNodeId>",
  "target": "<targetNodeId>",
  "sourceHandle": "<handleId>",
  "targetHandle": "<handleId>",
  "data": { ... }
}
```

---

## Edge Types

There are **two functional edge categories** in biolab-workflow:

| Type string | Visual style | Used for |
|-------------|-------------|---------|
| `workflowEdge` | Gray/dark arrow (solid) | Control flow between operation/control nodes |
| `labwareEdge` | Colored ribbon | Physical supply from Object nodes or op-to-op material passing |

> Other edge type strings (`sampleFlow`, `reagentFlow`, `labwareFlow`, `dataFlow`, `materialEdge`) exist for legacy/alternate visualization but `labwareEdge` is the standard for all material connections. Use `labwareEdge` for new workflows.

---

## 1. Workflow Flow Edge (`workflowEdge`)

Connects two **Control or Operation** nodes in sequence. Carries execution order, not physical material.

```json
{
  "id": "f-op-centrifuge-op-resuspend",
  "type": "workflowEdge",
  "source": "op-centrifuge",
  "target": "op-resuspend",
  "sourceHandle": "flow-out",
  "targetHandle": "flow-in"
}
```

### Special cases

**`ifElseNode` — two outgoing edges:**
```json
{"id": "f-if-pass",  "type": "workflowEdge", "source": "if-qc-check", "target": "op-next-step",   "sourceHandle": "true",  "targetHandle": "flow-in"}
{"id": "f-if-fail",  "type": "workflowEdge", "source": "if-qc-check", "target": "op-repeat-purif", "sourceHandle": "false", "targetHandle": "flow-in"}
```

**`parallelNode` — N outgoing edges (one per branch):**
```json
{"id": "f-par-0", "type": "workflowEdge", "source": "parallel-qc", "target": "op-lcms",    "sourceHandle": "branch-0", "targetHandle": "flow-in"}
{"id": "f-par-1", "type": "workflowEdge", "source": "parallel-qc", "target": "op-imaging", "sourceHandle": "branch-1", "targetHandle": "flow-in"}
```

### Rules
- ❌ Never connect a `workflowEdge` to/from an Object node (`sampleNode`, `reagentNode`, `labwareNode`, `dataNode`)
- ✅ Every node in the flow chain must have an incoming `workflowEdge` (except `startNode`) and an outgoing one (except `endNode`)

---

## 2. Material / Labware Edge (`labwareEdge`)

Connects an **Object node** (supply) to an **Operation node** (consumer), or passes a named output from one operation to a downstream operation's input.

### 2a. From `sampleNode` → `operationNode`

`sampleNode` has a single output handle `mat-out`.

```json
{
  "id": "e-cells-to-centrifuge",
  "type": "labwareEdge",
  "source": "obj-input-cells",
  "target": "op-centrifuge",
  "sourceHandle": "mat-out",
  "targetHandle": "in-sample",
  "data": {
    "portType": "sample",
    "portLabel": "HEK293T Cells"
  }
}
```

### 2b. From `reagentNode` → `operationNode`

Each item in a `reagentNode` has its own handle `out-{itemId}`.

```json
{
  "id": "e-pbs-to-wash",
  "type": "labwareEdge",
  "source": "obj-wash-reagents",
  "target": "op-wash",
  "sourceHandle": "out-r1",
  "targetHandle": "in-pbs",
  "data": {
    "portType": "reagent",
    "portLabel": "PBS"
  }
}
```

> One edge per item. If 3 items in the reagentNode are used by the same operation → 3 separate edges.

### 2c. From `labwareNode` → `operationNode`

Same as reagentNode — each item has `out-{itemId}`.

```json
{
  "id": "e-plate-to-seed",
  "type": "labwareEdge",
  "source": "obj-plates",
  "target": "op-cell-seeding",
  "sourceHandle": "out-p1",
  "targetHandle": "in-plate",
  "data": {
    "portType": "labware",
    "portLabel": "96-well Cell Culture Plate"
  }
}
```

### 2d. From `dataNode` → `operationNode`

If `dataNode` has no named outputs, use `mat-out`:
```json
{
  "sourceHandle": "mat-out",
  "data": {"portType": "info", "portLabel": "Plate Map"}
}
```

If `dataNode` has named outputs in its `outputs` array, use `out-{outputId}`:
```json
{
  "sourceHandle": "out-layout-data",
  "data": {"portType": "info", "portLabel": "Sample Layout"}
}
```

### 2e. From `operationNode` (output port) → `operationNode` (input port)

Carries the named product of an operation to the next operation that consumes it.

```json
{
  "id": "e-pellet-to-resuspend",
  "type": "labwareEdge",
  "source": "op-centrifuge",
  "target": "op-resuspend",
  "sourceHandle": "out-cell-pellet",
  "targetHandle": "in-pellet",
  "data": {
    "portType": "sample",
    "portLabel": "Cell Pellet"
  }
}
```

- `sourceHandle` must match `"out-" + output.id` where `output.id` is from the source operation's `outputs` array
- `targetHandle` is `"in-" + anyUniqueSlug` — just make it descriptive and unique within the target node

---

## `portType` Values

| Value | Meaning | Typical source |
|-------|---------|--------------|
| `"sample"` | Biological sample (cells, lysate, plates of oligos, RNA…) | `sampleNode`, or op output typed `"sample"` |
| `"reagent"` | Chemical reagent, buffer, enzyme, solution | `reagentNode` |
| `"labware"` | Consumable (plate, tube, tip box, column) | `labwareNode`, or op output typed `"labware"` |
| `"info"` | Data, file, report, plate map | `dataNode`, or op output typed `"info"` |

---

## Handle ID Quick Reference

| Node type | Incoming handles | Outgoing handles |
|-----------|-----------------|-----------------|
| `startNode` | — | `flow-out` |
| `endNode` | `flow-in` | — |
| `operationNode` | `flow-in`, `in-{portId}`* | `flow-out`, `out-{outputId}` |
| `ifElseNode` | `flow-in` | `true`, `false` |
| `loopNode` | `flow-in` | `flow-out` |
| `waitUntilNode` | `flow-in` | `flow-out` |
| `parallelNode` | `flow-in` | `branch-0`, `branch-1`, … |
| `processNode` | `flow-in`, `in-{portId}`* | `flow-out` |
| `notificationNode` | `flow-in` | `flow-out` |
| `sampleNode` | — | `mat-out` |
| `reagentNode` | — | `out-{itemId}` per item |
| `labwareNode` | — | `out-{itemId}` per item |
| `dataNode` | — | `mat-out` or `out-{outputId}` |

\* `in-{portId}` is defined by the incoming edge, not pre-declared on the node.

---

## Edge ID Conventions

| Edge category | Prefix | Example |
|---------------|--------|---------|
| Workflow flow | `f-` | `f-op-centrifuge-op-resuspend` |
| Object → Op supply | `e-` | `e-cells-to-centrifuge` |
| Op → Op material | `m-` | `m-pellet-to-resuspend` |

Keep IDs unique across the workflow. Duplicate IDs will cause silent rendering bugs.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `workflowEdge` connected to a `sampleNode` | Remove it — Object nodes never participate in flow |
| `sourceHandle: "flow-out"` on a `labwareEdge` | Change to `out-{outputId}` or `mat-out` |
| Missing `data.portType` on a `labwareEdge` | Add `"data": {"portType": "sample", "portLabel": "..."}` |
| `sourceHandle: "out-r1"` but `r1` not in `items` | Add `{"id": "r1", "name": "..."}` to reagentNode's items, or fix the id |
| `ifElseNode` with only one outgoing edge | Add the second branch edge (`"true"` or `"false"`) |
| `duration` as plain string `"30 min"` | Must be `{"value": "30", "unit": "min"}` |
