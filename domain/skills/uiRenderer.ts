
import { aiClient } from "../../infrastructure/ai/geminiClient";
import { PageSpec } from "../../types";

/**
 * ==============================================================================
 * ARCHITECTURE: UX CINEMATOGRAPHER (Virtual Photography)
 * ==============================================================================
 * 
 * Philosophy: 
 * Instead of asking AI to "draw a UI", we ask it to "photograph a device running the App".
 * This tricks the model into handling lighting, depth, and material correctness much better.
 */

type AppVibe = 'IMMERSIVE_VIDEO' | 'HIGH_DENSITY_RETAIL' | 'MODERN_UTILITY' | 'SOCIAL_CHAT' | 'SAAS_DASHBOARD';

class UXCinematographer {

    static detectVibe(softwareName: string, softwareType: string, pageName: string): AppVibe {
        const n = (softwareName + pageName).toLowerCase();
        
        if (softwareType !== 'App') return 'SAAS_DASHBOARD';

        // 抖音/直播/视频类
        if (n.match(/video|stream|live|play|douyin|tiktok|视频|直播|娱乐|沉浸|播放/)) return 'IMMERSIVE_VIDEO';
        
        // 淘宝/电商/外卖类
        if (n.match(/shop|mall|buy|store|food|cart|电商|商城|购物|外卖|商品|支付/)) return 'HIGH_DENSITY_RETAIL';
        
        // 社交/聊天类
        if (n.match(/chat|social|message|friend|微信|社交|好友|消息|社区/)) return 'SOCIAL_CHAT';

        // 默认工具/地图/阅读类
        return 'MODERN_UTILITY';
    }

    /**
     * 1. The Stage (光影与材质)
     * 定义整个画面的“高级感”来源
     */
    static getStageDirectives(vibe: AppVibe): string {
        const common = `
        **PHOTOGRAPHY SETUP**:
        - **Camera**: Macro lens, 50mm f/1.8. 
        - **Perspective**: Front-facing slightly angled view of a high-end smartphone screen.
        - **Quality**: 8k resolution, Unreal Engine 5 render, Octane Render, Ray Tracing.
        - **Screen**: High DPI Retina Display, perfect anti-aliasing.
        `;

        switch (vibe) {
            case 'IMMERSIVE_VIDEO':
                return `
        ${common}
        - **Lighting**: Cinematic dark room, neon ambient glow (Cyberpunk colors: Purple/Blue) reflecting on the glass edges.
        - **Vibe**: Energetic, Mysterious, Gen-Z.
        - **Material**: Glassmorphism (Frosted glass overlays), glowing text.
                `;
            case 'HIGH_DENSITY_RETAIL':
                return `
        ${common}
        - **Lighting**: Bright studio lighting, soft shadows, warm tone (Inviting).
        - **Vibe**: Busy, Vibrant, "Shopping Festival" excitement.
        - **Material**: Glossy cards, vibrant gradients (Orange/Red), pop-out badges.
                `;
            case 'SAAS_DASHBOARD':
                return `
        ${common}
        - **Lighting**: Clean office daylight, cool white tone.
        - **Vibe**: Professional, Efficient, "Linear/Stripe" aesthetic.
        - **Material**: Matte white surfaces, subtle borders, crisp sans-serif typography.
                `;
            default:
                return `
        ${common}
        - **Lighting**: Natural daylight, minimalist setup.
        - **Vibe**: Clean, Trustworthy, "Apple Design Award" winner style.
        - **Material**: Flat design 2.0, soft drop shadows, rounded corners.
                `;
        }
    }

