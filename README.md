# 陈新软 AI - 部署指南

本项目已适配 Vercel 一键部署。

## ⚠️ 版本强制对齐指南 (CRITICAL)

本项目实施了极其严格的依赖版本锁定策略，以解决 PDF.js Worker 版本不匹配问题。

**核心版本 (Fixed):**
- `react`: **19.2.3**
- `pdfjs-dist`: **5.4.530**
- `@google/genai`: **1.38.0**

### 🛠️ 首次安装与构建 (必须执行)

为了确保本地环境与线上 Vercel 环境完全一致，请务必执行以下步骤：

```bash
# 1. 彻底清除旧依赖和锁文件
rm -rf node_modules package-lock.json

# 2. 重新安装依赖 (这将生成符合 new versions 的 package-lock.json)
npm install

# 3. 本地构建测试
npm run build
```

**注意：** 您必须将新生成的 `package-lock.json` 提交到 Git 仓库，Vercel 才会使用正确的版本进行构建。

## 🚀 Vercel 部署配置

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

## 本地开发

1. 执行上述“首次安装”步骤。
2. 创建 `.env` 文件并设置 `API_KEY=...`。
3. 运行 `npm run dev`。
