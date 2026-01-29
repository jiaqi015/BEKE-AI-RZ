
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec } from "../../types";

/**
 * UI 渲染引擎 (Visual Simulation Engine) - Pro Edition
 * 升级策略：
 * 1. Data Agent: 预先生成真实的中文业务数据，拒绝 Lorem Ipsum。
 * 2. Visual Agent: 强制注入 "Retina Render" 和 "Ant Design/iOS" 视觉规范。
 * 3. Consistency Shell: 像素级锁死导航栏和状态栏。
 */

type PageType = 'LOGIN' | 'DASHBOARD' | 'TABLE' | 'FORM' | 'DETAIL';

// --- 1. VISUAL DIRECTOR AGENT (视觉总监) ---

const GLOBAL_STYLE = `
【VISUAL DIRECTIVE: PRODUCTION REALISM】
- **Render Engine**: Simulate a "Retina Display" screenshot. NO vector flat art. NO wireframes.
- **Texture**: Subtle gradients, glassmorphism (frosted glass) on overlays, realistic drop-shadows (elevation level 2).
- **Typography**: Use system fonts (San Francisco for App, Inter/Roboto for Web). Anti-aliased text.
- **Color Palette**: 
  - Brand: #1677FF (Enterprise Blue).
  - Success: #52C41A (Green).
  - Warning: #FAAD14 (Gold).
  - Background: #F0F2F5 (Light Gray) - NEVER pure white backgrounds for the whole screen, use cards.
- **Density**: High information density. Professional spacing (8px grid).
`;

const APP_SHELL_DEFINITION = `
【CONSISTENCY SHELL: IOS APP】
You are rendering a screenshot of an iPhone 15 Pro.
1. **Status Bar (Top)**: Time "09:41", Cellular, WiFi, Battery Icon (Black text, transparent bg).
2. **Bottom Tab Bar (Fixed Bottom)**: 
   - Height: 80px, White Blur Background (Glass), Top Border #E5E5E5.
   - 4 Icons with Text: [首页] [业务] [报表] [我的].
   - Active Tab is Blue (#1677FF), others are Gray (#999999).
`;

const WEB_SHELL_DEFINITION = `
【CONSISTENCY SHELL: WEB ADMIN】
You are rendering a screenshot of a Chrome Browser on macOS (1920x1080).
1. **Sidebar (Left, Width 240px)**: 
   - Color: Dark Navy (#001529). 
   - Logo area at top. 
   - Menu Items: White text. Selected item has Blue background (#1677FF).
2. **Header (Top, Height 64px)**: 
   - Color: White. Shadow: Small bottom shadow.
   - Content: Breadcrumb on left, User Avatar & Name on right.
`;

// --- 2. DATA CONTENT AGENT (数据填充专员) ---

// 简单的规则引擎，生成拟真的中文数据
const generateMockValue = (field: string): string => {
    const f = field.toLowerCase();
    if (f.includes('名') || f.includes('user') || f.includes('author')) return ['王伟', '李秀英', '张志强', '陈静'][Math.floor(Math.random()*4)];
    if (f.includes('phone') || f.includes('tel')) return '138****8888';
    if (f.includes('time') || f.includes('date') || f.includes('日期')) return '2024-05-20 14:30';
    if (f.includes('status') || f.includes('状态')) return ['🟢 已完成', '🔵 进行中', '🟠 待审核'][Math.floor(Math.random()*3)];
    if (f.includes('price') || f.includes('amount') || f.includes('金额')) return `¥${(Math.random()*10000).toFixed(2)}`;
    if (f.includes('id') || f.includes('编号')) return `NO.${Math.floor(Math.random()*100000)}`;
    if (f.includes('title') || f.includes('标题')) return '2024年度Q1业务汇报数据概览';
    if (f.includes('desc') || f.includes('备注')) return '系统自动生成的数据快照，请核对。';
    if (f.includes('type') || f.includes('类型')) return '普通类目';
    if (f.includes('count') || f.includes('数量')) return Math.floor(Math.random()*100).toString();
    return '示例数据';
};

