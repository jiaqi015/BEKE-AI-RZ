# 陈新软 AI - 部署指南

本项目已适配 Vercel 一键部署。

## 🚀 极其简单的部署步骤

1. **推送代码**：将本项目推送到您的 GitHub 仓库。
2. **导入 Vercel**：在 Vercel 中点击 "Add New..." -> "Project"，选择本仓库。
3. **配置 Framework**：Vercel 会自动识别为 `Vite`，**不要修改 Build Command**，保持默认即可。
4. **⚠️ 配置环境变量（必须做！）**：
   在 Deploy 页面，找到 **Environment Variables** 选项卡，添加以下变量：

   | Key (变量名) | Value (变量值) |
   | :--- | :--- |
   | `API_KEY` | 您的 Gemini API Key (以 AIza 开头) |

   > **注意**：如果不配置这个 Key，项目部署后会无法连接 AI 服务。

5. **点击 Deploy**：等待約 1 分钟，直到出现满屏的撒花动画。

## 本地开发

如果需要在本地运行：

1. 确保已安装 Node.js (v20+)。
2. 运行 `npm install` 安装依赖。
3. 新建 `.env` 文件，写入 `API_KEY=您的Key`。
4. 运行 `npm run dev`。
