# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows semantic-style release notes.

## [Unreleased]

### Added
- Added browser local persistence for app state (workflows, global variables, active workflow, backup metadata) via localStorage.
- Added backup reminder metadata and workflow fingerprint tracking in app store.
- Added Cover Page backup reminder banner with quick actions: export now and remind later.
- Added drag-time receiver highlight overlays for Operation and Process input zones.
- Added initial test infrastructure with Vitest + jsdom.
- Added baseline app store tests for workflow import and backup reminder lifecycle.
- Added a new public-safe demo workflow: Echo cherry-pick siRNA -> Fluent 1080 culture/treatment -> Cytation imaging -> Cytomat 2 C4 overnight -> lysis + HTRF -> EnVision readout.
- Added DataNode file-based examples to built-in workflows:
  - Oligo workflow Data nodes now include file entries and file-handle-based edges.
  - Cell workflow includes new Data nodes for seeding layout and assay metadata.

### Changed
- Refactored DataNode semantics to noun-like file container:
  - Data files are represented as file items with one output handle per file.
  - Removed process-like upload/export controls from DataNode property editor.
- Updated edge label resolution to prefer data.files and fallback to legacy data.outputs.
- Updated default dataNode schema to include files and keep outputs for compatibility.
- Improved connection UX:
  - Replaced tiny visible drop dots with larger hidden receiver zones.
  - Receiver zones now align with input area dimensions.
  - Highlight is shown only during active drag from material/info handles.
- Updated node palette description for Data node to match current semantics.
- Began node-type-based RightPanel split:
  - Extracted Process node editor into dedicated component.
  - Extracted Data node editor into dedicated component.
  - Extracted Operation node editor into dedicated component.
  - Extracted Sample/Reagent/Labware object editors into dedicated components.

### Fixed
- Fixed inability to drag object outputs (Data/Reagent/Labware) reliably into downstream element inputs.
- Fixed Process node input registration by auto-creating data.inputs entries when connecting to generated in-* handles.
- Fixed DataNode connection labels for file handles in canvas connection logic.

### Docs
- Updated README to reflect current node/edge model, persistence behavior, and backup flow.
- Updated workflow-generator docs to align with DataNode files model:
  - SKILL reference
  - Node schema reference
  - Edge schema reference
- Added project CHANGELOG for ongoing release notes.

### Removed
- Removed unused legacy workflow source file `src/data/bioyongWorkflow.js`.
- Removed legacy confidential built-in workflow files from default datasets.

### Security
- Sanitized persisted/imported workflow list to filter confidential workflow identifiers/names (including bac-expression patterns) from default-visible datasets.

## [2026-05-10]

### Summary
- Completed DataNode semantic migration to file-item model.
- Completed connection UX redesign for cleaner and more reliable input receiving.
- Completed local persistence and backup reminder workflow.
- Updated built-in workflows and documentation to stay consistent with runtime behavior.
