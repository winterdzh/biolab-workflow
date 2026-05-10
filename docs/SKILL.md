# SKILL — BioLab Workflow Designer

> 此文件作为 Copilot Skill 调用入口，帮助 Copilot 在新的对话中快速恢复项目上下文。

## 调用此 Skill 的情景

当用户提到以下任何一项时，读取此文件：
- biolab workflow designer
- lab automation workflow
- biolab-workflow 项目
- 继续上次的工作流设计工具开发

## 项目上下文恢复步骤

1. 读取 `/memories/repo/2026-05-10-handoff.md` 了解最新状态和近期决策
2. 读取 `docs/ARCHITECTURE.md` 了解详细架构和数据结构
3. 检查 `src/` 目录当前状态

## 项目信息

- **GitHub**: `winterdzh/biolab-workflow`，branch: `main`
- **开发环境**: GitHub Codespaces
- **运行方式**: `npm run dev` → PORTS 面板打开 5173
- **测试**: `npm run test`（Vitest + jsdom）

## 核心技术

- React 19 + Vite 8
- @xyflow/react 12 — workflow 可视化
- Zustand 5 — 状态管理（5 个 store）
- Tailwind CSS 4 — 样式
- dagre — 自动布局
- Vitest 2 + jsdom 26 — 单元测试

## 当前状态（最后更新：2026-05-10）

- 项目完整可运行，已部署到 GitHub Pages
- localhost 开发：`npm run dev --port 5173`
- localStorage 持久化：key `biolab.appState.v1`

## 已实现功能清单

- ✅ Cover Page（多 workflow 卡片，拖拽 JSON 导入，备份提醒 banner）
- ✅ 公开演示工作流（siRNA→Echo→Fluent→Cytation→Cytomat→HTRF→EnVision）
- ✅ 节点类型：Start / End / Operation / IfElse / Loop / WaitUntil / SetVariable / DataNode / SampleNode / ReagentNode / LabwareNode
- ✅ Experiment Group（虚线红框，框选分组，NodeResizer）
- ✅ 3 种连线（Sample Flow 蓝 / Material Flow 橙 / Info Flow 灰虚线），ribbon 渐变风格
- ✅ RightPanel 按节点类型拆分为独立编辑器（nodeProps/）
- ✅ Library 管理（Sample / Consumable / Reagent / Device）
- ✅ 变量分级（Global / Workflow Variables）
- ✅ Auto Layout（dagre 两遍）
- ✅ Undo / Redo（Ctrl+Z/Y，50 步）
- ✅ Copy / Paste（Ctrl+C/V + 按钮）
- ✅ JSON 导入导出
- ✅ 主题色 #CC0000（PANTONE 485）

## 相关 Skill 文件

- `workflow-generator/SKILL.md` — 从实验 SOP 生成 workflow JSON 的完整指引

## 下次继续开发时建议关注

- 共享表单原语（Field/Input/Textarea）目前在 5 个 nodeProps 编辑器中重复，可提取
- 进一步补充单元测试覆盖率
- 孔板可视化（96/384 well plate）
- Workflow 验证（断路检测）
