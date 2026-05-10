# Node Schema Reference
**biolab-workflow v1.0**

All nodes share a base structure:
```json
{
  "id": "<unique string>",
  "type": "<nodeType>",
  "position": {"x": 0, "y": 0},
  "data": { ... }
}
```
`position` can always be `{"x": 0, "y": 0}` — the tool's Auto Layout will arrange nodes automatically.

---

## Node Categories

### Category A — Control & Operation nodes
These nodes participate in the **workflow flow** (connected by `workflowEdge`).
All have a `flow-in` target handle (left side) and `flow-out` source handle (right side), except where noted.

---

### `startNode`
Entry point of a workflow. **No `flow-in`**, only `flow-out`.
```json
{
  "id": "start-1",
  "type": "startNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Start"
  }
}
```

---

### `endNode`
Exit point. **No `flow-out`**, only `flow-in`.
```json
{
  "id": "end-1",
  "type": "endNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "End"
  }
}
```

---

### `operationNode`
The core node type representing a physical lab step performed by a device or operator.

```json
{
  "id": "op-centrifuge",
  "type": "operationNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Centrifugation",
    "device": {"id": "d3", "name": "Eppendorf 5810R"},
    "duration": {"value": "5", "unit": "min"},
    "description": "Spin cells at 300g to form pellet",
    "notes": "Keep samples on ice before and after",
    "inputs": [],
    "outputs": [
      {"id": "cell-pellet", "label": "Cell Pellet",    "type": "sample"},
      {"id": "supernatant", "label": "Supernatant",    "type": "sample"},
      {"id": "spin-report", "label": "Run Report",     "type": "info"}
    ]
  }
}
```

**Field reference:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `label` | string | ✅ | Short step name |
| `device` | `{id, name}` or `null` | ✅ | Use `null` if manual. Use `{"id": "generic", "name": "Liquid Handler"}` for generic. Match `devices.json` for specific instruments. |
| `duration` | `{value: string, unit: string}` | ✅ | `unit` ∈ `"sec"`, `"min"`, `"hr"`, `"day"`. Use `""` for unknown value. |
| `description` | string | ✅ | One sentence summary |
| `notes` | string | — | Optional extra detail |
| `inputs` | `[]` | — | Leave as empty array; inputs are implied by incoming edges |
| `outputs` | array of `{id, label, type}` | ✅ | Every named output a downstream node may consume. `type` ∈ `"sample"`, `"labware"`, `"info"` |

---

### `ifElseNode`
Decision / quality gate. Has **two source handles**: `"true"` (top-right) and `"false"` (bottom-right). Both must have outgoing workflow edges.

```json
{
  "id": "if-qc-pass",
  "type": "ifElseNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "QC Pass?",
    "condition": "purity ≥ 85% AND yield ≥ 50 OD",
    "trueLabel": "Pass",
    "falseLabel": "Fail"
  }
}
```

**Workflow edges from this node:**
```json
{"sourceHandle": "true",  "targetHandle": "flow-in", ...}
{"sourceHandle": "false", "targetHandle": "flow-in", ...}
```

---

### `loopNode`
Repeating sequence. Has the standard `flow-in` (left) → `flow-out` (right).

```json
{
  "id": "loop-passage",
  "type": "loopNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Cell Passage Loop",
    "loopType": "count",
    "count": 3
  }
}
```
Or condition-based:
```json
{
  "data": {
    "label": "Expansion Loop",
    "loopType": "condition",
    "condition": "confluence < 80%"
  }
}
```

| `loopType` | Additional field | Meaning |
|------------|-----------------|---------|
| `"count"` | `count: N` | Repeat exactly N times |
| `"condition"` | `condition: "expr"` | Repeat while condition is true |

---

### `waitUntilNode`
Pause and hold until a condition is met. Standard `flow-in` → `flow-out`.

```json
{
  "id": "wait-confluency",
  "type": "waitUntilNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Wait for Confluency",
    "condition": "confluence ≥ 70%"
  }
}
```

---

### `parallelNode`
Fork into N concurrent branches. Has **one `flow-in`** (left) and **N `branch-{i}` source handles** (right, one per branch row).

