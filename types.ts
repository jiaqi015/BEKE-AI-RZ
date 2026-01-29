
// ==========================================
// Layer: Domain Entities (Core Business Logic)
// ==========================================

export type Theme = 'light' | 'dark';

export enum StepStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  FIXING = 'fixing',
  SUCCESS = 'success',
  WARN = 'warn',
  ERROR = 'error'
}

export interface FactPack {
  softwareNameCandidates: string[];
  softwareType: 'Web' | 'App' | 'Backend' | 'Plugin';
  hasUi: boolean;
  functionalModules: { name: string; description: string }[];
  coreFeatures: string[];
  businessFlow: string;
  roles: string[];
  dataObjects: string[];
  environmentCandidates: string[];
}

export interface PageSpec {
  id: string;
  name: string;
  purpose: string;
  fields: string[];
  operations: string[];
  filename: string; // e.g., UI_01_Login.png
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

export interface AuditIssue {
  severity: 'FATAL' | 'WARN' | 'INFO';
  category: '一致性' | '合规性' | '完整性' | '语言合规';
  message: string;
  suggestion: string;
  targetArtifact?: 'appForm' | 'userManual' | 'sourceCode' | 'projectIntroduction';
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
  projectIntroduction?: string;
  appForm?: string;
  userManual?: string;
  sourceCode?: string;
  uiImages: Record<string, string>; // filename -> base64/blobUrl
  auditHistory: AuditReport[];
}

// ==========================================
// Layer: Application State (Pipeline Context)
// ==========================================

export interface StepMetrics {
  durationMs: number;
  tokenUsage: number;
}

export interface PipelineStep {
  id: number;
  key: string;
  name: string;
  description: string;
  status: StepStatus;
  metrics?: StepMetrics; 
}

export interface PipelineContext {
  prdContent: string;
  factPack: FactPack | null;
  registrationInfo: RegistrationInfo | null;
  pageSpecs?: PageSpec[];
  artifacts: Artifacts;
}

// ==========================================
// Layer: UI / Presentation
// ==========================================

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  metadata?: {
    imageUrl?: string;
  };
}

// New Interface for Engine Events
export interface PipelineEngineEvents {
  onLog: (entry: LogEntry) => void;
  onStepStatusChange: (steps: PipelineStep[]) => void;
  onContextChange: (ctx: PipelineContext) => void;
  onCurrentStepIdChange: (id: number) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}
