# BioLab Workflow Designer — 项目记忆文档

> 此文件供 GitHub Copilot 在后续对话中调用，以恢复项目上下文。
> **最后更新：2026-05-09（本次会话结束）**

---

## 项目目标

面向生物实验室的 **Lab Automation Workflow 可视化设计工具**，帮助科学家和供应商用拖拽方式设计自动化实验流程，支持操作步骤、逻辑控制、数据管理。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | 框架 |
| Vite | 8 | 构建工具 |
| Tailwind CSS | 4 | 样式 |
| @xyflow/react | 12.10.2 | Canvas 核心 |
| Zustand | 5 | 状态管理（5 stores）|
| lucide-react | — | 图标库 |
| dagre | — | 自动布局 |
| papaparse, uuid | — | CSV 解析、ID 生成 |

## 开发环境
- GitHub Codespaces：`npm run dev` → 端口 5173（可能递增）
- 项目根目录：`/workspaces/biolab-workflow`

---

## 设计规范（Microsoft Fluent UI 风格）

| 属性 | 值 |
|---|---|
| 字体 | Segoe UI（全局设置于 index.css）|
| 主色 | #CC0000（红）|
| 圆角 | borderRadius: 4（所有 UI 元素）|
| 按钮高 | h-8（32px）|
| Handle 尺寸 | !w-4 !h-4（16px，所有节点）|

---

## 目录结构

```
/workspaces/biolab-workflow/
├── docs/       — 本文件、ARCHITECTURE.md、SKILL.md、SETUP_GUIDE.md
├── scripts/    — add-website-fields.mjs / fetch-product-info.mjs
│   └── archive/ — setup-phase1~7.sh（历史初始化脚本归档）
├── src/
│   ├── components/
│   │   ├── canvas/    — WorkflowCanvas.jsx, SelectionToolbar.jsx
│   │   ├── edges/     — SampleFlowEdge, MaterialFlowEdge, InfoFlowEdge + index.js
│   │   ├── layout/    — TopBar, LeftPanel, RightPanel
│   │   ├── library/   — LibraryModal, DevicePicker, SamplePicker
│   │   ├── nodes/     — 10 node components + index.js
│   │   └── panels/    — GlobalVariablesPanel
│   ├── constants/     — nodeTypes.js, edgeTypes.js
│   ├── data/          — defaultLibraries/ (JSON)
│   ├── pages/         — CoverPage.jsx
│   ├── stores/        — appStore, workflowStore, libraryStore, variableStore, uiStore
│   └── utils/         — autoLayout.js, grouping.js, importExport.js, nodeFactory.js
```

---

## 开发阶段

| 阶段 | 状态 | 主要内容 |
|------|------|---------|
| Phase 1 | ✅ | 三栏布局 + Start/End/Operation + 拖拽连线 + JSON 导入导出 |
| Phase 2 | ✅ | 全部逻辑节点 + 三种 Edge + Auto Layout |
| Phase 3 | ✅ | Library 管理（Sample/Consumable/Reagent/Device）|
| Phase 4 | ✅ | Undo/Redo + 全局变量面板 |
| Phase 5 | ✅ | Cover Page + 多 workflow 管理 |
| Phase 5b | ✅ | #CC0000 红色主题 |
| Phase 6 | ✅ | Experiment Group 虚线框 + 框选分组 |
| Phase 7 | ✅ | 删除/Copy/Paste（含键盘快捷键）|
| 本次会话 | ✅ | Fluent UI 样式全面更新、Edge 渐变条带、新节点 DataNode/NotificationNode、元素分类 |

---

## Node Types（10个）

| type | 颜色 | category | 文件 | 说明 |
|---|---|---|---|---|
| startNode | #99BB44 | flow | StartNode.jsx | 入口 |
| endNode | #CC0000 | flow | EndNode.jsx | 出口 |
| ifElseNode | #CCCC66 | logic | IfElseNode.jsx | 条件分支，true/false 两个输出 |
| loopNode | #CC99CC | logic | LoopNode.jsx | 固定次数或条件循环 |
| waitUntilNode | #66CCFF | logic | WaitUntilNode.jsx | 等待条件 |
| operationNode | #FF9933 | lab | OperationNode.jsx | 操作步骤：设备 + 样本 + 时长 |
| setVariableNode | #336699 | data | SetVariableNode.jsx | 赋值变量 |
| dataNode | #009688 | data | DataNode.jsx | 文件导入导出 + key-value |
| notificationNode | #7C3AED | data | NotificationNode.jsx | 发送通知 |
| experimentNode | #CC0000 | grouping | ExperimentNode.jsx | 分组容器，zIndex=-1 |

**LeftPanel 分类渲染**（`category` 字段驱动）：Flow / Logic / Lab / Data。  
Experiment 单独放 Grouping 区。

---

## DataNode 数据结构

```js
{
  label, description,
  kvPairs: [{ id, key, value }],
  imports: [],   // 预留文件上传接口
  exports: {
    metadata: { enabled: false, variables: [] },  // variables = 全局变量名数组
    rawData:  { enabled: false, variables: [] },
  }
}
```

## NotificationNode 数据结构

```js
{ label, message, channel: 'email'|'slack'|'webhook', trigger: 'always'|'on-error' }
```

---

## Edge 设计（渐变条带）

三种 Edge 均用 `useRef + getPointAtLength` 在路径末端动态绘制 3 个跟随切线的 `>` 箭头。

```
linearGradient: userSpaceOnUse, opacity 0(source) → 1(target)
strokeWidth: 10px(normal) / 15px(selected)
Arrow: <polyline points="-2.5,-5 0,0 -2.5,5"> white, sw=2, gap=5px
```

| Edge | 颜色 | 样式 |
|---|---|---|
| sampleFlow | #336699 | 实线 |
| materialFlow | #FF6600 | 实线 |
| infoFlow | #888888 | 虚线 20/6 |

---

## 核心 Store 结构

| Store | 职责 |
|---|---|
| appStore | 多 workflow 列表、activeWorkflowId、全局变量 |
| workflowStore | nodes/edges、undo/redo（50步）、clipboard |
| libraryStore | 4类资源（samples/consumables/reagents/devices）|
| variableStore | workflow 级变量 |
| uiStore | selectedNodeId/EdgeId、activeEdgeType |

---

## 关键实现备注

- **Experiment Group**：type=`experimentNode`，zIndex=-1，子节点用 `parentId` + `extent='parent'`
- **Auto Layout 两遍**：先排 experiment 内部，再排顶层
- **Copy/Paste**：所有 id 重新 uuidv4，offset +40px
- **变量分级**：appStore.globalVariables（跨 workflow）vs variableStore.variables（当前 workflow）

---

## 待做 / 设计待定

- **Operation 操作类型字段**：暂不独立，应从所选 device 的属性中派生/过滤
  → 未来实现：device 数据加 `operationType` 字段，选择 device 后自动带出
- DataNode 文件上传/下载接口（UI 占位已预留）
- Workflow 验证（断开节点、缺失 End 等）
- 孔板可视化（96/384 well plate）
- 样本/物料流路径高亮
- Sub-Workflow / Parallel Fork 等高级节点（待评估）

