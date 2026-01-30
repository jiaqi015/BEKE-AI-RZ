
export type Theme = 'light' | 'dark';

export enum StepStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  WARN = 'warn',
  ERROR = 'error',
  FIXING = 'fixing'
}

// 新增：Agent 角色定义
export type AgentRole = 'CTO' | 'Architect' | 'Developer' | 'DevOps' | 'Auditor' | 'Analyst';

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
  // 新增：结构化角色标识
  role?: AgentRole;
  metadata?: {
    imageUrl?: string;
    fileCount?: number;
    score?: number;
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

export interface NavigationDesign {
  tabs: string[];
  activeMapping: Record<string, string>;
  visualTheme: {
    primaryColor: string;
    styleType: 'MAP' | 'FEED' | 'LIST' | 'DASHBOARD';
    description: string;
  };
}

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
  navigationDesign: NavigationDesign; 
}
