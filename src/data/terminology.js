// ─────────────────────────────────────────────────────────────────────────────
// BioLab Workflow — Standard Terminology
// 标准术语表：界面显示英文，括号内为中文对照，供团队内部沟通参考
// ─────────────────────────────────────────────────────────────────────────────

// ── UI Layout  界面布局 ────────────────────────────────────────────────────
//   Menu Bar        菜单栏      顶部功能栏，含保存、撤销、导出等操作
//   Element Library 元件库      左侧面板，拖拽元件和连接类型到画布
//   Canvas          画布        主编辑区，流程图在此绘制
//   Properties Panel属性面板    右侧面板，显示并编辑选中元件的属性
//   Dashboard       主页        封面页，列出所有工作流
//
// ── Workflow Concepts  工作流概念 ─────────────────────────────────────────
//   Workflow        工作流      完整的实验流程图（有向图）
//   Element         元件        画布上的节点（操作、控制逻辑、对象）
//   Connection      连接        两个元件之间的有向箭头（也叫 Edge）
//   Port            端口        元件上的具名连接点（输入或输出）
//   Property        属性        元件的可配置字段，在属性面板中编辑
//   Field           字段/键值   库条目或元件中的 key-value 记录
//   Variable        变量        工作流级命名变量，可跨步骤使用
//   Library         库          可复用的设备、试剂、样本、耗材目录
//
// ── Element Types  元件类型 ───────────────────────────────────────────────
//   Operation       操作        由设备执行的实验步骤（核心元件）
//   Start           开始        工作流入口
//   End             结束        工作流出口
//   If / Else       条件分支    按条件路由流程
//   Loop            循环        重复执行子流程
//   Parallel        并行        分叉为多个同时执行的分支
//   Wait Until      等待        等待条件满足后继续
//   Set Variable    设置变量    为变量赋值
//   Note            注释        非执行的标注或问题
//   Sample          样本        含生物样本的容器，可产生数据输出
//   Reagent         试剂        含试剂/缓冲液的容器
//   Labware         耗材/器具   空容器（微孔板、试管、吸头盒等）
//
// ── Connection Types  连接类型 ───────────────────────────────────────────
//   Workflow Edge   流程连接    默认的控制流箭头（操作 → 操作）
//   Sample Flow     样本流      追踪生物样本的流向
//   Reagent Flow    试剂流      追踪试剂/缓冲液的流向
//   Labware Flow    耗材流      追踪空容器的流向
//   Data Flow       数据流      承载数据或指令的连接（虚线）
//   Port Link       端口链接    对象元件到操作端口的自动连接
//
// ── Object Fields  对象字段/键值 ─────────────────────────────────────────
//   Label           标签        元件或条目的显示名称
//   Container Type  容器类型    样本或试剂的物理容器形式
//   Concentration   浓度        单位体积中的量（如 10 µM）
//   Volume          体积        液体体积（µL / mL / L）
//   Storage Temp    储存温度    所需存储条件
//   Device          设备/仪器   操作元件的执行设备
//   Duration        时长        操作步骤的预计耗时
//   Description     描述        元件的自由文本备注
//   Catalog #       货号        试剂或耗材的供应商货号
// ─────────────────────────────────────────────────────────────────────────────

