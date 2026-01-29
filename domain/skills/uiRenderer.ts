
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec } from "../../types";

/**
 * ==============================================================================
 * ARCHITECTURE: INTERFACE DESIGNER (Digital Export)
 * ==============================================================================
 * 
 * Philosophy: 
 * Pure Digital Design. No Camera. No Lighting. No Desk.
 * Just the pixels on the screen, exported from Figma.
 */

type AppVibe = 'IMMERSIVE_MEDIA' | 'ECOMMERCE_DENSE' | 'SOCIAL_CLEAN' | 'UTILITY_MAP' | 'ENTERPRISE_DASHBOARD';

class InterfaceDesigner {

    static detectVibe(softwareName: string, softwareType: string, pageName: string): AppVibe {
        const n = (softwareName + pageName).toLowerCase();
        
        if (softwareType !== 'App') return 'ENTERPRISE_DASHBOARD';

        // 抖音/直播/视频/沉浸
        if (n.match(/video|stream|live|douyin|tiktok|视频|直播|沉浸|播放|动态/)) return 'IMMERSIVE_MEDIA';
        
        // 淘宝/电商/外卖/密集信息
        if (n.match(/shop|mall|store|buy|电商|商城|购物|商品|特价|首页/)) return 'ECOMMERCE_DENSE';
        
        // 社交/列表/聊天
        if (n.match(/chat|social|message|friend|微信|社交|消息|通讯录/)) return 'SOCIAL_CLEAN';

        // 地图/房产/打车
        if (n.match(/map|house|travel|taxi|地图|房产|出行|位置/)) return 'UTILITY_MAP';

        // 默认通用
        return 'SOCIAL_CLEAN';
    }

    /**
     * 1. The Canvas (画布设定)
     * 定义“设计原稿”的质感，拒绝摄影感
     */
    static getCanvasDirectives(vibe: AppVibe): string {
        const common = `
        **RENDER STYLE: DIRECT FIGMA EXPORT**
        - **View**: Flat 2D, Front-facing, Full Screen. 
        - **Quality**: Vector-like sharpness, No artifacts, No blur, No lens distortion.
        - **Frame**: **NO DEVICE FRAME**. Just the UI screen rectangle.
        - **Background**: The UI fills the entire image canvas.
        - **Typography**: San Francisco (iOS) or Roboto (Android). Crisp and legible.
        `;

        switch (vibe) {
            case 'IMMERSIVE_MEDIA':
                return `
        ${common}
        - **Theme**: Dark Mode (Transparent overlays on full-screen content).
        - **Palette**: Neon accents, White text with shadow.
                `;
            case 'ECOMMERCE_DENSE':
                return `
        ${common}
        - **Theme**: Light/White Background.
        - **Palette**: Vibrant (Orange/Red) for CTA and Prices.
        - **Density**: High. Lots of cards and images.
                `;
            case 'ENTERPRISE_DASHBOARD':
                return `
        ${common}
        - **Theme**: Professional Light Grey / White.
        - **Palette**: Enterprise Blue (#1890ff).
        - **Structure**: Grid system, precise alignment.
                `;
            default:
                return `
        ${common}
        - **Theme**: Clean White / Minimalist.
        - **Palette**: Brand colors based on context.
                `;
        }
    }

