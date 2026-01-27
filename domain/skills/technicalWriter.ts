
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, RegistrationInfo, PageSpec } from "../../types";

// ==========================================
// 核心资产：软著局 (CPCC) 敏感词黑名单 (策略调整版)
// ==========================================
// 策略调整：
// 1. 【致死项 (FATAL)】：涉及到软件分类、功能定义的词。绝对禁止。一旦出现，会导致分类号变更或被要求补充材料。
// 2. 【放行项】：营销类形容词（如“最佳”、“极致”、“高效”）现在允许使用，不再视为违规。
export const CPCC_BLACKLIST = [
  "智能", "人工智能", "AI", "自动分析", "大数据", "云平台", "区块链", "神经网络",
  "Login", "Dashboard", "System", "App", "API" // 英文表头依然是死穴，必须汉化
];

// 【第一层】全局 System Prompt (The Compiler Persona)
const COMPILER_SYSTEM_PROMPT = `
你不是写作助手，你是【中国版权保护中心（CPCC）形式审查仿真器】的反向生成模块。
你的目标是生成一份**绝对能通过审查**的法律技术文档。

【致命红线：功能定义黑名单】
以下词汇涉及特殊的软件分类审批，在普通软著申请中严禁出现，一旦出现会导致直接拒收：
${CPCC_BLACKLIST.join("、")}

【生成策略】
1. **去“AI”化**：把“AI智能分析”改为“数据规则比对”；把“自动推荐”改为“按设定条件检索”。
2. **彻底汉化**：User -> 用户, ID -> 编号, Key -> 键值, Login -> 登录。
3. **一致性铁律**：软件名称必须全字匹配，一个字都不能差。

【自我审查协议】
在输出前，请自查并替换所有“智能”、“AI”字样。
`;

// 【第二层】一致性锁 (加强版)
const CONSISTENCY_LOCK = (info: RegistrationInfo) => `
  【全局一致性锁 (最高优先级)】
  全文档中，指代本软件时，**必须且只能**使用以下官方全称，严禁使用简称或别名：
  - 官方全称：『${info.softwareFullName}』
  - 版本号：『${info.version}』
  
  (如果上下文中出现了其他名称，请强制修正为上述全称)
`;

