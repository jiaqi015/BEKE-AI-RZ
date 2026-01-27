
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack } from "../../types";
import { Type } from "@google/genai";

/**
 * Smart Intent Analysis
 * Determine if the user input is a raw idea (needs research) or a structured spec (needs strict adherence).
 */
const analyzeIntent = async (input: string): Promise<{ needsResearch: boolean; reasoning: string }> => {
  // Heuristic check first to save tokens
  if (input.length > 800 && (input.includes('模块') || input.includes('功能') || input.includes('表结构'))) {
      return { needsResearch: false, reasoning: "Input appears to be a detailed PRD based on length and keywords." };
  }

  const prompt = `
    Role: Senior Product Manager (Gatekeeper).
    Task: Analyze the user's input to decide if we need External Google Search to expand it.
    
    User Input:
    """
    ${input.substring(0, 2000)}
    """
    
    Criteria for "needsResearch = true":
    - Input is vague (e.g. "I want a CRM").
    - Input lacks specific functional lists.
    - Input is just a concept.
    
    Criteria for "needsResearch = false":
    - Input is already a detailed feature list or PRD.
    - Input contains specific database fields or API definitions.
    - SEARCHING WOULD ADD NOISE to this perfect input.
    
    Output JSON.
  `;

  const schema = {
      type: Type.OBJECT,
      properties: {
          needsResearch: { type: Type.BOOLEAN },
          reasoning: { type: Type.STRING }
      },
      required: ["needsResearch", "reasoning"]
  };

  try {
      return await aiClient.generateStructured(prompt, schema, false); // Use Flash for speed
  } catch {
      return { needsResearch: true, reasoning: "Fallback to safety" };
  }
};

/**
 * Step 0: Research & Expansion (Adaptive)
 */
export const expandPrd = async (originalInput: string, onLog?: (msg: string) => void): Promise<string> => {
  const log = (msg: string) => onLog && onLog(msg);

  // 1. Adaptive Check
  log(`正在评估输入完整度...`);
  const intent = await analyzeIntent(originalInput);
  
  let detailedContext = "";

  if (intent.needsResearch) {
      log(`💡 识别为概念性需求 (${intent.reasoning}) -> 启动联网调研...`);
      
      const researchPrompt = `
        I want to build a software system about: "${originalInput}".
        Please use Google Search to find:
        1. The core functional modules of similar top-tier products in the market.
        2. The standard business workflows in this industry.
        3. Typical user roles.
        
        Synthesize this into a "Research Summary" in Chinese.
      `;
      
      const researchResult = await aiClient.generateTextWithSearch(researchPrompt);
      if (researchResult.sources.length > 0) {
          log(`已参考: ${researchResult.sources.slice(0, 2).join(', ')}...`);
      }
      detailedContext = `Industry Research:\n${researchResult.text}`;
  } else {
      log(`🎯 识别为详细规格说明 (${intent.reasoning}) -> 跳过搜索，保持原始设计纯度。`);
      detailedContext = "User provided a detailed PRD. DO NOT Hallucinate new features. STICK TO THE INPUT.";
  }

  // 2. Synthesis Phase
  const synthesisPrompt = `
    Role: Senior Product Manager (CPO Level).
    Task: Create a professional Product Requirement Document (PRD) based on the user idea.
    
    User Idea: "${originalInput}"
    Context: ${detailedContext}
    
    Constraint:
    - **Language**: Chinese (Simplified) ONLY. 
    - **Realism**: Use the research data (if available) to populate details.
    
    Structure Requirements (Markdown):
    1. **Project Background** (200 words).
    2. **User Roles**: 3-4 personas.
    3. **Functional Modules**: Break down into at least 6 distinct modules.
    4. **Core Business Process**: Step-by-step workflow.
    5. **Data Structures**: Key entities.
    6. **Non-Functional Requirements**.
    
    Tone: Professional, Dense, "Enterprise-Ready".
  `;
  
  return await aiClient.generateText(synthesisPrompt, true);
};

export const analyzePrd = async (prdContent: string): Promise<FactPack> => {
  const prompt = `
    Role: Senior System Analyst & Architect.
    Task: Deconstruct the following *Expanded* Product Requirement Document (PRD) into a strict "Fact Pack".
    
    PRD CONTENT:
    ${prdContent}
    
    Analysis Rules:
    - Infer potential technical stack (Environment Candidates).
    - Output strictly in **Chinese (Simplified)**.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      softwareNameCandidates: { type: Type.ARRAY, items: { type: Type.STRING } },
      softwareType: { type: Type.STRING, description: "One of: Web, App, Backend, Plugin" },
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
      environmentCandidates: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["softwareNameCandidates", "softwareType", "hasUi", "functionalModules", "businessFlow"]
  };

  return await aiClient.generateStructured<FactPack>(prompt, schema, true);
};
