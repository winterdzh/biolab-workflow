# BioLab Workflow Designer

面向生物实验室的 Lab Automation Workflow 可视化设计工具。

## 功能特性

- 多 Workflow 管理（Cover Page + 卡片式列表）
- 8 种节点类型：Start / End / Operation / If·Else / Loop / Wait Until / Set Variable / Experiment Group
- 3 种连线类型：Sample Flow（蓝）/ Material Flow（橙）/ Info Flow（灰虚线）
- Library 管理（Sample / Consumable / Reagent / Device，支持 CSV/JSON 导入导出）
- 变量分级（全局变量 + Workflow 级变量）
- Auto Layout（Dagre，支持嵌套 Experiment Group）
- Undo / Redo（Ctrl+Z / Ctrl+Y，最多 50 步）
- Copy / Paste（Ctrl+C / Ctrl+V，含属性复制）
- JSON 完整导入导出

## 快速开始

```bash
npm install
npm run dev
```

打开浏览器访问 **http://localhost:5173**

## 项目结构

```
biolab-workflow/
├── docs/               # 项目文档（架构设计、开发记忆、Skill 文件）
├── scripts/            # 各阶段初始化脚本（setup-phase*.sh）
├── src/
│   ├── components/
│   │   ├── canvas/     # WorkflowCanvas、SelectionToolbar
│   │   ├── edges/      # 3 种自定义连线
│   │   ├── layout/     # TopBar、LeftPanel、RightPanel
│   │   ├── library/    # LibraryModal、DevicePicker、SamplePicker
│   │   ├── nodes/      # 8 种节点组件
│   │   └── panels/     # GlobalVariablesPanel
│   ├── constants/      # nodeTypes、edgeTypes 枚举
│   ├── data/           # 默认 Library 数据（JSON）
│   ├── pages/          # CoverPage
│   ├── stores/         # Zustand stores（5 个）
│   └── utils/          # autoLayout、importExport、grouping、nodeFactory
├── public/
├── index.html
├── vite.config.js
└── package.json
```

## 文档

详见 `docs/` 目录：
- `ARCHITECTURE.md` — 完整架构设计与数据结构
- `PROJECT_MEMORY.md` — 开发阶段记录与决策历史
- `SKILL.md` — Copilot 上下文恢复文件
- `SETUP_GUIDE.md` — 本地环境搭建指南

## 技术栈

React 19 · Vite · Tailwind CSS · @xyflow/react · Zustand · Dagre
