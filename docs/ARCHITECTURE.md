# BioLab Workflow Designer — 架构设计文档

> 版本：v0.1 | 日期：2026-05-09

---

## 一、整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    BioLab Workflow Designer                   │
├──────────────┬──────────────────────────────┬───────────────┤
│  Left Panel  │       Canvas (React Flow)     │  Right Panel  │
│  (Library +  │                               │  (Properties) │
│   Elements)  │  ┌───────┐    ┌──────────┐   │               │
│              │  │ Start │───▶│Operation │   │  Node 属性    │
│  📦 Samples  │  └───────┘    └──────────┘   │  编辑面板     │
│  🧪 Reagents │                    │          │               │
│  🔧 Devices  │              ┌─────▼────┐    │               │
│  📋 Consum.  │              │  If/Else │    │               │
│              │              └──────────┘    │               │
│  ── Elements ─  │                               │               │
│  [Start]     │                               │               │
│  [End]       │                               │               │
│  [Operation] │                               │               │
│  [If/Else]   │                               │               │
│  [Loop]      │                               │               │
└──────────────┴──────────────────────────────┴───────────────┘
│                      Bottom Toolbar                           │
│  [Export JSON] [Import JSON] [Auto Layout] [Zoom] [Clear]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、目录结构（完整）

```
biolab-workflow/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx                    # 应用入口
│   ├── App.jsx                     # 根组件，布局组装
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── LeftPanel.jsx       # 左侧面板（library + element palette）
│   │   │   ├── RightPanel.jsx      # 右侧属性面板
│   │   │   └── TopBar.jsx          # 顶部工具栏（文件名、保存等）
│   │   │
│   │   ├── nodes/                  # 节点组件（每种一个文件）
│   │   │   ├── index.js            # 统一导出 nodeTypes 对象
│   │   │   ├── StartNode.jsx
│   │   │   ├── EndNode.jsx
│   │   │   ├── OperationNode.jsx
│   │   │   ├── IfElseNode.jsx
│   │   │   ├── WaitUntilNode.jsx
│   │   │   ├── LoopNode.jsx
│   │   │   └── SetVariableNode.jsx
│   │   │
│   │   ├── edges/                  # 自定义箭头类型
│   │   │   ├── index.js            # 统一导出 edgeTypes 对象
│   │   │   ├── SampleFlowEdge.jsx  # 样本流（蓝色实线）
│   │   │   ├── MaterialFlowEdge.jsx# 物料流（橙色实线）
│   │   │   └── InfoFlowEdge.jsx    # 信息流（灰色虚线）
│   │   │
│   │   ├── panels/
│   │   │   ├── ElementPalette.jsx  # 可拖拽的节点模板列表
│   │   │   ├── LibraryPanel.jsx    # Library 浏览/管理
│   │   │   ├── NodeProperties.jsx  # 选中节点的属性编辑
│   │   │   └── EdgeTypeSelector.jsx# 连线类型选择器
│   │   │
│   │   ├── library/
│   │   │   ├── LibraryManager.jsx  # Library 完整管理界面
│   │   │   ├── SampleLibrary.jsx
│   │   │   ├── ConsumableLibrary.jsx
│   │   │   ├── ReagentLibrary.jsx
│   │   │   └── DeviceLibrary.jsx
│   │   │
│   │   └── canvas/
│   │       ├── WorkflowCanvas.jsx  # React Flow 主画布
│   │       └── CanvasControls.jsx  # 缩放、fit view 等控件
│   │
│   ├── stores/                     # Zustand 状态管理
│   │   ├── workflowStore.js        # nodes, edges, workflow 元数据
│   │   ├── libraryStore.js         # 所有 library 数据
│   │   └── uiStore.js              # UI 状态（选中节点、面板开关等）
│   │
│   ├── utils/
│   │   ├── importExport.js         # JSON/CSV 导入导出逻辑
│   │   ├── autoLayout.js           # dagre 自动布局
│   │   ├── nodeFactory.js          # 创建新节点的工厂函数
│   │   └── validation.js           # workflow 验证（循环检测等）
│   │
│   ├── constants/
│   │   ├── nodeTypes.js            # 节点类型枚举和默认数据
│   │   ├── edgeTypes.js            # 箭头类型枚举
│   │   └── librarySchema.js        # library 数据结构定义
│   │
│   └── data/
│       └── defaultLibraries/
│           ├── samples.json
│           ├── consumables.json
│           ├── reagents.json
│           └── devices.json
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

---

## 三、数据结构规范

### 3.1 Node 数据结构（React Flow 标准 + 扩展）

```javascript
// 通用节点基础（所有节点共用）
{
  id: "node_uuid",
  type: "operation",          // startNode | endNode | operationNode | ifElseNode | loopNode | waitUntilNode | setVariableNode
  position: { x: 100, y: 200 },
  data: {
    label: "显示名称",
    // 以下为各类型特有字段 ↓
  }
}

