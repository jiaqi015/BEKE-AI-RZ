
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec } from "../../types";

/**
 * UI 渲染引擎 (Visual Simulation Engine)
 * 职责：将抽象的页面结构 (PageSpec) 转译为高保真、像素级的界面截图。
 * 策略：引入 "Global Visual Frame" (全局视觉框架)，强制所有页面共享同一套外壳。
 */

type PageType = 'LOGIN' | 'DASHBOARD' | 'TABLE' | 'FORM' | 'DETAIL';

// --- CONSISTENCY ENFORCEMENT ---

// 1. 定义死板的全局配色
const GLOBAL_STYLE = `
【GLOBAL DESIGN LANGUAGE】
- Primary Color: **#1677FF (Enterprise Blue)**.
- Background: #F5F7FA (Light Gray).
- Font: Sans-serif, Clean, Modern.
- Icon Style: Outline icons, 2px stroke.
`;

// 2. 定义 App 的“外壳” (Shell) - 必须每个页面都一样
const APP_SHELL_DEFINITION = `
【APP SHELL (MUST BE PRESENT)】
1. **Status Bar** (Top): "12:30", WiFi Icon, Battery 100%. Transparent background.
2. **Bottom Tab Bar** (Fixed Bottom): 
   - Height: 60px, White Background, Top Border #E5E5E5.
   - Items (Left to Right):
     1. **首页** (Icon: Home)
     2. **业务** (Icon: Briefcase/List)
     3. **报表** (Icon: PieChart)
     4. **我的** (Icon: User)
   - *INSTRUCTION*: You MUST render this bottom bar on every page (except Login).
`;

// 3. 辅助函数：决定哪个 Tab 应该高亮
const getActiveTab = (pageName: string): string => {
  const name = pageName.toLowerCase();
  if (name.includes('主页') || name.includes('首页') || name.includes('dashboard')) return '首页';
  if (name.includes('我的') || name.includes('个人') || name.includes('设置')) return '我的';
  if (name.includes('统计') || name.includes('报表') || name.includes('分析')) return '报表';
  return '业务'; // Default for functional pages
};

const identifyPageType = (spec: PageSpec): PageType => {
  const name = spec.name.toLowerCase();
  if (name.includes('登录') || name.includes('login') || name.includes('注册')) return 'LOGIN';
  if (name.includes('主页') || name.includes('概览') || name.includes('dashboard')) return 'DASHBOARD';
  if (name.includes('管理') || name.includes('列表') || name.includes('查询') || name.includes('记录')) return 'TABLE';
  if (name.includes('新增') || name.includes('编辑') || name.includes('配置')) return 'FORM';
  return 'DETAIL';
};

// --- TEMPLATE GENERATORS ---

const getWebTemplate = (type: PageType, spec: PageSpec, softwareName: string) => {
  const layout = `
    **LAYOUT: WEB ADMIN PANEL**
    - **Sidebar (Left)**: Dark Navy (#001529). Logo "${softwareName}" at top. Menu item "${spec.name}" is HIGHLIGHTED (White text, Blue bg).
    - **Header (Top)**: White bg. Breadcrumb: "系统 / ${spec.name}". User Avatar on right.
  `;

  // Inject Strict Data Constraints
  const fieldList = spec.fields.slice(0, 5).map(f => `"${f}"`).join(', ');
  const btnList = spec.operations.map(o => `Button["${o}"]`).join(', ');

  switch (type) {
    case 'LOGIN': return `
        **SCENE: LOGIN PAGE**
        - Background: Modern Corporate Blue/White Gradient.
        - Center Card: Glassmorphism effect, White.
        - Logo: "${softwareName}" clearly visible at top of card.
        - Form: Input "Username", Input "Password", Button "Log In" (#1677FF).
      `;
    case 'DASHBOARD': return `
        ${layout}
        - **Content Area**:
          - 4 Stat Cards (Row 1): Metric Numbers (Big font), Label (Gray).
          - Main Chart (Row 2): Line chart showing trend.
      `;
    case 'TABLE': return `
        ${layout}
        - **Content Area**:
          - White Panel with Shadow.
          - Toolbar: Search Input, ${btnList} (Blue).
          - Data Table: Professional grid, Header row (Gray bg).
          - **MANDATORY HEADERS (MUST RENDER TEXT)**: ${fieldList}, "操作".
          - Rows: 5-6 rows of realistic mock data matching these headers.
      `;
    default: return `
        ${layout}
        - **Content Area**: White Panel containing form inputs or details for "${spec.name}".
        - **MANDATORY BUTTONS**: ${btnList}.
        - **MANDATORY LABELS**: ${fieldList}.
      `;
  }
};

