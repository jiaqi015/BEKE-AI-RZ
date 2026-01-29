
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec } from "../../types";

/**
 * ==============================================================================
 * ARCHITECTURE: INTERFACE RENDERER V4 (Super Consistency Edition)
 * ==============================================================================
 * 
 * Philosophy: 
 * Consistency is King. All screens for the same app MUST look like siblings.
 * We enforce this by locking the "Design System" and "Bottom Navigation" globally.
 */

interface AppArchetype {
    id: string;
    stylePrompt: string;      // The visual vibe (Colors, Fonts, Spacing)
    tabs: string[];           // The exact labels for the bottom bar
    activeTabMap: Record<string, string>; // Keywords to map PageName -> TabName
}

class DesignSystem {

    static getArchetype(softwareName: string, softwareType: string): AppArchetype {
        const n = softwareName.toLowerCase();
        
        // 1. REAL ESTATE / MAP (e.g. 贝壳/链家/安居客)
        if (n.match(/map|house|travel|taxi|estate|地图|房产|二手房|租房|出行|位置|档案|估价|居|客/)) {
            return {
                id: 'REAL_ESTATE',
                stylePrompt: `
        **DESIGN SYSTEM: Modern Real Estate (Beike/Lianjia Style)**
        - **Palette**: Primary Color #3072F6 (Tech Blue) or #00AE66 (Trust Green). Background #F5F7FA (Light Gray).
        - **Typography**: Clean, Sans-serif, High legibility.
        - **Shapes**: Rounded Cards (Radius 12px), Soft Shadows.
        - **Layout**: Information dense but organized. Card-based lists.
                `,
                tabs: ["首页", "房源", "消息", "我的"],
                activeTabMap: {
                    "首页": "首页", "Home": "首页", "动态": "首页", "推荐": "首页",
                    "房源": "房源", "列表": "房源", "地图": "房源", "档案": "房源", "详情": "房源", "搜索": "房源",
                    "消息": "消息", "聊天": "消息", "咨询": "消息", "通知": "消息",
                    "我的": "我的", "个人": "我的", "设置": "我的", "计算": "我的"
                }
            };
        }

        // 2. IMMERSIVE MEDIA (e.g. 抖音/小红书)
        if (n.match(/video|stream|live|douyin|tiktok|视频|直播|沉浸|播放|动态|书|视/)) {
            return {
                id: 'IMMERSIVE_MEDIA',
                stylePrompt: `
        **DESIGN SYSTEM: Immersive Media (TikTok/RedNote Style)**
        - **Palette**: Dark Mode (Black Background) OR Transparent Overlays.
        - **Accent**: Neon Red (#FE2C55) or Bright Red.
        - **Shapes**: Full screen content. Floating buttons.
        - **Layout**: Edge-to-edge visuals. Minimalist text overlays.
                `,
                tabs: ["首页", "朋友", "消息", "我"],
                activeTabMap: {
                    "首页": "首页", "推荐": "首页", "播放": "首页", "视频": "首页",
                    "朋友": "朋友", "关注": "朋友",
                    "消息": "消息", "私信": "消息", "互动": "消息",
                    "我": "我", "个人": "我", "作品": "我", "赞过": "我"
                }
            };
        }

        // 3. E-COMMERCE (e.g. 淘宝/美团)
        if (n.match(/shop|mall|store|buy|电商|商城|购物|商品|特价|团|购/)) {
            return {
                id: 'ECOMMERCE',
                stylePrompt: `
        **DESIGN SYSTEM: Vibrant E-Commerce (Taobao/Meituan Style)**
        - **Palette**: Warm White Background. Primary #FF5000 (Vibrant Orange/Red).
        - **Shapes**: Rounded edges (8px). Bubbles. Tags.
        - **Layout**: Masonry grids. High density. Colorful icons.
                `,
                tabs: ["首页", "逛逛", "购物车", "我的"],
                activeTabMap: {
                    "首页": "首页", "推荐": "首页", "特价": "首页",
                    "逛逛": "逛逛", "发现": "逛逛", "视频": "逛逛",
                    "购物车": "购物车", "订单": "购物车", "支付": "购物车",
                    "我的": "我的", "个人": "我的", "会员": "我的"
                }
            };
        }

        // 4. DEFAULT / SOCIAL (WeChat Style)
        return {
            id: 'SOCIAL_CLEAN',
            stylePrompt: `
        **DESIGN SYSTEM: Minimalist Social (WeChat/iOS Style)**
        - **Palette**: White/Light Gray #EDEDED. Primary #07C160 (WeChat Green) or #007AFF (iOS Blue).
        - **Shapes**: Standard List Rows. Separator lines.
        - **Layout**: Linear lists. Top Navigation Bar standard.
            `,
            tabs: ["微信", "通讯录", "发现", "我"],
            activeTabMap: {
                "微信": "微信", "消息": "微信", "聊天": "微信", "首页": "微信",
                "通讯录": "通讯录", "联系人": "通讯录", "好友": "通讯录",
                "发现": "发现", "圈": "发现", "动态": "发现",
                "我": "我", "个人": "我", "设置": "我", "详情": "我"
            }
        };
    }

