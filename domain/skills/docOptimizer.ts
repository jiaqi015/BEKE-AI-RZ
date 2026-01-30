
import { aiClient } from "../../infrastructure/ai/geminiClient";

/**
 * 文档优化大师 (Document Optimization Master)
 * 职责：不负责生成内容，只负责将内容“升维”为出版级/申报级文档。
 * 核心能力：排版优化、语言去口语化、增强可读性。
 */
export const optimizeDocStructure = async (
  rawContent: string, 
  docType: 'USER_MANUAL' | 'PROJECT_INTRO',
  onLog: (msg: string) => void
): Promise<string> => {
  
  onLog(`正在召集 [DocRefiner (文档精修 Agent)] 执行出版级对齐...`);
  
  const systemPrompt = `
    Role: Senior Technical Editor & Publishing Specialist (资深技术编辑/出版专家).
    Task: Polish and Refine the provided software documentation for strict Government/Enterprise compliance.
    
    Target Audience: Government Copyright Examiners & Enterprise Auditors.
    Format Target: Microsoft Word (.docx).
    
    【CRITICAL SAFETY RULES】
    1. **IMAGE TAG PRESERVATION**: You MUST preserve all image placeholders exactly as they are: \`> [INSERT_IMAGE::filename.png]\`. DO NOT move, modify, or translate them. They are anchors.
    2. **NO HALLUCINATION**: Do not invent new features. Only polish existing text.
    
    【Optimization Goals - "De-AI" Strategy】
    1. **Remove Markdown Artifacts**: 
       - Do NOT use \`**\` (bold) excessively. Only for key terms.
       - Do NOT use \`####\` deep nesting. Use list items (1. 2. 3.) instead.
    2. **No ASCII Charts**: 
       - **FORBIDDEN**: Do not generate text-based diagrams like \`+---+\` or \`| Name | Type |\`.
       - **Alternative**: Describe the structure in clear paragraphs or simple lists.
    3. **Tone Upgrade**: 
       - Convert "Next, click the button" to "User selects the [Submit] function."
       - Use "System" instead of "App/We".
  `;

  let specificInstruction = "";

  if (docType === 'USER_MANUAL') {
      specificInstruction = `
        **Specific Rules for User Manual**:
        - **Visual References**: When referring to images, use "As shown in the figure below..." (如下图所示).
        - **Jargon Sanitization**: 
          - Replace "Database" with "System Storage".
          - Replace "API" with "Data Exchange".
        - **Structure**:
          - Use H2 (##) for Main Page Names.
          - Use H3 (###) for Sub-sections.
          - Use Numbered Lists for operation steps.
      `;
  } else {
      specificInstruction = `
        **Specific Rules for Project Intro**:
        - **Density**: Increase information density. Avoid "fluff".
        - **Paragraphing**: 3 distinct paragraphs (Overview, Modules, Tech Stack).
        - **Tech Keywords**: Highlight technical terms naturally.
      `;
  }

  const prompt = `
    ${systemPrompt}
    ${specificInstruction}

    --- INPUT CONTENT START ---
    ${rawContent}
    --- INPUT CONTENT END ---

    Action: Rewrite and Optimize the content above. Output ONLY the result.
  `;

  try {
      onLog(`[DocRefiner] 正在执行语义升维与敏感词二次清洗...`);
      const polished = await aiClient.generateText(prompt, true); // Use Pro model for best writing
      
      // Safety Check: specific to image tags
      const inputTags = rawContent.match(/> \[INSERT_IMAGE::.*?\]/g) || [];
      const outputTags = polished.match(/> \[INSERT_IMAGE::.*?\]/g) || [];
      
      if (inputTags.length !== outputTags.length) {
          onLog(`[DocRefiner] ⚠️ 警告：检测到锚点丢失 (输入${inputTags.length} vs 输出${outputTags.length})，执行安全回滚。`);
          return rawContent;
      }
      
      onLog(`[DocRefiner] 优化完成：文档专业度已对齐 CPCC 标准。`);
      return polished;
  } catch (e) {
      console.error("Optimization failed", e);
      onLog(`[DocRefiner] ⚠️ 服务响应超时，保留原始草稿。`);
      return rawContent;
  }
};
