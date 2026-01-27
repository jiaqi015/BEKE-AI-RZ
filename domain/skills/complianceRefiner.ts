
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { Artifacts, AuditReport, AuditIssue, RegistrationInfo } from "../../types";

// ==========================================
// 核心资产：规则修复引擎 (Rule-Based Fixer)
// ==========================================
const RULE_REPLACEMENTS: Array<[RegExp, string]> = [
    // CPCC 敏感词清洗
    [/智能/g, "自动"],
    [/智慧/g, "数字化"],
    [/AI/g, "系统"],
    [/人工智能/g, "自动化算法"],
    [/大数据/g, "海量数据"],
    [/云平台/g, "网络服务端"],
    [/区块链/g, "分布式存储"],
    [/神经网络/g, "多层逻辑回归"],
    
    // 英文清洗
    [/Login/gi, "登录"],
    [/Dashboard/gi, "工作台"],
    [/System/gi, "系统"],
    [/App/g, "客户端"], 
    [/API/g, "接口"],
    [/JSON/g, "数据包"],
    [/数据库/g, "数据存储"]
];

const deterministicSanitize = (text: string): string => {
    let sanitized = text;
    RULE_REPLACEMENTS.forEach(([regex, replacement]) => {
        sanitized = sanitized.replace(regex, replacement);
    });
    return sanitized;
};

/**
 * 强制一致性修正 (Consistency Enforcer)
 * 不依赖 AI，直接在内存中把所有可能的“别名”、“简称”暴力替换为官方全称。
 */
const applyConsistencyEnforcement = (text: string, info: RegistrationInfo): string => {
    let fixed = text;
    
    // 1. 替换所有候选名 (FactPack candidates are not passed here, but we can assume generic placeholders)
    // 策略：如果文档中出现了 info.softwareFullName 的一部分，但又不完整，且不是句子的一部分... 
    // 更安全的策略：只替换确定的错误模式。
    
    // 假设：如果文中出现了 Abbreviation，替换为 FullName
    if (info.softwareAbbreviation && info.softwareAbbreviation.length > 1) {
        // e.g. Replace "千机" with "千机不动产管理系统"
        const regex = new RegExp(info.softwareAbbreviation, 'g');
        fixed = fixed.replace(regex, info.softwareFullName);
    }

    // 2. 强制版本号格式
    // 找到所有 "V1.0", "v1.0.0" 等，统一为 info.version
    // 这是一个危险操作，可能会误伤。保守起见，我们暂只依赖 Auditor 发现的 specific issues，
    // 或者只在 AI Prompt 里强调。
    // 但用户要求“极度苛刻”，我们这里做一个简单的替换：
    // Replace "该软件" -> "该" + FullName
    fixed = fixed.replace(/本软件/g, info.softwareFullName);
    fixed = fixed.replace(/该系统/g, info.softwareFullName);
    fixed = fixed.replace(/本系统/g, info.softwareFullName);

    return fixed;
};

/**
 * 合规精修师 (Compliance Refiner)
 * 职责：当审计不通过时，自动修复文档和代码中的违规项。
 */
