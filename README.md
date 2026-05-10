# BioLab Workflow Designer

面向生物实验室的 Lab Automation Workflow 可视化设计工具。

## 功能特性

- 多 Workflow 管理（Cover Page + 卡片式列表）
- 节点体系：Start / End / Operation / Process / If·Else / Loop / Wait Until / Set Variable / Parallel / Notification / Experiment Group
- Object 节点：Sample / Reagent / Labware / Data（DataNode 为文件集合，单文件单输出句柄）
- 连线语义：workflowEdge（流程控制） + labwareEdge（sample/reagent/labware/info 物料或信息流）
- Library 管理（Sample / Consumable / Reagent / Device，支持 CSV/JSON 导入导出）
- 变量分级（全局变量 + Workflow 级变量）
- Auto Layout（Dagre，支持嵌套 Experiment Group）
- Undo / Redo（Ctrl+Z / Ctrl+Y，最多 50 步）
- Copy / Paste（Ctrl+C / Ctrl+V，含属性复制）
- JSON 完整导入导出
- 本地持久化：工作流与全局变量自动保存到浏览器 localStorage
- 自动备份提醒：检测到未备份变更时，在 Cover Page 提示导出全量 JSON

## 快速开始

```bash
npm install
npm run dev
```

打开浏览器访问 **http://localhost:5173**

## 数据保存与备份

- 运行时数据默认保存到浏览器本地存储（域名隔离，不跨用户共享）。
- 导入的 workflow 刷新后不会丢失（同浏览器、同设备、同域名）。
- 建议定期使用 Cover Page 的 Export 导出全量备份 JSON。
- 当检测到未备份变更时，Cover Page 会显示备份提醒条，可一键导出。

## 项目结构

```
biolab-workflow/
├── workflow-generator/  # AI 生成工作流 JSON 的 skill 与 schema 参考
├── src/
│   ├── components/
│   │   ├── canvas/      # WorkflowCanvas、SelectionToolbar
│   │   ├── edges/       # 自定义连线组件
│   │   ├── layout/      # TopBar、LeftPanel、RightPanel
│   │   ├── library/     # LibraryModal、DevicePicker、SamplePicker
│   │   ├── nodes/       # 控制节点 + object 节点组件
│   │   └── panels/      # GlobalVariablesPanel
│   ├── constants/       # nodeTypes、edgeTypes 枚举
│   ├── data/            # 内置工作流与默认库数据
│   ├── pages/           # CoverPage
│   ├── stores/          # Zustand stores（含本地持久化）
│   └── utils/           # autoLayout、importExport、grouping、nodeFactory
├── public/
├── index.html
├── vite.config.js
└── package.json
```

## 文档

详见 workflow-generator 目录：
- workflow-generator/SKILL.md — AI 生成工作流的完整流程规范
- workflow-generator/ref_node_schema.md — 节点 schema 参考
- workflow-generator/ref_edge_schema.md — 连线 schema 参考
- workflow-generator/ref_example_minimal.json — 最小示例

## 技术栈

React 19 · Vite · Tailwind CSS · @xyflow/react · Zustand · Dagre
