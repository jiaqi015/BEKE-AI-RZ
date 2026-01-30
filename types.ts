
export type Theme = 'light' | 'dark';

export enum StepStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  WARN = 'warn',
  ERROR = 'error',
  FIXING = 'fixing'
}

export interface PipelineStep {
  id: number;
  name: string;
  status: StepStatus;
  description: string;
  metrics?: {
    durationMs: number;
    tokenUsage: number;
  };
}

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  metadata?: {
    imageUrl?: string;
  };
}

export interface RegistrationInfo {
  softwareFullName: string;
  softwareAbbreviation: string;
  version: string;
  completionDate: string;
  copyrightHolder: string;
  devHardwareEnv: string;
  runHardwareEnv: string;
  devSoftwareEnv: string;
  runSoftwareEnv: string;
  devTools: string[];
  programmingLanguage: string[];
  sourceLineCount: string;
  isCollaboration: boolean;
}

export interface PageSpec {
  id: string;
  name: string;
  purpose: string;
  fields: string[];
  operations: string[];
  filename: string;
}

export interface SourceFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

export interface AuditIssue {
  severity: 'FATAL' | 'WARN';
  category: string;
  message: string;
  suggestion: string;
}

export interface AuditReport {
  round: number;
  timestamp: string;
  passed: boolean;
  score: number;
  summary: string;
  issues: AuditIssue[];
  fixSummary?: string[];
  manualSuggestions?: string[];
}

export interface Artifacts {
  uiImages: Record<string, string>;
  projectIntroduction?: string;
  appForm?: string;
  userManual?: string;
  sourceCode?: string;
  sourceTree?: SourceFile[];
  auditHistory: AuditReport[];
}

export interface PipelineContext {
  prdContent: string;
  factPack: FactPack | null;
  registrationInfo: RegistrationInfo | null;
  artifacts: Artifacts;
  pageSpecs?: PageSpec[];
}

// 新增：产品导航与视觉规约
export interface NavigationDesign {
  tabs: string[];           // 底部导航栏标签
  activeMapping: Record<string, string>; // 页面名到 Tab 标签的映射关系
  visualTheme: {
    primaryColor: string;
    styleType: 'MAP' | 'FEED' | 'LIST' | 'DASHBOARD';
    description: string;
  };
}

// Structured data extracted from PRD
export interface FactPack {
  softwareNameCandidates: string[];
  softwareType: 'Web' | 'App' | 'Backend' | 'Plugin';
  hasUi: boolean;
  functionalModules: {
    name: string;
    description: string;
  }[];
  coreFeatures: string[];
  businessFlow: string;
  roles: string[];
  dataObjects: string[];
  environmentCandidates: string[];
  // 核心更新：顶层设计规约
  navigationDesign: NavigationDesign; 
}
