
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, RegistrationInfo, PageSpec } from "../../types";

export const CPCC_BLACKLIST = ["智能", "AI", "人工智能", "大数据", "云平台", "区块链", "神经网络"];

export const COMPILER_SYSTEM_PROMPT = `
你是一名专业的软件著作权申报专家。
你的任务是根据提供的软件信息，生成符合中国版权保护中心（CPCC）申报要求的技术文档。
要求：
1. 语言严谨、专业，符合官方文档风格。
2. 严禁出现“AI”、“人工智能”、“大数据”等敏感词，请用“自动化算法”、“海量数据分析”等替代。
3. 必须保证文档内容与软件全称、版本号等信息高度一致。
`;

export const CONSISTENCY_LOCK = (info: RegistrationInfo) => `
[强一致性锁定]
- 软件全称：${info.softwareFullName}
- 版本号：${info.version}
- 著作权人：${info.copyrightHolder}
`;

export const sanitizeEnglishHeaders = (text: string): string => {
  return text.replace(/^#+\s+[A-Za-z].*$/gm, (match) => {
    // Replace English headers with generic Chinese module headers to pass compliance
    return match.replace(/[A-Za-z]+/g, '模块');
  });
};

export const generateProjectIntroduction = async (facts: FactPack, info: RegistrationInfo): Promise<string> => {
  const prompt = `
    ${COMPILER_SYSTEM_PROMPT}
    Task: 撰写【项目简介】。
    ${CONSISTENCY_LOCK(info)}
    软件功能模块：${facts.functionalModules.map(m => m.name).join('、')}
    核心业务流程：${facts.businessFlow}
  `;
  return await aiClient.generateText(prompt, true);
};

export const generateAppForm = async (facts: FactPack, info: RegistrationInfo): Promise<string> => {
  const prompt = `
    ${COMPILER_SYSTEM_PROMPT}
    Task: 填写【软件著作权登记申请表】中的核心功能描述。
    ${CONSISTENCY_LOCK(info)}
    主要功能点：${facts.coreFeatures.join('、')}
  `;
  return await aiClient.generateText(prompt, true);
};

export const generateUserManual = async (facts: FactPack, info: RegistrationInfo, pageSpecs: PageSpec[]): Promise<string> => {
  const { tabs } = facts.navigationDesign;

  const pagesContext = pageSpecs.map(p => `
    [页面定义]
    - 中文名称: ${p.name}
    - 唯一图片文件名(Key): ${p.filename}
    - 功能: ${p.purpose}
    - 包含字段: ${p.fields.join(', ')}
  `).join('\n\n');

  const prompt = `
    ${COMPILER_SYSTEM_PROMPT}

    Task: 撰写【02】软件操作说明书。
    
    【顶层导航规约】
    该软件底部导航栏固定包含以下标签：${tabs.join('、')}。
    在描述各个页面布局时，必须提及用户可以通过底部的这些标签进行切换。

    ${CONSISTENCY_LOCK(info)}

    【页面数据源】
    ${pagesContext}

    要求：
    - 在描述“界面布局”时，请务必准确描述底部导航栏的标签内容，使其与上述“顶层导航规约”保持 100% 一致。
    - 禁止出现 AI 幻觉，只使用 facts 提供的标签名。
    - 必须包含详细的操作步骤说明。
    - 必须在适当位置插入图片占位符：> [INSERT_IMAGE::filename.png]
  `;
  
  const rawText = await aiClient.generateText(prompt, true);
  return sanitizeEnglishHeaders(rawText);
};
