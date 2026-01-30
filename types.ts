
export type Theme = 'light' | 'dark';

export enum StepStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  WARN = 'warn',
  ERROR = 'error',
  FIXING = 'fixing'
}

// === AI Native Architecture Core Types ===

export type AgentRole = 'CTO' | 'Architect' | 'Developer' | 'DevOps' | 'Auditor' | 'Analyst';

export interface IAgent {
  role: AgentRole;
  name: string;
  description: string;
}

/**
 * Skill 执行的进度回调接口
 * 解耦 UI 日志与业务逻辑
 */
export interface ISkillCallbacks {
  onLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onProgress?: (progress: number) => void;
}

/**
 * 标准化技能接口 (The Atomic Capability)
 * TInput: 输入参数类型
 * TOutput: 输出产物类型
 */
export interface ISkill<TInput = any, TOutput = any> {
  name: string;
  description: string;
  /**
   * 执行技能
   * @param input 输入参数
   * @param context 全局上下文 (Read/Write)
   * @param callbacks 进度回调钩子
   */
  execute(input: TInput, context: PipelineContext, callbacks: ISkillCallbacks): Promise<TOutput>;
}

/**
 * 工作流任务节点 (The Unit of Execution)
 */
export interface IWorkflowTask {
  id: string;
  name: string;
  agent: IAgent;
  /**
   * 任务执行策略
   * @param retryCount 当前重试次数
   * @param maxRetries 最大重试次数
   */
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  run: (context: PipelineContext, callbacks: ISkillCallbacks) => Promise<void>;
}

// ==========================================

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
  role?: AgentRole; 
  metadata?: {
    imageUrl?: string;
    fileCount?: number;
    score?: number;
    durationMs?: number;
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