const getAppTemplate = (type: PageType, spec: PageSpec, softwareName: string) => {
  if (type === 'LOGIN') return `
    **SCENE: APP LOGIN**
    - White Background.
    - Top: Logo "${softwareName}" (Big).
    - Middle: Inputs (Phone, Code/Password).
    - Action: "登录" Button (Blue, Rounded).
  `;

  // For all other pages, inject the Shell Logic
  const activeTab = getActiveTab(spec.name);
  const fieldList = spec.fields.slice(0, 4).map(f => `"${f}"`).join(', ');
  const btnList = spec.operations.map(o => `Button "${o}"`).join(', ');
  
  return `
    **SCENE: APP SCREEN - ${spec.name}**
    ${APP_SHELL_DEFINITION}
    - **ACTIVE TAB**: You MUST highlight the icon and text for **"${activeTab}"** in Blue (#1677FF). Others are Gray.
    
    - **Top Nav Bar**: Title "${spec.name}" centered. Back button (<) on left.
    
    - **Main Content**:
      ${type === 'DASHBOARD' ? '- Banner Image.\n      - Grid Menu (8 icons).\n      - Notification Bar.' : ''}
      ${type === 'TABLE' ? `- List View: Cards. Each card MUST show labels: ${fieldList}.\n      - Search bar at top.` : ''}
      ${type === 'FORM' ? `- Input Group: Labels on left (${fieldList}), values on right.\n      - Action: ${btnList} at bottom.` : ''}
      ${type === 'DETAIL' ? `- Info Cards showing: ${fieldList}.\n      - Text descriptions.` : ''}
  `;
};

// --- FALLBACK MECHANISM ---
// 生成一张带有文字的占位图，确保 DOCX 导出时绝对不缺图
const generateFallbackImage = (title: string, type: 'App' | 'Web'): string => {
  const canvas = document.createElement('canvas');
  // 高清分辨率
  canvas.width = type === 'App' ? 1080 : 1920;
  canvas.height = type === 'App' ? 1920 : 1080;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 背景
  ctx.fillStyle = '#f0f2f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 边框
  ctx.strokeStyle = '#d9d9d9';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // 标题
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 50);
  
  // 说明
  ctx.font = '40px sans-serif';
  ctx.fillStyle = '#999999';
  ctx.fillText('(AI 图像生成服务暂时繁忙，此为占位)', canvas.width / 2, canvas.height / 2 + 60);

  // 模拟 UI 结构 (简单的线框)
  ctx.fillStyle = '#e0e0e0';
  if (type === 'Web') {
     ctx.fillRect(0, 0, 250, canvas.height); // Sidebar
     ctx.fillRect(250, 0, canvas.width, 80); // Header
  } else {
     ctx.fillRect(0, canvas.height - 150, canvas.width, 150); // Tabbar
     ctx.fillRect(0, 0, canvas.width, 100); // Navbar
  }

  // 返回纯 Base64 (不带前缀)
  return canvas.toDataURL('image/png').split(',')[1];
};

export const renderUiImage = async (
  spec: PageSpec, 
  softwareName: string, 
  softwareType: 'Web' | 'App' | 'Backend' | 'Plugin',
  signal?: AbortSignal
): Promise<string | null> => {
  const pageType = identifyPageType(spec);
  
  const isApp = softwareType === 'App';
  const aspectRatio = isApp ? "9:16" : "16:9";
  
  const template = isApp 
     ? getAppTemplate(pageType, spec, softwareName) 
     : getWebTemplate(pageType, spec, softwareName);

  const fullPrompt = `
    Role: Expert UI Designer.
    Task: Create a High-Fidelity Mockup for a Software Copyright Application.
    
    ${GLOBAL_STYLE}
    
    TARGET SPEC:
    ${template}
    
    【STRICT RULES - DO NOT HALLUCINATE TEXT】
    1. **Language**: Chinese (Simplified) ONLY. 
    2. **Consistency**: Follow the APP SHELL / WEB LAYOUT exactly.
    3. **Text Constraint**: You MUST ONLY render the text defined in "MANDATORY LABELS/HEADERS". Do not invent random English text like "Lorem Ipsum".
    4. **Realism**: Must look like a real, finished product screenshot. High resolution.
  `;

  try {
      // Retry logic is handled in GeminClient, so here we just call it.
      const result = await aiClient.generateImage(fullPrompt, aspectRatio, signal);
      if (result) return result;
      // 如果 AI 返回 null (可能是安全拦截)，触发兜底
      throw new Error("AI returned null/empty image");
  } catch (e) {
      if (signal?.aborted) throw e;
      console.warn(`[UI Renderer] AI generation failed for ${spec.name}, using local fallback.`, e);
      // 绝对兜底：无论如何返回一张图片，防止文档图片缺失
      return generateFallbackImage(spec.name, isApp ? 'App' : 'Web');
  }
};
