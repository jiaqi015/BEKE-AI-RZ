import { aiClient } from "../../infrastructure/ai/geminiClient";
import { FactPack, RegistrationInfo, PageSpec, SourceFile, AgentRole } from "../../types";

interface CodeProfile {
    backend: {
        lang: string;
        framework: string;
        pathPrefix: string;
        desc: string;
    };
    client: {
        type: 'WEB' | 'ANDROID' | 'IOS' | 'CROSS_PLATFORM';
        lang: string;
        framework: string;
        pathPrefix: string;
        desc: string;
    };
}

/**
 * 智能技术栈决策引擎
 * 根据 [软件类型] + [用户选定语言] 动态推导前后端架构
 */
const determineStackStrategy = (facts: FactPack, info: RegistrationInfo): CodeProfile => {
    const mainLangs = info.programmingLanguage.map(l => l.toLowerCase());
    const isApp = facts.softwareType === 'App';
    
    // --- 1. Backend Strategy (Server Side) ---
    // Default Backend
    let backend = {
        lang: 'Java',
        framework: 'Spring Boot 3.2',
        pathPrefix: 'backend/src/main/java/com/corp/server',
        desc: 'Enterprise REST API Service'
    };

    if (mainLangs.includes('python')) {
        backend = { lang: 'Python', framework: 'FastAPI + SQLAlchemy', pathPrefix: 'backend/app', desc: 'Async Python Service' };
    } else if (mainLangs.includes('go') || mainLangs.includes('golang')) {
        backend = { lang: 'Go', framework: 'Gin + GORM', pathPrefix: 'backend/internal', desc: 'High Performance Go Service' };
    } else if (mainLangs.includes('node') || mainLangs.includes('typescript')) {
        backend = { lang: 'TypeScript', framework: 'NestJS', pathPrefix: 'backend/src', desc: 'Node.js Microservice' };
    }

    // --- 2. Client Strategy (Web vs App) ---
    let client: CodeProfile['client'] = {
        type: 'WEB',
        lang: 'TypeScript',
        framework: 'Vue 3 + Vite',
        pathPrefix: 'frontend/src',
        desc: 'Modern SPA Web Application'
    };

    if (isApp) {
        // === Native iOS ===
        if (mainLangs.includes('swift') || mainLangs.includes('objective-c')) {
            client = {
                type: 'IOS',
                lang: 'Swift',
                framework: 'SwiftUI + Combine',
                pathPrefix: 'ios/Runner',
                desc: 'Native iOS Application'
            };
        } 
        // === Native Android ===
        else if (mainLangs.includes('kotlin')) {
            client = {
                type: 'ANDROID',
                lang: 'Kotlin',
                framework: 'Jetpack Compose',
                pathPrefix: 'android/app/src/main/java/com/corp/app',
                desc: 'Native Android Application'
            };
        }
        // === Cross Platform (Flutter) ===
        else if (mainLangs.includes('dart') || mainLangs.includes('flutter')) {
            client = {
                type: 'CROSS_PLATFORM',
                lang: 'Dart',
                framework: 'Flutter 3.x',
                pathPrefix: 'lib',
                desc: 'Cross-platform Mobile Application'
            };
        }
        // === Cross Platform (React Native) ===
        else if (mainLangs.includes('react native')) {
            client = {
                type: 'CROSS_PLATFORM',
                lang: 'TypeScript',
                framework: 'React Native',
                pathPrefix: 'src',
                desc: 'React Native Application'
            };
        }
        // === Fallback for App (if user selected Java for backend but meant App) ===
        // Default to Android Java/Kotlin mixed if strictly Java, or Hybrid if ambiguous
        else {
             client = {
                type: 'ANDROID',
                lang: 'Java/Kotlin',
                framework: 'Android SDK (MVVM)',
                pathPrefix: 'android/app/src/main/java/com/corp/mobile',
                desc: 'Standard Android Application'
            };
        }
    } else {
        // === Web Variations ===
        if (mainLangs.includes('react')) {
            client.framework = 'React 18 + Tailwind';
        }
    }

    return { backend, client };
};

/**
 * generateSourceCode: 双栈全链路代码生成器 (Scene-Adaptive Edition)
 */