    /**
     * 2. The Content (具体 UI 元素)
     * 针对不同 App 类型，强制生成特定的 UI 组件，打破“表格魔咒”
     */
    static getContentDirectives(vibe: AppVibe, spec: PageSpec, softwareName: string): string {
        const mockData = `Context: ${softwareName}, Page: ${spec.name}`;
        
        switch (vibe) {
            case 'IMMERSIVE_VIDEO':
                return `
        **UI COMPOSITION: FULL-SCREEN VIDEO FEED (TikTok Style)**
        1. **Background**: A high-quality full-screen video/image of a real person or scene (Life-like).
        2. **Overlay UI (White text with shadow)**:
           - Bottom Left: @Username, Description text (2 lines), Music scrolling ticker.
           - Right Side: Vertical stack of icons [Avatar, Heart, Comment, Share].
        3. **Navigation**: Floating translucent bottom bar [Home, Friend, Inbox, Me].
        4. **Realism**: Ensure the text contrasts well with the background video.
                `;

            case 'HIGH_DENSITY_RETAIL':
                return `
        **UI COMPOSITION: E-COMMERCE WATERFALL (Taobao Style)**
        1. **Header**: Search bar with "Scan" icon + Colorful Banner Carousel (Promotion).
        2. **Main Layout**: Dual-column Masonry Grid (Waterfall flow).
        3. **Card Design**:
           - Product Image (70% height).
           - Title (2 lines black text).
           - Price Tag (Large Red Font "¥299").
           - Badges: "Free Shipping", "Best Seller" (Small rounded tags).
        4. **Floating**: A circular "Cart" or "Top" button on bottom right.
                `;

            case 'SOCIAL_CHAT':
                return `
        **UI COMPOSITION: MESSAGING LIST (WeChat Style)**
        1. **Rows**: List of chat sessions. Avatar (Left, Rounded Square) + Name (Top) + Last Message (Bottom Gray) + Time (Right).
        2. **Styling**: Clean white background, thin gray separators.
        3. **Status**: Red notification dots on some avatars.
        4. **Bottom Bar**: [Chats] [Contacts] [Discover] [Me].
                `;

            case 'SAAS_DASHBOARD':
                return `
        **UI COMPOSITION: ANALYTICS DASHBOARD (B-Side)**
        1. **Layout**: Sidebar Navigation (Dark) + Main Content Area (Light).
        2. **Widgets**:
           - "Total Revenue": Big Number Card + Line Chart trend.
           - "Active Users": Bar Chart.
           - "Recent Activity": Data Table with status badges (Green/Red).
        3. **Style**: High information density, but clean whitespace.
                `;

            default: // MODERN_UTILITY
                return `
        **UI COMPOSITION: MODERN CARD FEED (Airbnb/Uber Style)**
        1. **Cards**: Large, full-width cards with rounded corners (16px).
        2. **Card Content**:
           - High-res Hero Image.
           - Bold Title below image.
           - Meta info row (Rating star, Distance, Price).
        3. **Typography**: Heavy/Bold Headings (iOS Large Title standard).
        4. **Tab Bar**: Blur effect background.
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
    const vibe = UXCinematographer.detectVibe(softwareName, softwareType, spec.name);
    const isApp = softwareType === 'App';
    const aspectRatio = isApp ? "9:16" : "16:9";

    // 2. Build the "Cinematography" Prompt
    const stagePrompt = UXCinematographer.getStageDirectives(vibe);
    const contentPrompt = UXCinematographer.getContentDirectives(vibe, spec, softwareName);
    
    // 3. Construct Final Master Prompt
    // Trick: asking for a "Dribbble Shot" or "Mockup" often yields better UI results than "Screenshot"
    const fullPrompt = `
    Role: World-class UI/UX Designer & 3D Artist.
    Task: Create a **Photorealistic Mockup** of a ${isApp ? 'Mobile App' : 'Web Dashboard'}.
    
    【THE LOOK & FEEL】
    ${stagePrompt}
    
    【THE CONTENT】
    App Name: ${softwareName}
    Screen Name: ${spec.name}
    ${contentPrompt}
    
    【DATA INJECTION】
    - Populate with REALISTIC Chinese data relevant to "${softwareName}".
    - DO NOT use placeholders like "Lorem Ipsum". Use real names, prices, titles.
    - Fields to show: ${spec.fields.join(', ')}.
    
    【CRITICAL RULES】
    1. **NO WIREFRAMES**. This must look like a finished product.
    2. **CHINESE TEXT**. The UI language must be Simplified Chinese.
    3. **AESTHETICS**: High-end, polished, "Apple Design Award" quality.
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
    
    // Modern Gradient Background
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#e0c3fc");
    grd.addColorStop(1, "#8ec5fc");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Glass Card
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 20;
    const padding = 100;
    ctx.roundRect(padding, padding, canvas.width - padding*2, canvas.height - padding*2, 40);
    ctx.fill();
    
    // Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png').split(',')[1];
};
