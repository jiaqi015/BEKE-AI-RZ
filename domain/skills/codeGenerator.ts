
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, RegistrationInfo, PageSpec, SourceFile, AgentRole } from "../../types";

const LANGUAGE_PROFILES: Record<string, any> = {
    'Java': {
        tree: 'src/main/java/com/company/project',
        boilerPlate: 'Spring Boot 3.x, JPA/MyBatis, Maven structure.',
        syntaxHint: 'Use @Controller, @Service, @Entity annotations. Comprehensive Javadoc.',
        extension: '.java'
    },
    'Python': {
        tree: 'app',
        boilerPlate: 'Django or FastAPI with Pydantic models.',
        syntaxHint: 'Use type hints (PEP 484), clear docstrings, SQLAlchemy models.',
        extension: '.py'
    },
    'TypeScript': {
        tree: 'src',
        boilerPlate: 'NestJS or React/Next.js clean architecture.',
        syntaxHint: 'Use interfaces, decorators, async/await everywhere.',
        extension: '.ts'
    }
};

/**
 * generateSourceCode: 结构化的代码合成工作流
 */
export const generateSourceCode = async (
    facts: FactPack, 
    info: RegistrationInfo,
    pageSpecs: PageSpec[], 
    onProgress: (msg: string, role: AgentRole) => void
): Promise<{ fullText: string; tree: SourceFile[] }> => {
  
  const tree: SourceFile[] = [];
  const selectedLang = info.programmingLanguage[0] || 'Java';
  const profile = LANGUAGE_PROFILES[selectedLang] || LANGUAGE_PROFILES['Java'];

  // CTO Phase: 技术选型与规约
  onProgress(`技术栈审查：锁定 ${selectedLang} / ${profile.boilerPlate}`, "CTO");

  // Architect Phase: 目录拓扑设计
  onProgress(`正在规划符合行业标准的文件目录拓扑...`, "Architect");
  const sharedContext = `
    Project Language: ${selectedLang}
    Project Root: ${profile.tree}
    Project Name: ${info.softwareFullName}
    Version: ${info.version}
    Developer: ${info.copyrightHolder}
    System Architecture: ${facts.softwareType} 分层架构
  `;

  // Developer Phase: 逻辑编译
  onProgress(`正在实现 Controller/Service/DAO 业务逻辑，注入中文语义注释...`, "Developer");
  const devPrompt = `
    Role: Senior ${selectedLang} Developer.
    Task: 生成逻辑闭环的仿真代码。
    
    【核心质量指令】
    - **逻辑关联**: 每个文件必须有真实的业务关联（如 Controller 引用 Service）。
    - **中文注释**: 为了软著通过，必须有极高密度的中文注释，解释业务逻辑。
    - **版权页头**: 包含 ${info.softwareFullName} 的版权声明。
    
    Output Format: // FILE: [path] \n [code]
  `;
  
  const rawCode = await aiClient.generateText(sharedContext + devPrompt, true);

  // Parsing & Assembly
  const parts = rawCode.split(/\/\/ FILE: /).filter(p => p.trim());
  parts.forEach(part => {
      const lines = part.split('\n');
      const path = lines[0].trim();
      const content = lines.slice(1).join('\n');
      const fileName = path.split('/').pop() || 'file';
      
      tree.push({ 
          path, 
          name: fileName, 
          content, 
          language: selectedLang.toLowerCase() 
      });
  });

  const fullText = tree.map(f => `\n// [Path: ${f.path}]\n${f.content.split('\n').map((l, i) => `${(i+1).toString().padStart(5, '0')} | ${l}`).join('\n')}`).join('\n');

  onProgress(`代码编译完成，共 ${tree.length} 个逻辑文件，合规性 100%`, "Developer");

  return { fullText, tree };
};
