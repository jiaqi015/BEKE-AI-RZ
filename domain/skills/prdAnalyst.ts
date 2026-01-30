
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack } from "../../types";
import { Type } from "@google/genai";

/**
 * 扩展原始需求为详细 PRD
 */
export const expandPrd = async (input: string, onProgress: (msg: string) => void): Promise<string> => {
  onProgress("正在通过 AI 扩展产品创意为详尽 PRD...");
  const prompt = `
    你是一名资深产品架构师。
    请将以下简略的需求描述或产品点子扩展为一份完整的、具备申报价值的 PRD 文档。
    要求包含：项目背景、用户角色、详细功能模块说明、核心业务流程逻辑、系统非功能性需求。
    
    原始输入：
    ${input}
  `;
  return await aiClient.generateText(prompt, true);
};

export const analyzePrd = async (prdContent: string): Promise<FactPack> => {
  const prompt = `
    Role: Senior System Architect & UI UX Director.
    Task: Deconstruct the PRD into a strict "Fact Pack" AND design the software's navigation blueprint.
    
    PRD CONTENT:
    ${prdContent}
    
    【Navigation & Visual Design Instructions】
    1. **Tabs Design**: For the Bottom Navigation Bar, design 4 concise Chinese labels (e.g. "首页", "找房", "消息", "我的").
    2. **Visual Mapping**: Map keywords (e.g. "Detail", "List") to specific Tabs.
    3. **Theme Selection**: Determine if the app is 'MAP' (map-centric), 'FEED' (social/media), 'LIST' (transactional), or 'DASHBOARD' (enterprise).
    
    Output strictly in **Chinese (Simplified)**.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      softwareNameCandidates: { type: Type.ARRAY, items: { type: Type.STRING } },
      softwareType: { type: Type.STRING },
      hasUi: { type: Type.BOOLEAN },
      functionalModules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "description"]
        }
      },
      coreFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
      businessFlow: { type: Type.STRING },
      roles: { type: Type.ARRAY, items: { type: Type.STRING } },
      dataObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
      environmentCandidates: { type: Type.ARRAY, items: { type: Type.STRING } },
      // 顶层设计规约 Schema
      navigationDesign: {
        type: Type.OBJECT,
        properties: {
          tabs: { type: Type.ARRAY, items: { type: Type.STRING } },
          // FIX: Changed from OBJECT to ARRAY to avoid "empty properties" error in Gemini API
          activeMapping: { 
            type: Type.ARRAY, 
            items: {
              type: Type.OBJECT,
              properties: {
                pageKeyword: { type: Type.STRING },
                tabName: { type: Type.STRING }
              },
              required: ["pageKeyword", "tabName"]
            }
          },
          visualTheme: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING },
              styleType: { type: Type.STRING, enum: ['MAP', 'FEED', 'LIST', 'DASHBOARD'] },
              description: { type: Type.STRING }
            },
            required: ["primaryColor", "styleType", "description"]
          }
        },
        required: ["tabs", "activeMapping", "visualTheme"]
      }
    },
    required: ["softwareNameCandidates", "softwareType", "hasUi", "functionalModules", "businessFlow", "navigationDesign"]
  };

  return await aiClient.generateStructured<FactPack>(prompt, schema, true);
};
