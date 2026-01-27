
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, PageSpec } from "../../types";
import { Type } from "@google/genai";

/**
 * UI 架构师 (Structural Architect)
 * 职责：只负责页面结构的规划，不负责生成图片。
 * 输出：PageSpec 列表 (蓝图)
 */
export const generatePageSpecs = async (facts: FactPack): Promise<PageSpec[]> => {
  // Dynamic page count target: Baseline 8, plus 2 per module, capped at 15.
  const targetMin = 8;
  const targetMax = 15;
  const isApp = facts.softwareType === 'App';

  const navInstruction = isApp 
    ? "Structure: Mobile App Navigation. Use a 'Bottom Tab Bar' structure (Home, List, Feature, Profile). Page names should be concise (e.g. '首页', '我的')."
    : "Structure: Web Admin Panel. Use a 'Left Sidebar Menu' structure. Page names can be hierarchical (e.g. '系统管理-用户列表').";
  
  const prompt = `
    Role: Senior UI/UX Architect.
    Task: Define the UI structure for the software "${facts.softwareNameCandidates[0] || 'System'}" based on its modules.
    
    Context: Software Type is **${facts.softwareType}**.
    ${navInstruction}

    Constraint:
    - Generate strictly between ${targetMin} and ${targetMax} core pages.
    - STRATEGY: To ensure sufficient documentation volume, verify that for complex modules you create multiple views:
      1. List/Management View (列表/管理页)
      2. Add/Edit Form View (新增/配置页)
      3. Data Analysis/Detail View (统计/详情页)
    
    - MUST include: 
      1. Login Page (登录页面)
      2. Dashboard/Main Page (主界面)
      3. Coverage for functional modules: ${facts.functionalModules.map(m => m.name).join(', ')}
    
    - Output language: Chinese (Simplified).
    
    For each page, define:
    - id: PAGE_XX (Sequential)
    - name: Page Title (e.g. 用户管理-列表, 订单配置-新增)
    - purpose: 1 sentence description.
    - fields: List of visible fields/columns.
    - operations: List of buttons/actions.
    - filename: **Naming Convention**: UI_XX_[ChineseName].png. 
      - Example: UI_01_登录.png, UI_02_系统首页.png, UI_03_用户管理.png.
      - **DO NOT** translate to English. Keep the Chinese name in the filename for easy reading.
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

  const result = await aiClient.generateStructured<{ pages: PageSpec[] }>(prompt, schema, true);
  return result.pages;
};