const getActiveTab = (pageName: string): string => {
  const name = pageName.toLowerCase();
  if (name.includes('主页') || name.includes('首页') || name.includes('dashboard')) return '首页';
  if (name.includes('我的') || name.includes('个人') || name.includes('设置')) return '我的';
  if (name.includes('统计') || name.includes('报表') || name.includes('分析')) return '报表';
  return '业务';
};

const identifyPageType = (spec: PageSpec): PageType => {
  const name = spec.name.toLowerCase();
  if (name.includes('登录') || name.includes('login') || name.includes('注册')) return 'LOGIN';
  if (name.includes('主页') || name.includes('概览') || name.includes('dashboard')) return 'DASHBOARD';
  if (name.includes('管理') || name.includes('列表') || name.includes('查询') || name.includes('记录')) return 'TABLE';
  if (name.includes('新增') || name.includes('编辑') || name.includes('配置')) return 'FORM';
  return 'DETAIL';
};

// --- 3. SCENE COMPOSER (场景合成器) ---

const getWebTemplate = (type: PageType, spec: PageSpec, softwareName: string) => {
  // Inject Mock Data
  const mockRows = [1, 2, 3].map(() => {
      return spec.fields.slice(0, 5).map(f => `${f}:"${generateMockValue(f)}"`).join(', ');
  }).join('\n      - Row: ');

  const fieldList = spec.fields.slice(0, 6).join(', ');
  const btnList = spec.operations.join('", "');

  let contentInstruction = "";

  switch (type) {
    case 'LOGIN': 
      contentInstruction = `
        **SCENE: LOGIN**
        - Background: High-tech abstract blue particle wave or gradient.
        - Center Card: White glossy card with shadow.
        - Logo: "${softwareName}" (Bold, Blue).
        - Inputs: "请输入账号", "请输入密码".
        - Button: "立即登录" (Full width, Blue gradient).
      `;
      break;
    case 'DASHBOARD': 
      contentInstruction = `
        **SCENE: DASHBOARD**
        - **Cards Row**: 4 cards showing metrics like "总用户数: 12,390", "今日营收: ¥45,000".
        - **Charts**: 
          - Left: Line chart "近30日趋势" (Blue line, smooth curve).
          - Right: Pie chart "数据分布".
        - **Table**: Small table at bottom "最新动态".
      `;
      break;
    case 'TABLE': 
      contentInstruction = `
        **SCENE: DATA GRID**
        - **Container**: White Card with padding.
        - **Toolbar**: Filter inputs (Label: ${spec.fields[0] || '关键字'}), Button "查询" (Blue), Button "${spec.operations[0] || '新建'}" (Primary).
        - **The Grid**:
          - Headers: ${fieldList}, "操作".
          - **Data Rows (RENDER THESE VALUES)**:
            - Row: ${mockRows}
          - Style: Striped rows, Tag for status column.
        - **Pagination**: "共 102 条 < 1 2 3 ... 10 >" at bottom right.
      `;
      break;
    default: // FORM or DETAIL
      contentInstruction = `
        **SCENE: FORM / DETAIL**
        - **Container**: White Card centered.
        - **Header**: Title "${spec.name}".
        - **Form Content**:
          ${spec.fields.map(f => `- Field "${f}": Input showing placeholder "${generateMockValue(f)}"`).join('\n          ')}
        - **Footer**: Buttons "${btnList}" (Align right).
      `;
  }

  return `
    ${GLOBAL_STYLE}
    ${WEB_SHELL_DEFINITION}
    
    **CONTENT AREA (Right side)**:
    - Background: #F0F2F5.
    - Breadcrumb: 首页 / ${spec.name}.
    ${contentInstruction}
  `;
};

