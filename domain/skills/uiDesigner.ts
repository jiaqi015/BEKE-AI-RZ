
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, PageSpec } from "../../types";
import { Type } from "@google/genai";

/**
 * UI 架构师 (Structural Architect) - V2 Consumer Edition
 * 职责：规划具有 "App 感" 的页面结构，拒绝 B 端表格思维。
 */
export const generatePageSpecs = async (facts: FactPack): Promise<PageSpec[]> => {
  const isApp = facts.softwareType === 'App';

  // 针对 C 端 App，我们需要更具体的页面类型引导
  const appDirectives = isApp 
    ? `
      **APP STRATEGY (CRITICAL)**:
      - This is a CONSUMER APP (like TikTok, Taobao, WeChat, Uber).
      - **FORBIDDEN**: Do NOT generate "User Management Table" or "System Config".
      - **REQUIRED**: Generate pages like:
        1. "Home - Feed/Waterfall" (首页-瀑布流/推荐)
        2. "Detail - Immersive" (详情-沉浸式/视频流)
        3. "Action - Modal/Sheet" (操作-底部弹窗/支付半屏)
        4. "Profile - Visual" (我的-视觉化个人中心)
        5. "Map/LBS" (if relevant)
      `
    : `
      **WEB STRATEGY**:
      - Modern SaaS Dashboard (Linear/Vercel style), not old Admin panels.
      - Use "Analytics View", "Kanban Board", "Interactive Graph".
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
    - **Naming**: Use realistic, short Chinese names (e.g. "首页推荐", "直播间", "订单支付", "个人中心").
    - **Purpose**: Describe the UX intent, not just function.
    
    Output Format (JSON):
    - filename: MUST be UI_XX_[ChineseName].png (e.g. UI_01_首页推荐.png)
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
    // Fallback if structured generation fails
    console.error("UI Planner failed, using fallback", e);
    return [];
  }
};