    /**
     * Determine the active tab based on the page name using keyword matching.
     */
    static getActiveTab(pageName: string, archetype: AppArchetype): string | null {
        for (const [key, tab] of Object.entries(archetype.activeTabMap)) {
            if (pageName.includes(key)) return tab;
        }
        // Fallback: If "Detail" or "Login" page, maybe no tab is highlighted, or keep the related one?
        // Let's default to the first tab if it looks like a main landing page, otherwise null (hidden or inactive)
        if (pageName.includes("登录") || pageName.includes("注册") || pageName.includes("启动")) return null;
        
        return archetype.tabs[0]; // Default to Home
    }

    /**
     * Generate the specific prompt for the layout of the current page.
     */
    static getPageLayoutPrompt(spec: PageSpec, archetype: AppArchetype): string {
        // Specific logic to enforce standard layouts based on keywords
        if (spec.name.includes("详情") || spec.name.includes("档案")) {
            return `
        **LAYOUT: DETAIL VIEW (Content Focused)**
        1. **Top**: Standard Nav Bar with Back Button.
        2. **Hero**: Large Image/Carousel (16:9) at top.
        3. **Body**: Vertical scrollable content. Title (Bold), Price/Status (Color), Description (Paragraphs).
        4. **Bottom**: Fixed Action Bar [Contact/Buy Button]. (Tab Bar may be hidden or below).
            `;
        }
        
        if (spec.name.includes("地图") || spec.name.includes("找房")) {
             return `
        **LAYOUT: MAP EXPLORER**
        1. **Full Screen Map**: Vector map background.
        2. **Overlays**: Price Bubbles (Pills) scattered on map.
        3. **Bottom Panel**: Floating Card (white) with list of items.
             `;
        }

        if (spec.name.includes("我的") || spec.name.includes("个人")) {
            return `
        **LAYOUT: PROFILE CENTER**
        1. **Header**: User Avatar + Name + ID (Top section with background color).
        2. **Stats**: Row of numbers (e.g. Viewed, Liked, History).
        3. **Menu**: Vertical list of options (Wallet, Settings, Help) with chevron icons.
            `;
        }

        // Default List/Feed
        return `
        **LAYOUT: STANDARD FEED / LIST**
        1. **Header**: Search bar or Title.
        2. **Content**: Vertical list or grid of cards.
        3. **Card Style**: Image + Title + Subtitle + Action.
        `;
    }
}

// --- MASTER RENDERER ---

export const renderUiImage = async (
    spec: PageSpec, 
    softwareName: string, 
    softwareType: 'Web' | 'App' | 'Backend' | 'Plugin',
    signal?: AbortSignal
): Promise<string | null> => {
    
    // 1. Analyze Context & Consistency Lock
    // Always use "App" logic if it has UI, even if user selected something else, to ensure visual preview is nice.
    const isApp = true; // Force mobile view for consistency in this demo as requested "looks like an app"
    const aspectRatio = "9:16";

    const archetype = DesignSystem.getArchetype(softwareName, softwareType);
    const activeTab = DesignSystem.getActiveTab(spec.name, archetype);
    
    // 2. Build Consistency Components
    const tabBarPrompt = activeTab 
        ? `
    **BOTTOM TAB BAR (MANDATORY)**
    - **Position**: Fixed at very bottom.
    - **Items**: [${archetype.tabs.join('] [')}]
    - **State**: The tab "${activeTab}" MUST be highlighted (Active Color). Others are Gray.
    - **Style**: White background, Thin top border, Standard Icons above Text.
        ` 
        : `**BOTTOM TAB BAR**: Hidden (Full screen mode or Modal).`;

    const canvasPrompt = `
    **RENDER MODE: DIGITAL UI SCREENSHOT**
    - **View**: Orthographic 2D (Front View).
    - **Cropping**: Crop EXACTLY to the screen edges. NO MARGINS. NO PHONES.
    - **Style**: Flat, Clean, Figma Export.
    - **Status Bar**: Include modern status bar at top.
    `;

    const layoutPrompt = DesignSystem.getPageLayoutPrompt(spec, archetype);

    // 3. Construct Final Master Prompt
    const fullPrompt = `
    Role: Senior UI Designer (Consistency Expert).
    Task: Create a **Production-Ready UI Screen** for the app "${softwareName}".
    
    【DESIGN SYSTEM LOCK - MUST FOLLOW】
    ${archetype.stylePrompt}
    
    【NAVIGATION CONSISTENCY】
    ${tabBarPrompt}
    
    【THIS SCREEN SPEC】
    - **Name**: ${spec.name}
    - **Purpose**: ${spec.purpose}
    - **Data**: ${spec.fields.join(', ')}
    - **Language**: Simplified Chinese (简体中文) ONLY.
    
    ${layoutPrompt}
    
    【RESTRICTIONS】
    - NO device frames (phones).
    - NO 3D angles.
    - NO English placeholders (Use "¥", "张三", "北京市").
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
