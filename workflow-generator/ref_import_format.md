# Import Format Reference
**biolab-workflow v1.0** — Single Workflow Import

This document describes the **exact JSON structure** required by `importWorkflowJSON()` in `appStore.js`, and provides a guide for converting external recipe formats (e.g. Innovel/XL-001) into this format.

---

## 1. Required JSON Structure

```json
{
  "version": "1.0",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "metadata": {
    "name": "Workflow Display Name",
    "description": "Optional description",
    "createdAt": "2026-05-11T07:47:20.326Z",
    "modifiedAt": "2026-05-11T07:47:20.326Z",
    "tags": []
  },
  "nodes": [ ... ],
  "edges": [ ... ],
  "workflowVariables": [],
  "librarySnapshot": {}
}
```

### Field Rules

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `version` | ✅ | `"1.0"` | Literal string |
| `id` | ✅* | UUID string | *Without it import still works but loses de-duplication. Generate with `uuidv4()` or `python -c "import uuid; print(uuid.uuid4())"`. |
| `metadata.name` | ✅ | string | Shown in workflow list |
| `metadata.createdAt` | ✅ | ISO 8601 | `"2026-05-11T07:47:20.326Z"` |
| `metadata.modifiedAt` | ✅ | ISO 8601 | Same as above on first creation |
| `metadata.tags` | ✅ | array | Can be `[]` |
| `nodes` | ✅ | array | Must be truthy (non-null, non-empty) |
| `edges` | ✅ | array | Must be truthy; can be `[]` but must exist |
| `workflowVariables` | — | array | Workflow-scoped vars. **Must be `workflowVariables`, NOT `globalVariables`** |
| `librarySnapshot` | — | object | Can be `{}` |

### ⚠️ Common Key Mistakes

| Wrong key | Correct key | Effect of mistake |
|-----------|-------------|-------------------|
| `globalVariables` | `workflowVariables` | Variables silently ignored on import |
| *(missing `id`)* | `id: "<UUID>"` | Workflow can't be identified for updates |
| `viewport` at root | *(omit)* | Harmless but unnecessary |
| `metadata.source` | *(omit)* | Harmless but unnecessary |

---

## 2. Converting External Recipe JSON (Innovel / XL-001 Format)

### 2.1 Understand the source structure

External recipe JSON from Innovel / XL-001 platform typically contains:

| Source key | Description | Maps to |
|------------|-------------|---------|
| `recipeName` | Workflow name | `metadata.name` |
| `recipeCode` | Recipe identifier | `metadata.description` or note |
| `stages` | Ordered list of top-level stages | Backbone of `operationNode` chain |
| `recipeActions` | Flat list (~1000s) of low-level atomic actions | Summarized into `operationNode.description/notes` |
| `resourceMaterials` | Deck materials: plates, reservoirs, tip boxes | `reagentNode` / `labwareNode` / `sampleNode` items |
| `actionMaterials` | Temporary action-specific labware | Additional items in existing Object nodes |
| `globalVariables` | Runtime variables with types and defaults | `workflowVariables` array (rename key!) |
| `sequenceList` | Liquid-handling sequences (well position info) | Not converted; too low-level |
| `configValues` | Parameter values per action | Not converted; use for `description`/`notes` context |

### 2.2 Stage → Node mapping

Read `stages` array (14 stages in the Genetics example). For each stage:

| Stage pattern | biolab-workflow node |
|---------------|---------------------|
| Active instrument step (pipetting, centrifuge, PCR…) | `operationNode` |
| Unattended timed incubation (overnight culture, wait) | `waitUntilNode` |
| Stage whose `actionCode` contains loop (`forstart`) | `loopNode` |
| Stage with branching `If` that leads to different terminals | `ifElseNode` |
| Stage with `parallel` child groups | `parallelNode` → merge back |
| QC measurement (Qubit, ELISA…) + downstream branch | `operationNode` + `ifElseNode` |

### 2.3 Resource material → Object node mapping

Read `resourceMaterials`. Group by `itemCategory` and `nickName`:

