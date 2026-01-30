
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
 * 标准化技能接口 (The Atomic Capability)
 */
export interface ISkill<TInput = any, TOutput = any> {
  name: string;
  description: string;
  execute(input: TInput, context: PipelineContext): Promise<TOutput>;
}

/**
 * 工作流任务节点 (The Unit of Execution)
 */
export interface IWorkflowTask {
  id: string;
  name: string;
  agent: IAgent;
  run: (context: PipelineContext) => Promise<void>; // Side-effect or Context Mutation
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
  role?: AgentRole; // Linked to Agent
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
