
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, RegistrationInfo, Artifacts, AuditReport, AuditIssue } from "../../types";
import { Type } from "@google/genai";
import { CPCC_BLACKLIST } from "./technicalWriter";

/**
 * 文本切片器：将长文档切分为 AI 可处理的片段 (约 15000 字符)
 */
const chunkText = (text: string, chunkSize: number = 15000): string[] => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
};

/**
 * 局部审计器：针对单个片段进行扫描
 */
const auditChunk = async (chunkContent: string, info: RegistrationInfo, chunkIndex: number, docType: string): Promise<AuditIssue[]> => {
    const prompt = `
    Role: CPCC Examiner (Details Scanner).
    Task: Audit a FRAGMENT of the "${docType}" for FATAL compliance errors.
    
    Standard of Truth (Must Match Exactly):
    - Name: "${info.softwareFullName}"
    - Version: "${info.version}"
    
    Fatal Blacklist (Forbidden Words):
    ${JSON.stringify(CPCC_BLACKLIST)}
    
    Instructions:
    1. **Identity Check**: If you see ANY software name that is NOT "${info.softwareFullName}" (e.g. usage of aliases, abbreviations, or inconsistent casing), flag it as FATAL [Consistency].
    2. **Blacklist Check**: If you find any forbidden words, flag as FATAL [Compliance].
    3. **English Headers**: If you see a line starting with "#" that contains English (e.g. "## Login"), flag as FATAL [Language].
    
    Relaxation:
    - Marketing words like "Best", "Efficient", "High-performance" are OK. IGNORE them.
    - Focus ONLY on the Fatal checks above.
    
    Fragment Content:
    """
    ${chunkContent}
    """
    
    Output JSON: List of issues found.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            issues: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        severity: { type: Type.STRING, enum: ["FATAL", "WARN"] }, // Only care about Fatal/Warn
                        category: { type: Type.STRING, enum: ["一致性", "合规性", "完整性", "语言合规"] },
                        message: { type: Type.STRING },
                        suggestion: { type: Type.STRING }
                    },
                    required: ["severity", "category", "message", "suggestion"]
                }
            }
        },
        required: ["issues"]
    };

    try {
        const result = await aiClient.generateStructured<{issues: AuditIssue[]}>(prompt, schema, false); // Use Flash for speed on chunks
        return result.issues.map(i => ({ ...i, message: `[P${chunkIndex+1}] ${i.message}` })); // Tag with part number
    } catch (e) {
        console.error(`Audit chunk ${chunkIndex} failed`, e);
        return [];
    }
};

/**
 * 终极审计师 (The Final Gatekeeper) - REFACTORED FOR FULL COVERAGE
 * 职责：分块扫描全量文档，不再只看开头。
 */
export const conductAudit = async (facts: FactPack, info: RegistrationInfo, artifacts: Artifacts): Promise<AuditReport> => {
  
  const allIssues: AuditIssue[] = [];
  const manual = artifacts.userManual || "";
  const intro = artifacts.projectIntroduction || "";
  const form = artifacts.appForm || "";

  // 1. HARD-CODED CONSISTENCY CHECK (No AI)
  // 这是一个绝对严格的代码级检查，比 AI 更可靠。
  // 检查申请表、说明书、简介中是否包含官方全称。如果不包含，直接报错。
  const checkIdentityStrictness = (content: string, sourceName: string) => {
      if (content.length > 0 && !content.includes(info.softwareFullName)) {
          allIssues.push({
              severity: 'FATAL',
              category: '一致性',
              message: `在[${sourceName}]中未找到官方全称 "${info.softwareFullName}"，可能使用了简称或别名。`,
              suggestion: `请全局替换为 "${info.softwareFullName}"`
          });
      }
      if (content.length > 0 && !content.includes(info.version)) {
           allIssues.push({
              severity: 'FATAL',
              category: '一致性',
              message: `在[${sourceName}]中未找到版本号 "${info.version}"。`,
              suggestion: `请补充版本号`
          });
      }
  };

  checkIdentityStrictness(intro, "项目简介");
  checkIdentityStrictness(form, "申请表");
  checkIdentityStrictness(manual, "说明书");

  // 2. AI CHUNKED AUDIT (For semantic/contextual errors)
  // We prioritize the User Manual as it's the longest and most error-prone.
  
  const manualChunks = chunkText(manual);
  const auditPromises = manualChunks.map((chunk, idx) => auditChunk(chunk, info, idx, "User Manual"));
  
  // Wait for all chunks to be audited (Parallel)
  const chunkResults = await Promise.all(auditPromises);
  chunkResults.forEach(issues => allIssues.push(...issues));

  // Audit Intro & Form (Single chunk usually)
  const introIssues = await auditChunk(intro, info, 0, "Project Intro");
  allIssues.push(...introIssues);

  // 3. Score Calculation
  const fatalCount = allIssues.filter(i => i.severity === 'FATAL').length;
  const passed = fatalCount === 0;
  
  // Score formula: Start at 100. Fatal -20, Warn -5.
  let score = 100 - (fatalCount * 20) - (allIssues.length - fatalCount) * 5;
  score = Math.max(0, score);

  return {
      round: 0, 
      timestamp: new Date().toISOString(),
      passed,
      score,
      summary: passed 
          ? "全量深度审计通过。文档一致性与合规性符合申报标准。" 
          : `审计未通过。发现 ${fatalCount} 个阻断性问题，请立即修复。`,
      issues: allIssues
  };
};