| `itemCategory` | `subItemCategory` | `nickName` pattern | Object node type |
|----------------|------------------|--------------------|-----------------|
| `COMBINE` | `Plate` | `"96孔PCR板-…"`, `"96DWP-…"` | `reagentNode` (if reagents) or `sampleNode` (if biological) |
| `COMBINE` | `Reservoir` | `"300mL Tank-…"` | `reagentNode` (one item per reservoir) |
| `COMBINE` | `Plate` | DNA / cell samples | `sampleNode` |
| `PLATE` | `PLATE` | Raw plates (blank) | `labwareNode` item |
| `LID` | `LID` | Plate lids | `labwareNode` item |
| `CITEM` | `RESERVOIR` | Reservoir-style consumables | `labwareNode` item |

**Strategy:** merge related reagents into one `reagentNode` per functional group (e.g., all Miniprep buffers into one node). Aim for 4–8 Object nodes total per workflow.

### 2.4 Global variable → workflowVariables mapping

Source `globalVariables` entries look like:
```json
{"variableName": "sample_count", "variableType": "Number", "defaultValue": "96", "description": "..."}
```

Map to:
```json
{"id": "var-<slug>", "name": "sample_count", "type": "number", "defaultValue": "96", "description": "..."}
```

Select only variables that are meaningful at the workflow level (e.g. `sample_count`, `run_id`). Skip internal robot control variables (`start_idx`, `ForNum`, etc.).

### 2.5 Build the flow chain

1. Chain all `operationNode` and control nodes with `workflowEdge`.
2. `startNode` → first operation → … → last operation → `endNode`.
3. For QC branch: last measurement op → `ifElseNode` → pass branch → … → `endNode("完成")` AND fail branch → `endNode("终止")`.
4. Add material edges: Object node → operation for each input used by that stage.
5. Add inter-op edges: op output → next op input using `labwareEdge` with `portType: "sample"/"info"`.

### 2.6 Python generation template

```python
import json, uuid
from datetime import datetime, timezone

now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

workflow = {
    "version": "1.0",
    "id": str(uuid.uuid4()),       # ← required
    "metadata": {
        "name": recipe_data["recipeName"],
        "description": f"Converted from recipe {recipe_data['recipeCode']}",
        "createdAt": now,
        "modifiedAt": now,
        "tags": []
    },
    "nodes": nodes,                 # list of node dicts
    "edges": edges,                 # list of edge dicts
    "workflowVariables": variables, # ← NOT "globalVariables"
    "librarySnapshot": {}
}

with open("output-workflow.json", "w", encoding="utf-8") as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)
```

---

## 3. Validation Before Import

Run this Node.js snippet to simulate what `importWorkflowJSON` checks:

```js
const data = JSON.parse(fs.readFileSync("output-workflow.json", "utf-8"));
const fail = !data.nodes || !data.edges;
console.log("Will import fail?", fail);            // must be false
console.log("nodes:", data.nodes.length);
console.log("edges:", data.edges.length);
console.log("id present:", !!data.id);
console.log("workflowVariables:", data.workflowVariables?.length ?? "MISSING");
```

Or with Python:
```python
import json
with open("output-workflow.json") as f:
    d = json.load(f)
assert d.get("nodes") and d.get("edges"), "Missing nodes/edges"
assert d.get("id"), "Missing id"
assert "workflowVariables" in d, "Use workflowVariables, not globalVariables"
print(f"OK: {len(d['nodes'])} nodes, {len(d['edges'])} edges")
```

---

## 4. Real-World Conversion Result (Reference)

**Source:** Innovel XL-001 recipe `"动态-1-1-Genetics全流程"` (recipeCode: 20260511152711)  
**Output:** `temp/1-1-workflow.json`

| Metric | Value |
|--------|-------|
| Source stages | 14 |
| Source recipeActions | ~1,516 |
| Source resourceMaterials | 48 |
| Source globalVariables | 78 |
| Output nodes | 29 |
| Output edges | 60 |
| Output workflowVariables | 5 (key runtime vars only) |
| File size | ~38 KB |

Node type breakdown:
- `startNode` ×1, `endNode` ×2 (pass + fail)
- `operationNode` ×12 (one per active stage)
- `waitUntilNode` ×2 (overnight incubations)
- `ifElseNode` ×1 (Qubit QC gate)
- `sampleNode` ×3, `reagentNode` ×5, `labwareNode` ×1, `dataNode` ×1

**Fixes required after initial generation:**
1. Added `"id": "<UUID>"` (was missing → no error but needed for de-duplication)
2. Renamed `globalVariables` → `workflowVariables`
3. Removed `viewport` from root
4. Removed non-standard `metadata.source` key
5. Added `metadata.tags: []`