// --- REGEX SANITIZER (Safety Net) ---
const sanitizeEnglishHeaders = (text: string): string => {
    // Force replace common header slips
    let cleaned = text;
    cleaned = cleaned.replace(/^##\s*Login.*?$/gm, "## 登录页面");
    cleaned = cleaned.replace(/^##\s*Dashboard.*?$/gm, "## 系统主页");
    cleaned = cleaned.replace(/^##\s*User.*?$/gm, "## 用户管理");
    cleaned = cleaned.replace(/^##\s*Settings.*?$/gm, "## 系统设置");
    return cleaned;
};

/**
 * 【新增】软著项目简介 (Project Abstract)
 */
export const generateProjectIntroduction = async (facts: FactPack, info: RegistrationInfo): Promise<string> => {
  const prompt = `
    ${COMPILER_SYSTEM_PROMPT}

    Task: 生成一段【软件项目简介 / 主要功能和技术特点】。
    
    Context:
    - 软件名称: ${info.softwareFullName}
    - 软件类型: ${facts.softwareType}
    - 核心模块: ${facts.functionalModules.map(m => m.name).join('、')}
    
    ${CONSISTENCY_LOCK(info)}

    Requirements:
    1. **字数控制**: 严格控制在 350 - 450 字之间。
    2. **结构**: 
       - 第一段：概述软件定位、适用领域及核心解决的问题（约80字）。
       - 第二段：详细列举主要功能模块及其逻辑关系（约200字）。
       - 第三段：**技术一致性校验** -> 必须基于锁定的编程语言 (${info.programmingLanguage.join(',')}) 和架构阐述技术特点。
    3. **去 AI 化**: 严禁出现“智能”、“赋能”等词汇。
    4. **风格**: 严肃、客观、书面化。
    
    Output: 纯文本段落。
  `;
  return await aiClient.generateText(prompt, true);
};

/**
 * 【01】计算机软件著作权登记申请表
 */
export const generateAppForm = async (facts: FactPack, info: RegistrationInfo): Promise<string> => {
  const prompt = `
    ${COMPILER_SYSTEM_PROMPT}
    
    Task: 生成【01】计算机软件著作权登记申请表 的填写内容参考。
    
    ${CONSISTENCY_LOCK(info)}
    - 软件类型：${facts.softwareType}

    要求：
    - 仅输出纯文本表格形式。
    - 包含字段：软件全称、简称、版本号、分类号（30500-基础软件 或 60000-应用软件）、硬件环境（开发/运行）、软件环境（开发/运行）、编程语言、源程序量、主要功能和技术特点。
    - "主要功能和技术特点"：**必须详细扩写**。请列出至少 5 点主要功能，每点展开描述 50-80 字。最后加上“技术特点”描述（如 B/S 架构、模块化设计、高并发处理等）。总字数不少于 400 字。禁止出现"智能/AI"等词汇。
  `;
  return await aiClient.generateText(prompt, true);
};

/**
 * 【02】软件操作说明书 (User Manual)
 */
export const generateUserManual = async (facts: FactPack, info: RegistrationInfo, pageSpecs: PageSpec[]): Promise<string> => {
  // 构建页面上下文 (Explicit Mapping)
  const pagesContext = pageSpecs.map(p => `
    [页面定义]
    - 中文名称: ${p.name}
    - 唯一图片文件名(Key): ${p.filename}
    - 功能: ${p.purpose}
    - 包含字段 (MUST MENTION): ${p.fields.join(', ')}
    - 包含操作 (MUST MENTION): ${p.operations.join(', ')}
  `).join('\n\n');

  const isApp = facts.softwareType === 'App';
  
  const layoutInstruction = isApp
    ? `**2. 界面布局说明**：
       (描述移动端布局：描述顶部导航栏标题、右上角操作按钮。描述底部标签栏[首页/列表/我的]的选中状态。描述内容区域的卡片式或列表式排版。必须使用中文描述。)`
    : `**2. 界面布局说明**：
       (描述Web端布局：描述顶部Logo和用户信息区。详细描述左侧导航菜单的层级结构。描述右侧内容区域的表格、按钮栏和分页器。必须使用中文描述。)`;

  const prompt = `
    ${COMPILER_SYSTEM_PROMPT}

    Task: 撰写【02】软件操作说明书。
    Target: 软著审查的核心文档，证明软件真实存在且有界面。要求**内容详实、篇幅充足**。
    
    【核心架构指令：用户视角隔离】
    你现在的身份是【产品经理/文档专员】，面向【不懂技术的最终用户】（如行政人员、操作员）。
    ❌ **严禁技术泄漏**：绝对禁止出现“数据库”、“接口”、“API”、“JSON”、“后端”、“代码”、“主键”、“String/Int”、“回调”、“Request/Response”等开发术语。
    ✅ **业务语言**：将 technical fields 自动转译为业务含义（如 'created_at' -> '创建时间', 'status' -> '业务状态'）。
    ✅ **客观陈述**：使用"用户点击..."、"系统显示..."的客观描述。

    Context:
    - 软件类型: ${facts.softwareType} (${isApp ? '移动端 App' : 'Web 端系统'})

    ${CONSISTENCY_LOCK(info)}

    【页面数据源 (Strict Mapping)】
    ${pagesContext}

    【文档结构强制要求】
    请按照上述【页面数据源】的顺序，为每一个页面生成独立章节。
    
    对于每一个页面，严格遵循以下模板：

    ## [页面名称] (必须使用数据源中的中文名称)
    
    **1. 功能概述**：
    (详细描述该页面的业务价值和使用场景，约 100 字。)

    ${layoutInstruction}

    **3. 界面截图**：
    > [INSERT_IMAGE::[图片文件名]]
    (⚠️ 警告：此处必须直接填入数据源中对应的 "唯一图片文件名(Key)"。这个文件名可能包含中文（如 UI_01_登录.png），请**原样复制**，**严禁翻译**或修改后缀。必须精确匹配，否则文档将损坏。)

    **4. 详细字段定义**：
    (请为页面上的每个字段编造详细的表格形式说明，包含：字段名称(中文)、业务含义、录入要求。**注意：必须至少包含以下字段：[该页面的包含字段列表]**)
    
    **5. 用户操作步骤详情**：
    (请列出不少于 5 步的详细操作流程。必须使用祈使句。例如：1. 用户点击“新增”按钮。 2. 系统弹出录入窗口... **注意：步骤中必须提及以下操作按钮：[该页面的包含操作列表]**)
    
    **6. 业务规则说明**：
    (描述该页面的业务限制。不要提权限表或后台逻辑。)

    【排版规则】
    - 每一个页面都必须包含以上 6 个部分，不得简略。
    - 纯文本格式输出 (除了 > [INSERT_IMAGE::...] 标记)。
  `;
  
  const rawText = await aiClient.generateText(prompt, true);
  return sanitizeEnglishHeaders(rawText);
};
