
# 陈新软 AI - 部署指南

本项目已适配 Vercel 一键部署。

## 🚀 部署前必读

为确保依赖版本完全对齐（特别是 PDF.js Worker 和 Gemini SDK），请在本地开发或部署前执行以下**清洁构建步骤**：

```bash
# 1. 清除旧依赖和锁文件 (必须!)
rm -rf node_modules package-lock.json

# 2. 重新安装 (生成新的 package-lock.json)
npm install

# 3. 构建测试
npm run build
```

**注意：** 提交代码时，请务必包含新生成的 `package-lock.json` 文件，Vercel 将依据此文件锁定版本。

## Vercel 部署配置

在 Vercel 导入项目时，请确保以下配置正确：

| 配置项 | 值 |
| :--- | :--- |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Node.js Version** | 22.x (Project Settings -> General -> Node.js Version) |

### 环境变量

请在 Vercel 项目设置 (Settings -> Environment Variables) 中添加：

- `API_KEY`: 您的 Gemini API 密钥
