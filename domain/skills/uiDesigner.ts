
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, PageSpec } from "../../types";
import { Type } from "@google/genai";

/**
 * UI 架构师 (Structural Architect) - V3 Consumer-First Edition
 * 职责：规划具有 "App 感" 的页面结构，彻底摒弃 B 端表格思维。
 */
export const generatePageSpecs = async (facts: FactPack): Promise<PageSpec[]> => {
  const isApp = facts.softwareType === 'App';

  // 针对 C 端 App，我们需要更具体的页面类型引导，强制使用 C 端术语
  const appDirectives = isApp 
    ? `
      **APP DESIGN STRATEGY (CRITICAL)**:
      - **Context**: This is a consumer-facing mobile app (iOS/Android).
      - **Style**: High-end, visual, immersive.
      - **FORBIDDEN**: "Management", "Table", "Grid", "System Config", "Admin".
      - **REQUIRED PAGE TYPES**:
        1. **Feed/Discovery**: "首页推荐", "房源列表", "动态圈" (Waterfall/Card layout).
        2. **Visual Detail**: "详情页", "播放页", "房源档案" (Full screen images).
        3. **Functional Tool**: "计算器", "地图找房", "智能分析" (Interactive charts/maps).
        4. **Personal**: "我的", "个人中心" (Visual stats, not lists).
      `
    : `
      **WEB DESIGN STRATEGY**:
      - Modern SaaS Dashboard (Linear/Vercel/Stripe style).
      - Use "Analytics View", "Kanban Board", "Interactive Graph".
      - Avoid dense data grids where possible, use "Card Lists".
      `;
  
  const prompt = `
    Role: Senior Product Designer (Consumer Apps).
    Task: Define the UI screen list for "${facts.softwareNameCandidates[0]}".
    
    Context:
    - Type: ${facts.softwareType}
    - Modules: ${facts.functionalModules.map(m => m.name).join(', ')}
    
    ${appDirectives}

    Constraint:
    - Generate 8-12 key screens.
    - **Naming**: Use realistic, short Chinese names (e.g. "首页", "房源详情", "智能估价").
    - **Purpose**: Describe the UX intent (e.g. "Immersive consumption", "Quick action").
    - **Fields**: List visual elements (e.g. "Cover Image", "Avatar", "Price Badge") not just database columns.
    
    Output Format (JSON):
    - filename: MUST be UI_XX_[ChineseName].png (e.g. UI_01_首页.png)
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            purpose: { type: Type.STRING },
            fields: { type: Type.ARRAY, items: { type: Type.STRING } },
            operations: { type: Type.ARRAY, items: { type: Type.STRING } },
            filename: { type: Type.STRING, description: "UI_XX_中文名.png" }
          },
          required: ["id", "name", "purpose", "fields", "operations", "filename"]
        }
      }
    },
    required: ["pages"]
  };

  try {
    const result = await aiClient.generateStructured<{ pages: PageSpec[] }>(prompt, schema, true);
    return result.pages;
  } catch (e) {
    console.error("UI Planner failed, using fallback", e);
    return [];
  }
};
