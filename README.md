# 陈新软 AI - 部署指南

本项目已适配 Vercel 一键部署。

## 🚀 极其简单的部署步骤

1. **推送代码**：将代码推送到 GitHub 后，在 Vercel 导入项目。
2. **构建配置**：构建命令为 `npm run build`，输出目录为 `dist`。
3. **⚠️ 配置环境变量（必须做！）**：
   必须在 Vercel 的 Environment Variables 中配置 `API_KEY`（Gemini Key）。

## 本地开发

如果需要在本地运行：

1. 运行 `npm install` 安装依赖。
2. 创建 `.env` 文件并设置 `API_KEY=你的密钥`。
3. 运行 `npm run dev`。
