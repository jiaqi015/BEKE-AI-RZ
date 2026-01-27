# 陈新软 AI - 部署指南

本项目已适配 Vercel 一键部署。

## 🚀 部署修复方案 (ETARGET Fix)

如果你遇到 `No matching version found for @google/genai` 报错，请按照以下步骤操作：

1. **删除旧文件**：在本地删除 `package-lock.json` 和 `node_modules`。
2. **强制更新**：执行 `npm install --force`。
3. **推送到远程**：确保 `package.json` 中的 `@google/genai` 值为 `"latest"` 或确定的最新版本。

## 🛠️ PDF 环境说明

为了防止 PDF.js Worker 报错，项目采用以下策略：
- **移除 importmap 中的 pdfjs-dist**：由 Vite 本地打包。
- **动态 CDN 加载 Worker**：在 `utils/pdfReader.ts` 中根据当前安装版本动态指向 jsDelivr。

## Vercel 部署配置

在 Vercel 导入项目时，请确保以下配置正确：

| 配置项 | 值 |
| :--- | :--- |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Node.js Version** | 20.x |

### 环境变量

请在 Vercel 项目设置中添加：
- `API_KEY`: 您的 Gemini API 密钥