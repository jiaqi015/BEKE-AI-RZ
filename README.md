
# 陈新软 AI (ChenXinSoft AI) 🚀

> **企业级软著材料智能编译器** | Powered by Google Gemini 3.0 Pro

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-19.0-blue)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_Pro-orange)](https://ai.google.dev/)

## 📖 项目简介

**陈新软 AI** 是一个基于 AI Agent 工作流的智能系统，旨在解决软件著作权（软著）申报过程中耗时最长、重复性最高的痛点。

它不仅仅是一个文档生成器，更是一个包含**自我审查、逻辑推演、一致性校验**的虚拟架构师团队。用户只需提供一个简单的产品想法（Idea）或上传一份简略的 PDF，系统即可全自动编译出一套符合中国版权保护中心（CPCC）形式审查标准的完整申报材料。

## ✨ 核心特性

- **🧠 深度意图解析**  
  基于 Gemini 3.0 Pro 的超长上下文能力，精准解析 PRD 逻辑，自动推导功能模块、用户角色及核心业务流。

- **🎨 高保真 UI 仿真**  
  内置 `UIDesigner` Agent，根据产品类型（App/Web/大屏）自动生成 10+ 张高保真界面截图，拒绝通用占位图，支持暗色/亮色模式自动适配。

- **📄 申报文档全家桶**  
  一键生成以下标准文档（自动排版为 docx）：
  - **《软件操作说明书》**（包含界面截图与详细操作步骤）
  - **《用户手册》** / **《设计说明书》**
  - **《源代码鉴别材料》**（自动生成 3000+ 行符合逻辑的伪代码，含注释）
  - **《软件著作权登记申请表》**（自动填补技术参数）

- **🛡️ 智能合规审计**  
  内置 CPCC 审查规则引擎（Auditor Agent），自动识别并清洗软著申报中的“致死词汇”（如“智能”、“AI”、“大数据”、“平台”等敏感词），确保形式审查通过率。

- **💾 本地化数据隐私**  
  采用 IndexedDB (Dexie.js) 进行全量数据本地持久化。所有生成的文档、图片均存储在浏览器端，支持断点续传与会话恢复。

## 🛠️ 技术架构

本项目采用 **DDD (领域驱动设计)** + **Pipeline (流水线)** 架构，确保复杂 AI 工作流的可维护性。

```mermaid
graph TD
    UI[UI Presentation Layer] -->|Events| AppLayer[Application Layer]
    AppLayer -->|Orchestrate| Engine[Pipeline Engine (Domain Core)]
    
    Engine --> Skill1[PRD Analyst]
    Engine --> Skill2[UI Designer]
    Engine --> Skill3[Tech Writer]
    Engine --> Skill4[Code Gen]
    Engine --> Skill5[Auditor]
    
    Skill1 & Skill2 & Skill3 & Skill4 & Skill5 -->|Adapter| Infra[Infrastructure Layer]
    Infra -->|API| Gemini[Google Gemini API]
    Infra -->|Storage| DB[IndexedDB / Dexie]
```

- **Domain Layer**: 包含核心业务逻辑与 Agent Skills (`domain/skills/*`)。
- **Infrastructure Layer**: 封装 AI 客户端 (`geminiClient`) 与本地数据库 (`projectDB`)，处理重试、熔断与数据清洗。
- **Application Layer**: 通过 `PipelineEngine` 单例管理 6 大步骤的状态流转与恢复。

## ⚡️ 快速开始

### 1. 环境准备
- **Node.js**: v22.x 或更高版本（必须，由于使用了最新的构建工具链）。
- **API Key**: 一个有效的 Google Gemini API Key ([获取链接](https://aistudio.google.com/))。

### 2. 安装依赖

由于本项目对 `pdfjs-dist` (PDF解析) 和 `react` 有严格的版本对齐要求，建议执行**清洁安装**：

```bash
# 1. 清除旧依赖和锁文件 (必须!)
rm -rf node_modules package-lock.json

# 2. 重新安装 (生成新的 package-lock.json)
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件，并填入您的 API Key：

```env
API_KEY=your_gemini_api_key_here
```

### 4. 启动开发环境

```bash
npm run dev
```
访问 `http://localhost:5173` 即可开始使用。

## 📦 部署指南 (Vercel)

本项目已针对 Vercel Serverless 环境进行深度优化。

1. **导入项目**: 在 Vercel Dashboard 中导入你的 GitHub 仓库。
2. **构建预设 (Framework Preset)**: 选择 `Vite`。
3. **环境变量**: 在 Settings -> Environment Variables 中添加 `API_KEY`。
4. **Node 版本**: 在 Settings -> General -> Node.js Version 中选择 `22.x`。
5. **部署**: 点击 Deploy。

## ⚠️ 免责声明

1. **仅供辅助**: 本工具生成的材料仅供软件著作权申报辅助使用，**不构成法律建议**。
2. **人工核对**: 尽管内置了合规审计 Agent，但 AI 仍可能产生幻觉。请在提交给版权保护中心前，务必进行人工核对与校准。
3. **合规使用**: 请勿使用本工具生成虚假软件材料进行欺诈性申报。开发者不对因使用本工具导致的法律风险或申报失败承担责任。

---

© 2025 陈新软 AI Team. Built with ❤️ and Coffee.