```json
{
  "id": "parallel-qc",
  "type": "parallelNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Parallel QC",
    "branches": 3
  }
}
```

**Workflow edges from this node** (one per branch):
```json
{"sourceHandle": "branch-0", "targetHandle": "flow-in", ...}
{"sourceHandle": "branch-1", "targetHandle": "flow-in", ...}
{"sourceHandle": "branch-2", "targetHandle": "flow-in", ...}
```

---

### `processNode`
Handles data export, variable assignment, data transformation, or webhook calls. Has standard `flow-in` → `flow-out`.

```json
{
  "id": "proc-export-report",
  "type": "processNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Export QC Report",
    "mode": "export",
    "destination": "LIMS / CSV",
    "inputs": [
      {"id": "qc-data", "label": "QC Report"}
    ]
  }
}
```

`mode` options: `"export"`, `"variable"`, `"transform"`, `"webhook"`

---

### `notificationNode`
Send alert/notification. Standard `flow-in` → `flow-out`.

```json
{
  "id": "notify-operator",
  "type": "notificationNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Notify Operator",
    "channel": "email",
    "trigger": "always",
    "message": "Plates ready for imaging"
  }
}
```

---

## Category B — Object nodes
These nodes represent physical or digital **inputs** to operations. They have **no workflow flow handles** and are connected only by `labwareEdge` (material/data edges). They always connect as *source* (arrow goes _from_ them _to_ an operation).

---

### `sampleNode`
A biological sample (cells, tissue, oligo plate, lysate…).

```json
{
  "id": "obj-input-cells",
  "type": "sampleNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "HEK293T Cells",
    "containerType": "cryo_tube"
  }
}
```

- `containerType`: free text. Examples: `"cryo_tube"`, `"flask"`, `"384_well_plate"`, `"96_well_plate"`, `"eppendorf_tube"`, `"pellet"`
- Edge from this node always uses `sourceHandle: "mat-out"`

---

### `reagentNode`
A group of reagents/buffers/solutions. Each component is an `item`.

```json
{
  "id": "obj-lysis-reagents",
  "type": "reagentNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Lysis Reagents",
    "items": [
      {"id": "r1", "name": "Lysis Buffer"},
      {"id": "r2", "name": "Protease Inhibitor"},
      {"id": "r3", "name": "PMSF"}
    ]
  }
}
```

- Each item gets its own edge with `sourceHandle: "out-{itemId}"`
- Group thematically: don't create one node per reagent; combine related reagents into one node

---

### `labwareNode`
Consumables: plates, tubes, tips, columns, etc.

```json
{
  "id": "obj-plates",
  "type": "labwareNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Assay Plates",
    "items": [
      {"id": "p1", name": "96-well Cell Culture Plate"},
      {"id": "p2", "name": "Reservoir"}
    ]
  }
}
```

- Each item gets its own edge with `sourceHandle: "out-{itemId}"`

---

### `dataNode`
Digital data files: plate maps, sequence lists, design files, reports.

```json
{
  "id": "obj-plate-map",
  "type": "dataNode",
  "position": {"x": 0, "y": 0},
  "data": {
    "label": "Plate Map",
    "files": [
      {"id": "f1", "name": "Plate Map.csv"}
    ],
    "kvPairs": [
      {"id": "k1", "key": "version", "value": "v1"}
    ]
  }
}
```

- Preferred model: each file in `data.files` gets its own output handle `out-{fileId}`.
- Backward compatibility: legacy workflows may still use `data.outputs`; new workflows should use `data.files`.
- `outputs` array can be populated for named outputs (same structure as operationNode outputs)

---

## Category C — Grouping (optional)

### `experimentNode`
A visual frame/container to group related nodes. Does not affect logic.

```json
{
  "id": "exp-oligo-group",
  "type": "experimentNode",
  "position": {"x": 0, "y": 0},
  "style": {"width": 600, "height": 400},
  "data": {
    "label": "Oligo Synthesis Block",
    "description": ""
  },
  "zIndex": -1
}
```

Child nodes reference the group via `"parentId": "exp-oligo-group"` and `"extent": "parent"`.
> **For AI generation: skip `experimentNode` unless specifically requested. Auto-layout will arrange nodes cleanly without grouping.**