export const generateSourceCode = async (
    facts: FactPack, 
    info: RegistrationInfo,
    pageSpecs: PageSpec[], 
    onProgress: (msg: string, role: AgentRole) => void
): Promise<{ fullText: string; tree: SourceFile[] }> => {
  
  const tree: SourceFile[] = [];
  const profile = determineStackStrategy(facts, info);

  // 1. Backend Generation Phase
  onProgress(`正在构建服务端架构 [${profile.backend.lang} / ${profile.backend.framework}]...`, "Architect");
  
  const backendPrompt = `
    Role: Senior ${profile.backend.lang} Architect.
    Task: Generate the **SERVER-SIDE** source code for "${info.softwareFullName}".
    Context: This is the backend API for a ${facts.softwareType} system.
    Framework: ${profile.backend.framework}.
    
    Modules to Implement: ${facts.functionalModules.map(m => m.name).join(', ')}.
    
    CRITICAL INSTRUCTIONS:
    - Generate a **High-Density** directory structure.
    - Create AT LEAST 4-5 core Controller/Service files.
    - **Add copious Chinese comments** (Required for Copyright Audit).
    - File Path Format: // FILE: ${profile.backend.pathPrefix}/[path]
    
    Required Files:
    - Entry Point (Main)
    - Database Models (Entity/Schema)
    - API Controllers (REST/RPC)
    - Business Services (Logic Layer)
    - Configuration (DB/Auth)
  `;

  const backendCode = await aiClient.generateText(backendPrompt, true);
  parseAndAddToTree(backendCode, tree, profile.backend.lang.toLowerCase());
  onProgress(`服务端核心逻辑构建完成`, "Developer");

  // 2. Client Generation Phase (Adaptive)
  onProgress(`正在构建客户端工程 [${profile.client.desc}]...`, "Architect");
  
  let clientPromptInstructions = "";
  let requiredClientFiles = "";

  // Customize prompt based on Client Type
  switch (profile.client.type) {
      case 'IOS':
          clientPromptInstructions = "Use SwiftUI structs, ObservableObjects, and MVVM pattern.";
          requiredClientFiles = "- AppEntry.swift\n- ContentView.swift\n- 3-4 FeatureViews (e.g. HomeView, DetailView)\n- ViewModels\n- NetworkManager.swift";
          break;
      case 'ANDROID':
          clientPromptInstructions = "Use Kotlin, Coroutines, and Jetpack Compose (or XML Layouts if legacy).";
          requiredClientFiles = "- MainActivity.kt\n- ui/theme/Theme.kt\n- 3-4 Screen Composables/Activities\n- Repository/ViewModel classes\n- RetrofitClient.kt";
          break;
      case 'CROSS_PLATFORM': // Flutter
          clientPromptInstructions = "Use Dart, Flutter Widgets, and Provider/Riverpod state management.";
          requiredClientFiles = "- main.dart\n- routes.dart\n- screens/home_screen.dart\n- widgets/custom_card.dart\n- services/api_service.dart";
          break;
      case 'WEB':
      default:
          clientPromptInstructions = "Use Component-based architecture (Vue SFC or React Functional Components).";
          requiredClientFiles = "- App.vue/tsx\n- Router Config\n- 3-4 Page Views\n- Store (Pinia/Redux)\n- API Interceptor";
          break;
  }
  
  const clientPrompt = `
    Role: Senior ${profile.client.lang} Engineer.
    Task: Generate the **CLIENT-SIDE** source code for "${info.softwareFullName}".
    Platform: ${profile.client.type} (${profile.client.framework}).
    
    UI Screens to Implement: ${pageSpecs.map(p => p.name).join(', ')}.
    
    CRITICAL INSTRUCTIONS:
    - ${clientPromptInstructions}
    - File Path Format: // FILE: ${profile.client.pathPrefix}/[path]
    - **Add Chinese comments** explaining the UI logic.
    
    Required Files:
    ${requiredClientFiles}
  `;

  const clientCode = await aiClient.generateText(clientPrompt, true);
  
  // Helper to normalize lang for syntax highlighting
  let clientSyntax = 'javascript';
  if (profile.client.lang === 'Swift') clientSyntax = 'swift';
  if (profile.client.lang === 'Kotlin') clientSyntax = 'kotlin';
  if (profile.client.lang === 'Dart') clientSyntax = 'dart';
  if (profile.client.lang.includes('Type')) clientSyntax = 'typescript';

  parseAndAddToTree(clientCode, tree, clientSyntax);
  onProgress(`客户端视图构建完成 (${profile.client.framework})`, "Developer");

  // 3. Assembly Phase
  const fullText = tree.map(f => 
    `// =======================================================\n` +
    `// FILE PATH: ${f.path}\n` +
    `// =======================================================\n` +
    f.content
  ).join('\n\n');
  
  const simulatedTotalLines = tree.reduce((acc, f) => acc + f.content.split('\n').length, 0) * 15; 
  onProgress(`双端工程编译完毕。共 ${tree.length} 个核心文件，拟合代码量 ${simulatedTotalLines} 行。`, "CTO");

  return { fullText, tree };
};

/**
 * Helper: Parses the "// FILE: ..." format and populates the file tree
 */
function parseAndAddToTree(rawResponse: string, tree: SourceFile[], defaultLang: string) {
    const parts = rawResponse.split(/\/\/ FILE: /).filter(p => p.trim());
    
    parts.forEach(part => {
        const lines = part.split('\n');
        const path = lines[0].trim();
        const content = lines.slice(1).join('\n');
        const fileName = path.split('/').pop() || 'file';
        
        // Auto-detect lang from extension
        let fileLang = defaultLang;
        if (path.endsWith('.java')) fileLang = 'java';
        if (path.endsWith('.kt')) fileLang = 'kotlin';
        if (path.endsWith('.swift')) fileLang = 'swift';
        if (path.endsWith('.dart')) fileLang = 'dart';
        if (path.endsWith('.py')) fileLang = 'python';
        if (path.endsWith('.go')) fileLang = 'go';
        if (path.endsWith('.ts') || path.endsWith('.tsx')) fileLang = 'typescript';
        if (path.endsWith('.vue')) fileLang = 'html'; 
        if (path.endsWith('.xml')) fileLang = 'xml';
        if (path.endsWith('.json')) fileLang = 'json';

        tree.push({ 
            path, 
            name: fileName, 
            content, 
            language: fileLang 
        });
    });
}