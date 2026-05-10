# SKILL — BioLab Workflow Designer

> 此文件作为 Copilot Skill 调用入口，帮助 Copilot 在新的对话中快速恢复项目上下文。

## 调用此 Skill 的情景

当用户提到以下任何一项时，读取此文件：
- biolab workflow designer
- lab automation workflow
- workflow_design 项目
- 继续上次的工作流设计工具开发

## 项目上下文恢复步骤

1. 读取 `PROJECT_MEMORY.md` 了解当前阶段和决策历史
2. 读取 `ARCHITECTURE.md` 了解详细架构和数据结构
3. 如果项目已初始化，检查 `biolab-workflow/` 目录的当前状态

## 项目根路径

```
C:\Users\L132823\OneDrive - Eli Lilly and Company\reference\code\workflow_design\
```

## 核心技术

- React 18 + Vite
- @xyflow/react (React Flow) — workflow 可视化
- Zustand — 状态管理
- Tailwind CSS — 样式
- papaparse — CSV 处理
- dagre — 自动布局

## 当前状态（最后更新：2026-05-09）

- **所有 Phase 0–7 已完成**，项目可正常运行
- GitHub: @winterdzh / repo: `biolab-workflow`，用 Codespaces 开发
- 运行方式：Codespaces 终端 `npm run dev` → PORTS 面板打开 5173

## 已实现功能清单

- ✅ Cover Page（多 workflow 卡片管理，拖拽上传 JSON）
- ✅ 7 种节点（Start / End / Operation / IfElse / Loop / WaitUntil / SetVariable）
- ✅ Experiment Group（虚线红框，框选分组，Ungroup，NodeResizer）
- ✅ 3 种连线（Sample Flow 蓝 / Material Flow 橙 / Info Flow 灰虚线）
- ✅ 节点属性面板（右侧，含 Delete / Copy 按钮）
- ✅ Library 管理（Sample / Consumable / Reagent / Device，CSV+JSON 导入导出）
- ✅ 变量分级（Global Variables 跨 workflow / Workflow Variables 仅本 workflow）
- ✅ Auto Layout（dagre，两遍：先排 Experiment 内部，再排顶层）
- ✅ Undo / Redo（Ctrl+Z / Ctrl+Y，最多 50 步）
- ✅ Copy / Paste（Ctrl+C/V + UI 按钮，带所有 attributes，offset +40px）
- ✅ JSON 导入导出（单 workflow 只含用到的 Library；Export All 含全部）
- ✅ 主题色 #CC0000 红色（PANTONE 485）

## 下次继续开发时的步骤

1. 读取 `PROJECT_MEMORY.md` 了解当前状态
2. 在 GitHub 打开 Codespaces → `npm run dev`
3. 按需从以下方向扩展：
   - 孔板可视化（96/384 well plate，液体转移路径）
   - 体积计算 / Throughput 计算
   - Workflow 验证（检测断路、缺少 End 节点等）
   - 样本/耗材流转路径高亮