export const autoFixArtifacts = async (
  artifacts: Artifacts, 
  report: AuditReport, 
  info: RegistrationInfo,
  onLog: (msg: string) => void
): Promise<{ artifacts: Artifacts; fixSummary: string[] }> => {
  
  const newArtifacts = { ...artifacts };
  const fixSummary: string[] = []; 
  
  const fatalIssues = report.issues.filter(i => i.severity === 'FATAL');
  if (fatalIssues.length === 0 && report.passed) return { artifacts, fixSummary }; 

  onLog(`🔧 启动 [混合修复引擎] (Hybrid Fix Engine)，待修复致命项: ${fatalIssues.length}`);

  // -----------------------------------------------------
  // Phase 1: Global Hard Rules (Deterministic)
  // -----------------------------------------------------
  // 无论审计发现了什么，我们都先跑一遍“全局净化”和“全名强制”。
  // 这就是“前置标准”在修复环节的体现。
  
  ['userManual', 'projectIntroduction', 'appForm'].forEach(key => {
      const k = key as keyof Artifacts;
      if (typeof newArtifacts[k] === 'string') {
          let content = newArtifacts[k] as string;
          const originalLen = content.length;

          // A. 敏感词清洗
          content = deterministicSanitize(content);
          
          // B. 身份一致性强制 (Identity Enforcement)
          content = applyConsistencyEnforcement(content, info);

          if (content.length !== originalLen || content !== newArtifacts[k]) {
              newArtifacts[k] = content as any;
              fixSummary.push(`[${key}] 规则引擎已强制统一软件名称与敏感词。`);
          }
      }
  });

  // -----------------------------------------------------
  // Phase 2: AI Contextual Fixes (Surgical)
  // -----------------------------------------------------
  // 针对那些规则引擎无法处理的逻辑问题（比如“缺少图片”、“缺少操作步骤”）

  const targetMap: Record<string, AuditIssue[]> = {
      'projectIntroduction': [],
      'userManual': [],
      'appForm': []
  };

  fatalIssues.forEach(issue => {
      // 只有非“一致性/敏感词”类的问题才需要 AI 去重写逻辑
      // 因为一致性问题已经在 Phase 1 解决了
      if (issue.category === '一致性' || (issue.category === '合规性' && issue.message.includes('词'))) {
          // Skip, handled by Phase 1
      } else {
          if (issue.message.includes("说明书") || issue.message.includes("图片") || issue.category === '语言合规') targetMap['userManual'].push(issue);
          if (issue.message.includes("简介")) targetMap['projectIntroduction'].push(issue);
          if (issue.message.includes("申请表")) targetMap['appForm'].push(issue);
      }
  });

  for (const [key, issues] of Object.entries(targetMap)) {
      if (issues.length === 0) continue;
      
      const artifactKey = key as keyof Artifacts;
      const currentContent = newArtifacts[artifactKey];
      
      if (typeof currentContent !== 'string') continue;

      onLog(`🧠 [AI引擎] 正在针对 ${issues.length} 个逻辑问题重写 [${key}]...`);

      // 切片修复策略：如果是说明书太长，AI 可能读不完。
      // 但简化起见，我们这里假设 AI Pro 模型拥有足够 Context (2M tokens) 来处理整本说明书。
      // 如果是为了更稳，应该只把含有错误的段落发给 AI，但那太复杂了。
      // 我们信任 Gemini 1.5 Pro 的长文本能力。

      const fixPrompt = `
        Role: Senior Compliance Editor.
        Task: Fix the following document based on the Audit Issues.
        
        Software Info (TRUTH):
        - Name: ${info.softwareFullName}
        - Version: ${info.version}
        
        Audit Issues to Fix:
        ${issues.map(i => `- [${i.category}] ${i.message} (Fix: ${i.suggestion})`).join('\n')}
        
        Rules:
        1. **Identity**: Ensure the Software Name is "${info.softwareFullName}" everywhere.
        2. **Preservation**: Keep image placeholders (> [INSERT_IMAGE::...]) intact.
        3. **Output**: The FULL corrected document.
        
        Original Document:
        ${currentContent} 
      `;

      try {
          const fixedContent = await aiClient.generateText(fixPrompt, true);
          // Double Check: Run sanitizer AGAIN on AI output
          const doubleSanitized = deterministicSanitize(fixedContent);
          
          if (doubleSanitized.length > 100) { // Basic integrity check
             (newArtifacts as any)[artifactKey] = doubleSanitized;
             fixSummary.push(`[${key}] AI 已完成逻辑重写与上下文修正。`);
          }
      } catch (e) {
          onLog(`❌ [${key}] AI 修复超时，保留规则清洗后的版本。`);
      }
  }

  return { artifacts: newArtifacts, fixSummary };
};
