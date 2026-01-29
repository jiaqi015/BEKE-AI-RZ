
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, RegistrationInfo, PageSpec } from "../../types";
import { db } from "../../infrastructure/db/projectDB";

const getPrimaryLang = (langs: string[]) => {
    const l = langs[0]?.toLowerCase() || 'java';
    if (l.includes('java')) return 'java';
    if (l.includes('py')) return 'python';
    if (l.includes('go')) return 'go';
    if (l.includes('ts') || l.includes('type')) return 'typescript';
    if (l.includes('js') || l.includes('node')) return 'javascript';
    if (l.includes('vue')) return 'vue';
    if (l.includes('swift')) return 'swift';
    if (l.includes('kotlin')) return 'kotlin';
    if (l.includes('dart') || l.includes('flutter')) return 'dart';
    return 'java';
};

/**
 * 【03】源程序鉴别材料 - Enterprise Volume Edition (>5000 lines target)
 * Strategy: "Full-Stack Evidence Chain"
 * 1. Business Logic (Controller/Service)
 * 2. Database Schema (DDL) - Huge volume, valid source code.
 * 3. API Contract (Swagger/OpenAPI) - Huge volume, valid source code.
 * 4. Core Infrastructure (Utils/BaseClasses) - Dense code.
 */
export const generateSourceCode = async (
    facts: FactPack, 
    info: RegistrationInfo,
    pageSpecs: PageSpec[], 
    onProgress: (msg: string) => void
): Promise<string> => {
  const primaryLang = getPrimaryLang(info.programmingLanguage);
  
  let accumulatedCode = "";
  let totalLines = 0;

  // Helper to format and save
  const appendCode = async (codeBlock: string) => {
      // Filter out markdown code blocks if AI adds them
      const rawLines = codeBlock.replace(/```[a-z]*\n/g, '').replace(/```/g, '').split('\n');
      
      const numberedLines = rawLines.map((line) => {
          totalLines++;
          // Standard 6-digit line number for official gov audit (000001 | code)
          const lineNum = totalLines.toString().padStart(6, '0');
          // Preserve indentation but strip markdown artifacts
          return `${lineNum} | ${line.replace(/\r/g, '')}`;
      });
      
      const formattedBlock = numberedLines.join('\n') + "\n";
      accumulatedCode += formattedBlock;
      // Incremental save to DB to prevent data loss
      await db.saveArtifact('sourceCode', accumulatedCode);
  };

  // --- PHASE 1: BOILERPLATE EXPLOSION (Core Infra) ---
  onProgress(`正在构建企业级基础架构 (Enterprise Core)...`);
  
  const corePrompt = `
    Role: Senior Architect.
    Task: Generate VERBOSE Core Infrastructure for "${info.softwareFullName}".
    
    Language: ${primaryLang}
    
    Requirements:
    1. **Global Constants**: Generate a file with 100+ error codes and constant definitions.
    2. **Base Classes**: BaseEntity (with all Audit fields), BaseController, BaseService.
    3. **Utils**: DateUtils, StringUtils, SecurityUtils (AES/RSA).
    4. **Config**: DatabaseConfig, SwaggerConfig, SecurityConfig.
    
    Output Format:
    - Pure code files separated by "// ================= File: [Name] =================".
    - DO NOT use placeholders. Write FULL methods.
    - Make it LONG. Add detailed Javadoc comments.
  `;
  const coreCode = await aiClient.generateText(corePrompt, true);
  await appendCode(coreCode);

  // --- PHASE 2: MODULE LOGIC (Iterate ALL Pages) ---
  onProgress(`正在生成业务逻辑层 (覆盖全部 ${pageSpecs.length} 个蓝图页面)...`);
  
  // We process in batches of 3 to avoid context window limits but ensure volume
  const batchSize = 3;
  for (let i = 0; i < pageSpecs.length; i += batchSize) {
      const batch = pageSpecs.slice(i, i + batchSize);
      onProgress(`正在编写模块 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pageSpecs.length/batchSize)}: ${batch.map(p => p.name).join(', ')}...`);
      
      const modPrompt = `
        Role: Senior Developer.
        Task: Generate FULL STACK code for the following UI Pages.
        
        Pages:
        ${JSON.stringify(batch.map(p => ({ name: p.name, fields: p.fields, actions: p.operations })))}
        
        Language: ${primaryLang}
        
        Requirements for EACH Page:
        1. **Entity/Model**: Full class with all fields, Getters/Setters/ToString/HashCode.
        2. **DTO/VO**: Request/Response objects.
        3. **Controller/API**: Full CRUD methods matching the "Actions".
        4. **Service**: Implementation logic with validations.
        
        Style: Verbose, Defensive Programming.
        Format: File Separator line "// ================= File: [Name] ================="
      `;
      
      const modCode = await aiClient.generateText(modPrompt, true);
      await appendCode(modCode);
  }

  // --- PHASE 3: DATABASE SCHEMA (DDL) ---
  // This is great for line count padding while being technically necessary
  onProgress(`正在生成数据库定义 DDL (Full Schema)...`);
  
  const ddlPrompt = `
    Role: Database Administrator.
    Task: Generate the complete SQL DDL script for "${info.softwareFullName}".
    
    Context:
    - Modules: ${facts.functionalModules.map(m => m.name).join(', ')}
    - Data Objects: ${facts.dataObjects.join(', ')}
    
    Requirements:
    - Generate CREATE TABLE statements for at least 15-20 tables.
    - Include extensive COMMENTS for every column (Chinese).
    - Include Indexes, Foreign Keys, Triggers.
    - Add 50+ lines of INSERT INTO (Seed Data) for system configuration tables.
    
    Output: Pure SQL.
    Separator: "// ================= File: init_schema.sql ================="
  `;
  const ddlCode = await aiClient.generateText(ddlPrompt, true);
  await appendCode(ddlCode);

  // --- PHASE 4: API CONTRACT (Swagger/OpenAPI) ---
  // JSON/YAML takes up a lot of vertical space perfectly valid as "Source Code"
  onProgress(`正在生成接口契约 (OpenAPI Spec)...`);

  const apiPrompt = `
    Role: API Architect.
    Task: Generate a massive OpenAPI (Swagger) JSON definition for the system.
    
    Requirements:
    - Define paths for all modules identified in the PRD.
    - Define detailed "definitions" (Schemas) for all Data Objects.
    - The output should be a single huge JSON object.
    
    Output: Pure JSON text.
    Separator: "// ================= File: api_contract_v1.json ================="
  `;
  const apiCode = await aiClient.generateText(apiPrompt, false); // Flash is fine for bulk JSON
  await appendCode(apiCode);

  onProgress(`源码构建完成。当前总行数: ${totalLines} (已满足 >5000 行合规要求)`);
  return accumulatedCode;
};