// Operation 节点特有 data
{
  label: "Cell Seeding",
  device: { id: "", name: "", type: "" },      // 来自 deviceLibrary
  sample: { id: "", name: "", type: "" },       // 来自 sampleLibrary
  consumables: [],                              // 来自 consumableLibrary
  reagents: [],                                 // 来自 reagentLibrary
  duration: { value: 0, unit: "min" },
  description: "",
  volume: null,                                 // 将来 Phase 5 使用
  plateLayout: null                             // 将来 Phase 5 使用
}

// IfElse 节点特有 data
{
  label: "Check OD",
  condition: "",           // 条件表达式字符串
  trueLabel: "Yes",
  falseLabel: "No"
}

// Loop 节点特有 data
{
  label: "Repeat 3x",
  loopType: "count" | "condition",
  count: 3,
  condition: ""
}

// SetVariable 节点特有 data
{
  label: "Set Vol",
  variableName: "",
  expression: ""
}
```

### 3.2 Edge 数据结构

```javascript
{
  id: "edge_uuid",
  source: "node_id",
  target: "node_id",
  sourceHandle: "output" | "true" | "false" | "loop_out",
  targetHandle: "input",
  type: "sampleFlow" | "materialFlow" | "infoFlow",
  data: {
    label: "",
    flowType: "sampleFlow"  // 冗余存储，便于样式判断
  }
}
```

### 3.3 Library Item 数据结构

```javascript
// Sample
{ id, name, type, species, description, tags: [], customFields: {} }

// Consumable
{ id, name, category, format, vendor, catalogNumber, description, tags: [] }

// Reagent
{ id, name, concentration, unit, vendor, catalogNumber, storageCondition, description }

// Device
{ id, name, category, model, vendor, capacity, headType, description }
```

### 3.4 Workflow 导出 JSON 格式

```javascript
{
  "version": "1.0",
  "metadata": {
    "name": "My Workflow",
    "description": "",
    "author": "",
    "createdAt": "ISO8601",
    "modifiedAt": "ISO8601",
    "tags": []
  },
  "nodes": [...],           // React Flow nodes 完整数组
  "edges": [...],           // React Flow edges 完整数组
  "viewport": { x, y, zoom },
  "globalVariables": [...],
  "librarySnapshot": {      // 工作流使用到的 library 项目快照
    "samples": [...],
    "consumables": [...],
    "reagents": [...],
    "devices": [...]
  }
}
```

---

## 四、关键模块接口规范

### 4.1 nodeFactory.js

```javascript
// 输入：节点类型字符串 + 位置
// 输出：符合规范的新节点对象
createNode(type: string, position: {x, y}): Node
```

### 4.2 importExport.js

```javascript
exportWorkflowToJSON(workflowStore): string   // 返回 JSON 字符串
importWorkflowFromJSON(jsonString): WorkflowData  // 返回 workflow 状态
exportLibraryToCSV(libraryType, items): string
importLibraryFromCSV(libraryType, csvString): LibraryItem[]
importLibraryFromJSON(jsonString): LibraryData
```

### 4.3 autoLayout.js

```javascript
// 输入：当前 nodes 和 edges
// 输出：带有新 position 的 nodes 数组
applyAutoLayout(nodes, edges, direction?: "TB" | "LR"): Node[]
```

---

## 五、开发环境搭建命令

```bash
# 1. 安装 Node.js（见 SETUP_GUIDE.md）

# 2. 创建项目
cd "C:\Users\L132823\OneDrive - Eli Lilly and Company\reference\code\workflow_design"
npm create vite@latest biolab-workflow -- --template react
cd biolab-workflow
npm install

# 3. 安装依赖
npm install @xyflow/react zustand tailwindcss @tailwindcss/vite
npm install papaparse dagre
npm install @radix-ui/react-dialog @radix-ui/react-tabs lucide-react
npm install uuid clsx

# 4. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173
```

---

## 六、分阶段功能清单

### Phase 1（基础框架）
- [ ] 项目初始化（Vite + React）
- [ ] 基础布局（左中右三栏）
- [ ] React Flow 画布集成
- [ ] Start / End / Operation 三种节点
- [ ] 拖拽添加节点到画布
- [ ] 手动连接箭头
- [ ] 基础属性面板（点击节点显示）

### Phase 2（完整节点集 + 箭头类型）
- [ ] IfElse / Loop / WaitUntil / SetVariable 节点
- [ ] 三种箭头类型（样本流/物料流/信息流）
- [ ] 箭头类型选择器
- [ ] 节点碰撞避免

### Phase 3（Library 系统）
- [ ] Sample / Consumable / Reagent / Device 四个 Library
- [ ] Library 管理 UI（增删改查）
- [ ] CSV 导入导出
- [ ] JSON 导入导出
- [ ] Library 与节点关联（Operation 节点选设备/样品）

### Phase 4（全局特性）
- [ ] 全局变量系统
- [ ] Workflow JSON 导出（完整）
- [ ] Workflow JSON 导入（恢复）
- [ ] Dagre 自动布局
- [ ] 撤销/重做（undo/redo）

### Phase 5（高级功能）
- [ ] 孔板可视化（96/384 well plate）
- [ ] 液体转移路径展示
- [ ] 体积计算
- [ ] Throughput 计算
