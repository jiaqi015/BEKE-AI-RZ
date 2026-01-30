
import { FactPack, RegistrationInfo } from "../../types";

/**
 * Domain Service: Technology Stack Inference
 * 职责：根据 PRD 分析结果 (FactPack) 推断默认的技术栈配置。
 * 遵循原则：业务逻辑内聚，不依赖 UI。
 */
export class TechStackService {
  
  static inferDefaults(factPack: FactPack | null): Partial<RegistrationInfo> {
    // 防御性检查：如果没有 FactPack，返回空对象防止崩溃
    // 此处修复了 Uncaught TypeError: Cannot read properties of null
    if (!factPack) return {};

    const type = factPack.softwareType;
    const isJava = type === 'Backend';
    const isApp = type === 'App';
    const isWeb = type === 'Web';

    // Intelligence Defaults
    let defaultTools = ['VS Code', 'Git'];
    let defaultLangs = ['TypeScript'];
    let defaultDevEnv = 'macOS Sonoma 14.2 / Windows 11 Pro';
    let defaultRunEnv = 'Linux CentOS 7.9 / Docker';

    if (isJava) {
        defaultTools = ['IntelliJ IDEA', 'MySQL', 'Redis', 'Maven'];
        defaultLangs = ['Java', 'SQL'];
    } else if (isApp) {
        defaultTools = ['Android Studio', 'Xcode', 'Git'];
        defaultLangs = ['Kotlin', 'Swift', 'Dart'];
        defaultDevEnv = 'MacBook Pro M3 (Required for iOS)';
        defaultRunEnv = 'iOS 16+ / Android 13+';
    } else if (isWeb) {
        defaultTools = ['WebStorm', 'VS Code', 'Chrome DevTools'];
        defaultLangs = ['TypeScript', 'Vue.js', 'CSS'];
    }

    return {
      devTools: defaultTools,
      programmingLanguage: defaultLangs,
      devSoftwareEnv: defaultDevEnv,
      runSoftwareEnv: defaultRunEnv,
      // 硬件环境通常有固定基线，也可以在此定义
      devHardwareEnv: 'MacBook Pro; Apple M3 Max; 32G RAM; 1TB SSD',
      runHardwareEnv: isApp ? 'iPhone 14 / Xiaomi 13 (Standard Test Devices)' : 'Linux CentOS 7.9; Intel Xeon Platinum; 8 Core 16G',
    };
  }

  /**
   * 生成自动提交的完整注册信息
   */
  static generateAutoRegistration(factPack: FactPack): RegistrationInfo {
    const defaults = this.inferDefaults(factPack);
    
    return {
      softwareFullName: factPack.softwareNameCandidates[0] || '智能申报系统',
      softwareAbbreviation: '',
      version: 'V1.0.0',
      completionDate: new Date().toISOString().split('T')[0],
      copyrightHolder: '研发技术部',
      devHardwareEnv: defaults.devHardwareEnv || '',
      runHardwareEnv: defaults.runHardwareEnv || '',
      devSoftwareEnv: defaults.devSoftwareEnv || '',
      runSoftwareEnv: defaults.runSoftwareEnv || '',
      devTools: defaults.devTools || [],
      programmingLanguage: defaults.programmingLanguage || [],
      sourceLineCount: '35000',
      isCollaboration: false,
    };
  }
}
