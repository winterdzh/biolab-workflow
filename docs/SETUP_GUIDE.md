# Node.js 安装与项目启动指南

## 第一步：安装 Node.js

1. 打开浏览器，访问 https://nodejs.org
2. 点击 **"LTS"** 版本下载（推荐 v20 或更高）
3. 运行安装程序，全程默认选项即可
4. 安装完成后，打开 **PowerShell** 或 **命令提示符**，验证安装：
   ```
   node --version    # 应显示 v20.x.x 或更高
   npm --version     # 应显示 10.x.x 或更高
   ```

---

## 第二步：初始化项目

安装好 Node.js 后，在 VS Code 中打开终端，依次执行：

```powershell
# 进入项目目录
cd "C:\Users\L132823\OneDrive - Eli Lilly and Company\reference\code\workflow_design"

# 创建 React + Vite 项目
npm create vite@latest biolab-workflow -- --template react

# 进入项目目录
cd biolab-workflow

# 安装基础依赖
npm install

# 安装项目所需依赖
npm install @xyflow/react zustand papaparse dagre uuid clsx lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

---

## 第三步：启动开发服务器

```powershell
npm run dev
```

打开浏览器访问：**http://localhost:5173**

---

## 第四步：告知 Copilot 继续开发

项目初始化完成后，回到 VS Code Copilot 对话，告诉我：
> "Node.js 已安装，项目已初始化，请开始 Phase 1 开发"

我会按照 `ARCHITECTURE.md` 的规划，逐步搭建所有功能模块。
