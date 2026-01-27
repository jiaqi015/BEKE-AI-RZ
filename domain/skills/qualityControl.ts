
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { Type } from "@google/genai";

interface QualityReport {
  score: number;
  reasoning: string;
  issues: string[];
}

/**
 * 质量控制中心 (Quality Control Center)
 * 核心逻辑：Generate -> Audit -> (If score < 85) Refine
 */
export const reviewAndRefine = async (
  content: string, 
  contextDescription: string,
  onLog: (msg: string) => void
): Promise<string> => {
  
  // 1. Audit Phase
  onLog(`🔍 正在进行质量审计 (Self-Reflection)...`);
  
  const auditPrompt = `
    Role: Senior Editor & Compliance Auditor.
    Task: Audit the quality of the following text based on strict criteria.
    
    Context: ${contextDescription}
    
    Audit Criteria:
    1. **Naturalness**: Does it sound like a human expert wrote it? (No "AI tone", no "In summary", no "Firstly/Secondly").
    2. **Specificity**: Are the details concrete? (No generic fluff).
    3. **Consistency**: Does it contradict itself?
    4. **Formatting**: Is it clean?
    
    Content to Audit:
    """
    ${content.substring(0, 15000)} ... (truncated if too long)
    """
    
    Output JSON:
    {
       "score": number (0-100),
       "reasoning": "string (short summary)",
       "issues": ["issue 1", "issue 2"]
    }
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      reasoning: { type: Type.STRING },
      issues: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["score", "reasoning", "issues"]
  };

  try {
      const report = await aiClient.generateStructured<QualityReport>(auditPrompt, schema, true);
      
      onLog(`📝 质量评分: ${report.score}/100 - ${report.reasoning}`);

      // Pass
      if (report.score >= 85) {
          onLog(`✅ 质量达标，通过。`);
          return content;
      }

      // Fail -> Refine
      onLog(`⚠️ 质量未达标 (目标 85)，触发自动精修...`);
      onLog(`🛠️ 修正方向: ${report.issues.join('; ')}`);

      const refinePrompt = `
        Role: Expert Technical Writer.
        Task: Rewrite the content to address the Auditor's issues.
        
        Original Content:
        ${content}
        
        Auditor's Issues:
        ${report.issues.join('\n')}
        
        Requirements:
        - FIX all identified issues.
        - REMOVE any "AI flavor" (robotic transitions, repetitive structures).
        - Keep the original information but improve the flow and tone.
        - Output ONLY the rewritten content.
      `;

      const refinedContent = await aiClient.generateText(refinePrompt, true);
      onLog(`✨ 精修完成，已替换原始内容。`);
      return refinedContent;

  } catch (e) {
      console.warn("Quality Control Check Failed, returning original.", e);
      return content;
  }
};
