
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec, FactPack, RegistrationInfo } from "../../types";

export const renderUiImage = async (
    spec: PageSpec, 
    info: RegistrationInfo,
    facts: FactPack,
    signal?: AbortSignal
): Promise<string | null> => {
    
    // 1. 获取顶层设计规约
    const { tabs, visualTheme, activeMapping } = facts.navigationDesign;

    // 2. 匹配当前页面应高亮的 Tab
    let activeTab = tabs[tabs.length - 1]; // 默认“我的”
    
    // Updated logic for Array-based activeMapping
    if (activeMapping && Array.isArray(activeMapping)) {
        for (const mapping of activeMapping) {
            if (spec.name.includes(mapping.pageKeyword)) {
                activeTab = mapping.tabName;
                break;
            }
        }
    }

    // 3. 强一致性 Prompt 编排
    const fullPrompt = `
    Role: Senior UI Designer.
    Project: ${info.softwareFullName}
    
    【全链路一致性蓝图】
    - **视觉风格**: ${visualTheme.styleType} 型应用。特点：${visualTheme.description}。
    - **品牌色**: ${visualTheme.primaryColor}。
    - **底部导航栏标签 (必须严格一致)**: [${tabs.join('] [')}]
    - **当前活动状态**: 必须点亮 Tab "${activeTab}"。
    
    【当前页面】
    - **名称**: ${spec.name}
    - **字段内容**: ${spec.fields.join(', ')}
    
    要求：全中文，无手机黑边，2K 高清。
    `;

    try {
        const result = await aiClient.generateImage(fullPrompt, "9:16", signal);
        return result;
    } catch (e) {
        return null;
    }
};