    /**
     * 2. The Layout (组件布局)
     * 纯粹描述 UI 结构，去除环境描述
     */
    static getLayoutDirectives(vibe: AppVibe, spec: PageSpec, softwareName: string): string {
        switch (vibe) {
            case 'IMMERSIVE_MEDIA':
                return `
        **LAYOUT: IMMERSIVE FEED (Like Douyin/TikTok)**
        1. **Background**: A high-quality full-screen real-world photo (Portrait) representing the content.
        2. **Overlay Controls**:
           - **Bottom Left**: User Name (@Name), Description (2 lines), Music Info. (White text).
           - **Right Side**: Vertical column of icons: [Avatar], [Heart], [Comment], [Share].
        3. **Bottom Nav**: Floating translucent bar: [Home] [Friends] [+] [Inbox] [Me].
                `;

            case 'ECOMMERCE_DENSE':
                return `
        **LAYOUT: SHOPPING WATERFALL (Like Taobao)**
        1. **Top Bar**: Search input field with "Camera" icon.
        2. **Banner**: Colorful marketing carousel at top.
        3. **Grid**: 2-Column Masonry Layout (Product Cards).
           - Image (Top).
           - Title (2 lines, Black).
           - Price (Large Red, e.g., ¥199).
           - Tags (Small Red badge "Free Shipping").
        4. **Bottom Nav**: Standard Tab Bar: [Home] [Cart] [Orders] [Me].
                `;

            case 'UTILITY_MAP':
                return `
        **LAYOUT: MAP SERVICE (Like Beike/Uber)**
        1. **Background**: Full screen map view (Vector map style).
        2. **Pins**: Multiple location markers with price tags (e.g., "450万") scattered on map.
        3. **Bottom Card**: A floating white card at the bottom (taking up 30% height).
           - Content: House/Car details (Thumbnail + Title + Price).
           - Action Button: "Contact Agent" (Blue).
                `;

            case 'ENTERPRISE_DASHBOARD':
                return `
        **LAYOUT: ADMIN DASHBOARD**
        1. **Sidebar**: Left vertical menu (Dark blue background).
        2. **Header**: Top white bar with Breadcrumbs and User Avatar.
        3. **Content**:
           - **Stats Row**: 4 Summary Cards (Total Sales, Visits, etc).
           - **Main Chart**: A large Line/Bar chart in a white card.
           - **Data Table**: A grid with headers (Name, Status, Date, Action) and 5 rows of data.
                `;

            default: // SOCIAL_CLEAN
                return `
        **LAYOUT: STANDARD LIST (iOS Style)**
        1. **Header**: Large Title "${spec.name}" (Align Left).
        2. **List**: Vertical list of items.
           - Row Style: Icon/Image (Left) + Title/Subtitle (Middle) + Arrow/Status (Right).
           - Separators: Thin gray lines.
        3. **Bottom Nav**: Standard Tab Bar with icons.
                `;
        }
    }
}

// --- MASTER RENDERER ---

export const renderUiImage = async (
    spec: PageSpec, 
    softwareName: string, 
    softwareType: 'Web' | 'App' | 'Backend' | 'Plugin',
    signal?: AbortSignal
): Promise<string | null> => {
    
    // 1. Analyze Context
    const vibe = InterfaceDesigner.detectVibe(softwareName, softwareType, spec.name);
    const isApp = softwareType === 'App';
    const aspectRatio = isApp ? "9:16" : "16:9"; // 保持屏幕比例，不带外壳

    // 2. Build the "Design Export" Prompt
    const canvasPrompt = InterfaceDesigner.getCanvasDirectives(vibe);
    const layoutPrompt = InterfaceDesigner.getLayoutDirectives(vibe, spec, softwareName);
    
    // 3. Construct Final Master Prompt
    const fullPrompt = `
    Role: Expert UI Designer.
    Task: Export a **High-Fidelity UI Design Mockup** (Figma Export).
    
    【VISUAL STYLE】
    ${canvasPrompt}
    
    【UI CONTENT】
    App Name: ${softwareName}
    Screen: ${spec.name}
    ${layoutPrompt}
    
    【DATA POPULATION (CRITICAL)】
    - **LANGUAGE**: MUST BE **SIMPLIFIED CHINESE** (简体中文). NO ENGLISH PLACEHOLDERS.
    - **REALISM**: Use realistic Chinese names, prices (¥), and addresses.
    - **Fields to Include**: ${spec.fields.join(', ')}.
    
    【RESTRICTIONS】
    1. **NO DEVICE FRAME**. Do not render a phone or laptop bezel. Just the screen.
    2. **NO 3D ANGLES**. Front view only.
    3. **NO SKEUOMORPHISM**. Use modern Flat/Material/iOS design.
    `;

    // 4. Execution
    try {
        const result = await aiClient.generateImage(fullPrompt, aspectRatio, signal);
        if (result) return result;
        throw new Error("AI returned null");
    } catch (e) {
        if (signal?.aborted) throw e;
        return generateFallbackImage(spec.name, isApp ? 'App' : 'Web');
    }
};

// --- Fallback (Canvas) ---
const generateFallbackImage = (title: string, type: 'App' | 'Web'): string => {
    const canvas = document.createElement('canvas');
    canvas.width = type === 'App' ? 1080 : 1920;
    canvas.height = type === 'App' ? 1920 : 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Clean White Background for Design Draft
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Wireframe Box
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 4;
    const padding = 80;
    ctx.strokeRect(padding, padding, canvas.width - padding*2, canvas.height - padding*2);
    
    // Title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2);
    
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('UI Design Placeholder', canvas.width / 2, canvas.height / 2 + 80);
    
    return canvas.toDataURL('image/png').split(',')[1];
};