export const GLOSSARY = [
  {
    id: 'ui-layout',
    category: 'UI Layout',           // 界面布局
    terms: [
      { en: 'Menu Bar',              desc: 'Top bar — workflow name, undo/redo, Library, Auto Layout, and Export actions.' },
      { en: 'Element Library',       desc: 'Left panel — drag elements and connection types onto the Canvas.' },
      { en: 'Canvas',                desc: 'Main editing area where elements and connections are arranged.' },
      { en: 'Properties Panel',      desc: 'Right panel — displays and edits attributes of the selected element.' },
      { en: 'Dashboard',             desc: 'Home page listing all workflows. Navigate here via the Back button.' },
    ],
  },
  {
    id: 'workflow-concepts',
    category: 'Workflow Concepts',   // 工作流概念
    terms: [
      { en: 'Workflow',    desc: 'A complete experimental process represented as a directed graph.' },
      { en: 'Element',     desc: 'Any node placed on the Canvas — operation, control logic, or object.' },
      { en: 'Connection',  desc: 'A directed arrow linking two elements (also called an Edge).' },
      { en: 'Port',        desc: 'A named connection point on an element (input or output).' },
      { en: 'Property',    desc: 'A configurable field of an element, edited in the Properties Panel.' },
      { en: 'Field',       desc: 'A key–value pair recorded in a Library entry or element (e.g. name, concentration).' },
      { en: 'Variable',    desc: 'A named, workflow-scope value (string / number / boolean / list) usable across steps.' },
      { en: 'Library',     desc: 'Managed catalogue of reusable devices, reagents, samples, and labware.' },
    ],
  },
  {
    id: 'element-types',
    category: 'Element Types',       // 元件类型
    terms: [
      { en: 'Operation',    color: '#3b82f6', desc: 'A lab step executed by a device — the core workflow unit.' },
      { en: 'Start',        color: '#FF9933', desc: 'Marks the entry point of the workflow.' },
      { en: 'End',          color: '#FF9933', desc: 'Marks the exit point of the workflow.' },
      { en: 'If / Else',    color: '#FF9933', desc: 'Routes flow along a true or false branch based on a condition.' },
      { en: 'Loop',         color: '#FF9933', desc: 'Repeats enclosed steps a specified number of times.' },
      { en: 'Parallel',     color: '#FF9933', desc: 'Forks flow into simultaneous branches that then rejoin.' },
      { en: 'Wait Until',   color: '#FF9933', desc: 'Pauses execution until a specified condition becomes true.' },
      { en: 'Set Variable', color: '#FF9933', desc: 'Assigns a computed or literal value to a workflow variable.' },
      { en: 'Note',         color: '#FF9933', desc: 'Non-executable annotation, comment, or question on the canvas.' },
      { en: 'Sample',       color: '#3b82f6', desc: 'A biological sample held in a container; can produce data output.' },
      { en: 'Reagent',      color: '#8b5cf6', desc: 'A buffer, solution, or chemical reagent in a container.' },
      { en: 'Labware',      color: '#06b6d4', desc: 'Empty container (plate, tube, tip box) consumed during a workflow.' },
    ],
  },
  {
    id: 'connection-types',
    category: 'Connection Types',    // 连接类型
    terms: [
      { en: 'Workflow Edge',  color: '#64748b', dashed: false, desc: 'Default control-flow connection between operations.' },
      { en: 'Sample Flow',    color: '#3b82f6', dashed: false, desc: 'Tracks the movement of a biological sample.' },
      { en: 'Reagent Flow',   color: '#8b5cf6', dashed: false, desc: 'Tracks the movement of a reagent or buffer.' },
      { en: 'Labware Flow',   color: '#06b6d4', dashed: false, desc: 'Tracks the movement of empty labware.' },
      { en: 'Data Flow',      color: '#009688', dashed: true,  desc: 'Carries data or instructions between steps (dashed line).' },
      { en: 'Port Link',      color: '#94a3b8', dashed: false, desc: 'Auto-created link from an Object element to an operation port.' },
    ],
  },
  {
    id: 'object-fields',
    category: 'Object Fields',       // 对象字段/键值
    terms: [
      { en: 'Label',          desc: 'Display name of an element or item.' },
      { en: 'Container Type', desc: 'Physical form of the sample or reagent (e.g. 96-well Plate, Cryo Tube).' },
      { en: 'Concentration',  desc: 'Amount per unit volume (e.g. 10 µM, 1 mg/mL).' },
      { en: 'Volume',         desc: 'Liquid volume in µL, mL, or L.' },
      { en: 'Storage Temp',   desc: 'Required storage condition: RT, 4°C, −20°C, −80°C, or LN₂.' },
      { en: 'Device',         desc: 'Laboratory instrument assigned to an Operation element.' },
      { en: 'Duration',       desc: 'Estimated execution time for an Operation step.' },
      { en: 'Description',    desc: 'Free-text notes or protocol details for an element.' },
      { en: 'Catalog #',      desc: 'Vendor catalog number for a reagent or labware item.' },
    ],
  },
]

export const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'],          action: 'Undo' },
  { keys: ['Ctrl', 'Y'],          action: 'Redo' },
  { keys: ['Ctrl', '⇧', 'Z'],    action: 'Redo (alt)' },
  { keys: ['Del'],                action: 'Delete selected element(s)' },
  { keys: ['Ctrl', 'A'],          action: 'Select all' },
  { keys: ['Ctrl', 'C'],          action: 'Copy selected' },
  { keys: ['Ctrl', 'V'],          action: 'Paste' },
  { keys: ['Scroll'],             action: 'Zoom in / out' },
  { keys: ['Space + drag'],       action: 'Pan the canvas' },
]

export const QUICK_START = [
  {
    step: 1,
    title: 'Open or create a workflow',
    desc: 'From the Dashboard, click an existing workflow card to open it, or click "+ New Workflow" to start fresh.',
  },
  {
    step: 2,
    title: 'Add elements from the Element Library',
    desc: 'Drag any element from the left panel onto the Canvas. A Start and at least one End element are required for a complete workflow.',
  },
  {
    step: 3,
    title: 'Connect elements',
    desc: 'Hover over an element to reveal its connection ports, then drag from a source port to a target port. Select a connection type in the Element Library first to set the flow type (Sample / Reagent / Labware / Data).',
  },
  {
    step: 4,
    title: 'Edit properties',
    desc: 'Click any element to open its Properties Panel on the right. Fill in the device, duration, inputs, outputs, and description. Object elements (Sample, Reagent, Labware) also support per-item fields.',
  },
  {
    step: 5,
    title: 'Organise and export',
    desc: 'Click Auto Layout in the Menu Bar to tidy the canvas, then Export to download the workflow as JSON for documentation or handoff.',
  },
]