const getAppTemplate = (type: PageType, spec: PageSpec, softwareName: string) => {
  const activeTab = getActiveTab(spec.name);
  
  if (type === 'LOGIN') return `
    ${GLOBAL_STYLE}
    **SCENE: MOBILE LOGIN**
    - Background: Pure White.
    - Top: Large Logo Icon + Text "${softwareName}".
    - Middle: 
      - Input "手机号/邮箱"
      - Input "密码"
      - Button "登录" (Blue, Rounded Pill shape, Shadow).
    - Bottom: "其他登录方式" icons (WeChat, Alipay).
  `;

  // Inject Mock Data for List
  const mockCards = [1, 2, 3].map(() => {
      const title = spec.fields[0] || '标题';
      const subtitle = spec.fields[1] || '副标题';
      const status = spec.fields.find(f => f.includes('状态')) || '状态';
      return `- Card: Title "${generateMockValue(title)}", Sub="${generateMockValue(subtitle)}", Status Tag="${generateMockValue(status)}"`;
  }).join('\n      ');

  let contentInstruction = "";
  if (type === 'DASHBOARD') {
      contentInstruction = `
      - **Banner**: Blue Gradient Banner at top showing "今日数据".
      - **Grid Nav**: 2x4 Grid of colorful icons (Function Modules).
      - **News Feed**: List of notification items.
      `;
  } else if (type === 'TABLE') {
      contentInstruction = `
      - **Search Bar**: Grey rounded input "搜索${spec.name}..." at top.
      - **List View**: Vertical scroll list of cards.
      ${mockCards}
      - **Floating Action Button (FAB)**: Blue "+" button at bottom right.
      `;
  } else {
      // Form/Detail
      contentInstruction = `
      - **Grouped List**: iOS Settings style grouped cells.
      ${spec.fields.map(f => `- Cell: Label "${f}" | Value "${generateMockValue(f)}" (Align Right, Grey)`).join('\n      ')}
      - **Action Area**: Fixed bottom button "${spec.operations[0] || '提交'}".
      `;
  }

  return `
    ${GLOBAL_STYLE}
    ${APP_SHELL_DEFINITION}
    - **ACTIVE TAB**: **"${activeTab}"** (Must be BLUE).
    
    **SCREEN CONTENT**:
    - **Nav Bar**: Title "${spec.name}" (Black, Centered). Back Icon on left.
    ${contentInstruction}
  `;
};

// --- FALLBACK MECHANISM ---
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
  ctx.fillText('(图片生成服务繁忙，此为占位)', canvas.width / 2, canvas.height / 2 + 60);

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
  
  // 1. Construct the "Super Prompt"
  const template = isApp 
     ? getAppTemplate(pageType, spec, softwareName) 
     : getWebTemplate(pageType, spec, softwareName);

  const fullPrompt = `
    Role: Expert UI/UX Designer & 3D Renderer.
    Task: Create a **PHOTOREALISTIC SCREENSHOT** of a software interface.
    
    【CRITICAL INSTRUCTIONS】
    1. **Realism**: Look like a real app running on a high-res screen. NOT a sketch. NOT a vector illustration.
    2. **Language**: The UI text MUST be **CHINESE (Simplified)**.
    3. **Data**: Use the provided MOCK DATA values. Do NOT use "Lorem Ipsum" or "Name 1".
    4. **Consistency**: Respect the Shell Definition (Sidebar/Tabbar) exactly.
    
    ${template}
  `;

  try {
      // 2. Call Image Generation
      const result = await aiClient.generateImage(fullPrompt, aspectRatio, signal);
      if (result) return result;
      throw new Error("AI returned null/empty image");
  } catch (e) {
      if (signal?.aborted) throw e;
      console.warn(`[UI Renderer] AI generation failed for ${spec.name}, using local fallback.`, e);
      return generateFallbackImage(spec.name, isApp ? 'App' : 'Web');
  }
};
