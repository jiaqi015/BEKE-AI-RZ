
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec } from "../../types";

/**
 * ==============================================================================
 * ARCHITECTURE: VIRTUAL DESIGN STUDIO (Master-Sub Agent Pattern)
 * ==============================================================================
 * 
 * 1. Master Agent (Director): Controls Global Style, Brand Colors, and Quality Standards.
 * 2. Data Agent (Content): Injects realistic business scenarios (No "Lorem Ipsum").
 * 3. Layout Agent (Structure): Enforces Platform Shells (iOS/Web) and Component Hierarchy.
 */

// --- 1. GLOBAL DESIGN TOKENS (The "Truth" source for consistency) ---
const DESIGN_SYSTEM = {
    brand: {
        primary: "#1677FF", // Enterprise Blue
        secondary: "#52C41A", // Success Green
        warning: "#FAAD14",
        error: "#FF4D4F",
        bg_app: "#F5F5F7", // iOS System Gray 6
        bg_web: "#F0F2F5", // Ant Design Gray
        text_main: "#1F1F1F",
        text_sub: "#8C8C8C",
        card_bg: "#FFFFFF"
    },
    fonts: {
        app: "San Francisco, PingFang SC, sans-serif",
        web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
    }
};

// --- 2. SUB AGENT: DATA ARCHITECT (Context-Aware Data Generator) ---
// 职责：根据 Software Name 和 Context 深度编造数据，拒绝"示例数据"
class DataAgent {
    static generate(field: string, context: string, softwareName: string): string {
        const f = field.toLowerCase();
        const ctx = (context + softwareName).toLowerCase();
        
        // --- 场景一：房产/物业 ---
        if (ctx.includes('房') || ctx.includes('产') || ctx.includes('物业') || ctx.includes('中介')) {
            if (f.match(/title|name/)) return ['世纪花园三期 8-201', '香榭丽舍 A栋 1204', '龙湖天街 B座 3F'].sort(() => 0.5 - Math.random())[0];
            if (f.match(/price|amount/)) return `¥${(Math.random() * 500 + 200).toFixed(0)}万`;
            if (f.match(/status/)) return '出售中';
            if (f.match(/user|owner/)) return '王建国';
            if (f.match(/tag/)) return '精装修 随时看房';
        }

        // --- 场景二：电商/零售 ---
        if (ctx.includes('商') || ctx.includes('货') || ctx.includes('购') || ctx.includes('店')) {
            if (f.match(/title|name/)) return ['Nike Air Jordan 1 Low', 'iPhone 15 Pro Max 256G', '戴森 V12 吸尘器'].sort(() => 0.5 - Math.random())[0];
            if (f.match(/price|amount/)) return `¥${(Math.random() * 8000 + 500).toFixed(2)}`;
            if (f.match(/status/)) return '待发货';
            if (f.match(/count|stock/)) return '库存: 1,204';
            if (f.match(/user/)) return '李薇薇';
        }

        // --- 场景三：医疗/健康 ---
        if (ctx.includes('医') || ctx.includes('药') || ctx.includes('诊')) {
            if (f.match(/title|name|dept/)) return ['心血管内科-专家号', '核磁共振检查单', '住院部-12床'].sort(() => 0.5 - Math.random())[0];
            if (f.match(/status/)) return '候诊中';
            if (f.match(/user|doctor/)) return '张文宏主任';
            if (f.match(/date/)) return '2024-03-21 09:30';
        }

        // --- 场景四：教育/培训 ---
        if (ctx.includes('教') || ctx.includes('学') || ctx.includes('课')) {
            if (f.match(/title|course/)) return ['2024秋季高等数学(上)', '雅思口语强化班-V2', 'Python数据分析实战'].sort(() => 0.5 - Math.random())[0];
            if (f.match(/status/)) return '进行中';
            if (f.match(/score|grade/)) return '92分';
            if (f.match(/user|student/)) return '陈小明';
        }

        // --- 通用兜底策略 ---
        // 特殊：来源/图标
        if (f.match(/source|icon|来源|图标/)) return '[Logo]';

        // 特殊：标签
        if (f.match(/tag|label|标签/)) 
            return ['【高优先级】', '【内部保密】', '【紧急】'].join(' ');

        // 特殊：摘要/备注
        if (f.match(/summary|desc|备注|说明/)) 
            return '系统自动同步数据，请尽快复核。数据来源：中央服务器。';

        // 人员相关
        if (f.match(/user|name|author|姓名|人员|负责人/)) 
            return ['林峰', '张晓云', '王志强', '陈艾琳'][Math.floor(Math.random() * 4)];
        
        // 状态相关
        if (f.match(/status|state|状态|进度/)) 
            return ['🟢 已完成', '🔵 处理中', '🟠 待审核', '🔴 异常'][Math.floor(Math.random() * 4)];
        
        // 数值/金额
        if (f.match(/price|amount|cost|金额|价格|费用|total/)) 
            return `¥${(Math.random() * 10000 + 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
        
        // 数量
        if (f.match(/count|num|qty|数量|库存/)) 
            return Math.floor(Math.random() * 500 + 50).toString();

        // 时间
        if (f.match(/time|date|at|日期|时间|发布/)) 
            return `2024-03-${Math.floor(Math.random()*28+1).toString().padStart(2,'0')} 09:41`;
        
        return '业务标准数据';
    }

    static generateList(fields: string[], count: number, context: string, softwareName: string): string {
        return Array.from({ length: count }).map((_, idx) => {
            // Slight variation for each row to look natural
            const variation = idx; 
            const rowData = fields.slice(0, 5).map(f => {
                // Generate specific data based on field name
                return `${f}: "${this.generate(f, context, softwareName)}"`;
            }).join(', ');
            return `{ ${rowData} }`;
        }).join('\n      ');
    }
}

// --- 3. SUB AGENT: LAYOUT ENGINE (Platform Specific Shells) ---
// 职责：强制锁死 "Shell"（状态栏、导航栏），确保截图看起来像真机运行。
class LayoutAgent {
    
    // iOS 真机外壳 (High Fidelity)
    static getIOSShell(activeTab: string, pageTitle: string) {
        return `
    【LAYER: IOS 17 SYSTEM SHELL (MANDATORY)】
    - **Visual Style**: Flat, Minimalist, San Francisco Font.
    - **Status Bar (Top)**: 
      - Height: 44px. Background: Transparent.
      - Left: "09:41" (Bold Black). 
      - Center: Dynamic Island (Black Pill Shape).
      - Right: Signal (4 bars), WiFi (3 arcs), Battery (Full Black Icon).
    - **Navigation Bar**:
      - Height: 44px. Background: #FFFFFF.
      - Layout: [ < Back ]   [ **${pageTitle}** ]   [ ... ]
      - Font: PingFang SC Medium, 17pt, #000000.
    - **Bottom Tab Bar**:
      - Height: 83px (including Home Indicator).
      - Background: #FFFFFF with Top Border (0.5px #E5E5E5).
      - Tabs: [🏠 首页] [📂 业务] [📊 报表] [👤 我的].
      - **Active State**: The tab "${activeTab}" is colored **#1677FF (Blue)**. Others are #8C8C8C (Gray).
    - **Home Indicator**: A rounded black bar (width 134px, height 5px) at the very bottom center.
        `;
    }

    // Web 管理后台外壳 (Ant Design Pro Style)
    static getWebShell(softwareName: string, activeMenu: string) {
        return `
    【LAYER: ANT DESIGN PRO SHELL (MANDATORY)】
    - **Visual Style**: Enterprise, Clean, "Ant Design" System.
    - **Sidebar (Left)**:
      - Width: 256px. Background: #001529 (Deep Navy Blue).
      - Logo Area: Height 64px. Logo Icon + "${softwareName}" (White Text).
      - Menu:
        - 📊 工作台 (Dashboard)
        - 📂 列表管理 (Lists)
        - 📝 表单页 (Forms)
        - ⚙️ 系统设置 (Settings)
      - **Active Item**: The menu item corresponding to "${activeMenu}" has a **#1677FF (Blue)** background rectangle.
    - **Header (Top)**:
      - Height: 64px. Background: #FFFFFF. Shadow: 0 1px 4px rgba(0,21,41,0.08).
      - Right Side: [🔍] [❓] [🔔] [Avatar Admin].
    - **Page Header**:
      - Background: #FFFFFF. Padding: 16px 24px.
      - Breadcrumb: Home / ${activeMenu} / Current Page.
      - Title: **${activeMenu}** (20px Bold).
        `;
    }

    static composePrompt(
        type: 'App' | 'Web', 
        pageType: string, 
        spec: PageSpec, 
        dataContext: string,
        softwareName: string
    ): string {
        const isApp = type === 'App';
        
        // Map PageSpec to Shell Context
        let activeTab = '首页';
        if (spec.name.includes('我的') || spec.name.includes('个人')) activeTab = '我的';
        else if (spec.name.includes('报表') || spec.name.includes('统计')) activeTab = '报表';
        else if (spec.name.includes('业务') || spec.name.includes('列表')) activeTab = '业务';
        else if (spec.name.includes('工作台') || spec.name.includes('首页')) activeTab = '首页';

        let activeMenu = '工作台';
        if (spec.name.includes('列表') || spec.name.includes('查询')) activeMenu = '列表管理';
        if (spec.name.includes('新增') || spec.name.includes('编辑')) activeMenu = '表单页';

        const shell = isApp 
            ? this.getIOSShell(activeTab, spec.name) 
            : this.getWebShell(softwareName, activeMenu);

        const mockData = DataAgent.generateList(spec.fields, 4, dataContext, softwareName);

        let layoutDirective = "";

        // 根据页面类型选择最佳布局范式
        switch(pageType) {
            case 'DASHBOARD':
                layoutDirective = `
    **LAYOUT PATTERN: DATA DASHBOARD (驾驶舱)**
    - **Top Stats Row**: 4 White Cards. E.g. "Total Sales", "Visits", "Payments", "Operational Effect".
      - Value: Large Bold Number (e.g. 12,450). Trend: +5% (Green).
    - **Main Chart**: A large white card containing a **Line Chart** (Smooth curves, Blue gradient fill).
    - **Sub Charts**: 
      - Left: Pie Chart ("Distribution").
      - Right: Bar Chart ("Rankings").
                `;
                break;
            case 'TABLE':
                layoutDirective = `
    **LAYOUT PATTERN: DATA GRID (标准列表)**
    - **Filter Bar**: A white card at the top. Inputs: "Search Keyword", "Status Dropdown", "Date Range". Button: "Query" (Blue, Right aligned).
    - **The Grid**:
      - Style: Ant Design Table. White background.
      - Header: Light Gray (#FAFAFA), Bold Text.
      - Rows: 4-5 rows of realistic data.
      - **Content Injection**:
      ${mockData}
      - **Action Column**: Blue Links "View | Edit | More".
    - **Pagination**: "Total 480 items < 1 2 3 ... 10 >" at bottom right.
                `;
                break;
            case 'FORM':
                layoutDirective = `
    **LAYOUT PATTERN: INPUT FORM (信息录入)**
    - **Container**: ${isApp ? 'Grouped Table View (iOS Settings Style)' : 'Centered White Paper Card (Width 800px)'}.
    - **Input Fields**:
      - Render 5-6 fields vertically.
      - Style: Label on Top/Left. Input Box with Border (#D9D9D9).
      - **Pre-filled Data**: Use realistic values like "${DataAgent.generate(spec.fields[0]||'title', dataContext, softwareName)}".
    - **Form Actions**: Fixed Footer with "Submit" (Primary Blue) and "Cancel" buttons.
                `;
                break;
            case 'DETAIL':
                layoutDirective = `
    **LAYOUT PATTERN: INFO DETAIL (详情页)**
    - **Page Header**: Title "${DataAgent.generate('title', dataContext, softwareName)}" with Status Tag [${DataAgent.generate('status', dataContext, softwareName)}].
    - **Description List**: A grid of key-value pairs (Gray Label, Black Text).
    - **Tabs**: [Details] [History] [Logs].
    - **Table Section**: A small table showing "Related Records".
                `;
                break;
            case 'LOGIN':
                layoutDirective = `
    **LAYOUT PATTERN: AUTHENTICATION**
    - **Style**: Modern, High-End, Trustworthy.
    - **Center Card**:
      - Logo Icon (Vector style).
      - Title: "${softwareName}" (Large Bold).
      - Input: "Username" (Icon: User), "Password" (Icon: Lock).
      - Button: "Login" (Full Width, Blue Gradient).
      - Footer: "Copyright © 2024 ${softwareName} Corp".
                `;
                break;
        }

        return `
    ${shell}
    
    【LAYER: CONTENT VISUALS】
    - **Background**: ${isApp ? DESIGN_SYSTEM.brand.bg_app : DESIGN_SYSTEM.brand.bg_web}
    - **Primary Color**: ${DESIGN_SYSTEM.brand.primary} (Blue)
    - **UI Components**: Use "Ant Design" (Web) or "iOS UIKit" (App) standard components.
    - **Shadows**: Soft, diffused shadows (0 4px 12px rgba(0,0,0,0.05)).
    - **Text Rendering**: Sharp, High Contrast, **CHINESE SIMPLIFIED** characters.
    
    ${layoutDirective}
        `;
    }
}

// --- 4. MASTER AGENT: VISUAL DIRECTOR (Orchestrator) ---
// 职责：识别意图，调用子 Agent，组装最终 Prompt，调用 AI。

const identifyPageType = (name: string): string => {
    const n = name.toLowerCase();
    if (n.match(/login|signin|登录|注册/)) return 'LOGIN';
    if (n.match(/dashboard|home|index|主页|概览|驾驶舱/)) return 'DASHBOARD';
    if (n.match(/list|table|search|query|列表|查询|管理/)) return 'TABLE';
    if (n.match(/add|edit|create|config|new|新增|编辑|配置/)) return 'FORM';
    if (n.match(/detail|info|view|详情|信息|查看/)) return 'DETAIL';
    return 'TABLE'; // Default fallback to Table as it's most common in Admin systems
};

export const renderUiImage = async (
    spec: PageSpec, 
    softwareName: string, 
    softwareType: 'Web' | 'App' | 'Backend' | 'Plugin',
    signal?: AbortSignal
): Promise<string | null> => {
    // 1. Context Analysis
    const pageType = identifyPageType(spec.name);
    const isApp = softwareType === 'App';
    const aspectRatio = isApp ? "9:16" : "16:9";

    // 2. Call Layout Agent to build the structural prompt
    const layoutPrompt = LayoutAgent.composePrompt(
        isApp ? 'App' : 'Web', 
        pageType, 
        spec, 
        softwareName, // Context for data generation
        softwareName
    );

    // 3. Construct Final Master Prompt
    const fullPrompt = `
    Role: Expert UI/UX Designer & 3D Renderer.
    Task: Create a **PHOTOREALISTIC SCREENSHOT** of a software interface.
    
    【GLOBAL VISUAL DIRECTIVE】
    1. **Resolution & Fidelity**: 8K Resolution, High DPI, Retina Display. 
       - No blur. No artifacts. Text must be legible.
       - Use "Sub-pixel rendering" style for text sharpness.
    2. **Language**: The UI text MUST be **CHINESE (Simplified)**.
    3. **Style Reference**:
       - ${isApp ? 'iOS 17 Design Kit, Apple Human Interface Guidelines' : 'Ant Design Pro v5, Enterprise Admin Dashboard'}.
       - Clean, Modern, Professional, "Dribbble top shot" quality.
    
    【PAGE CONTEXT】
    - Software: "${softwareName}"
    - Page Title: "${spec.name}"
    - Purpose: "${spec.purpose}"
    
    ${layoutPrompt}
    
    **CRITICAL INSTRUCTION**: 
    - Render specific, realistic business data provided in the prompt (e.g. names, prices, statuses). 
    - DO NOT use "Lorem Ipsum" or "Sample Text". 
    - DO NOT use "XXX" or placeholders. 
    - Populate the grid/form with the JSON data provided above.
    `;

    // 4. Execution
    try {
        const result = await aiClient.generateImage(fullPrompt, aspectRatio, signal);
        if (result) return result;
        throw new Error("AI returned null/empty image");
    } catch (e) {
        if (signal?.aborted) throw e;
        console.warn(`[Visual Director] Generation failed for ${spec.name}, fallback initiated.`, e);
        // Fallback Logic (Simple Canvas)
        return generateFallbackImage(spec.name, isApp ? 'App' : 'Web');
    }
};

// --- Fallback Helper (Legacy) ---
const generateFallbackImage = (title: string, type: 'App' | 'Web'): string => {
    const canvas = document.createElement('canvas');
    canvas.width = type === 'App' ? 1080 : 1920;
    canvas.height = type === 'App' ? 1920 : 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
  
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.fillText('(生成服务繁忙，此为占位)', canvas.width / 2, canvas.height / 2 + 60);
  
    return canvas.toDataURL('image/png').split(',')[1];
  };
