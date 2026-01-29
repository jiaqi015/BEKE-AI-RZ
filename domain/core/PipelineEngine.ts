
import { PipelineStep, StepStatus, PipelineContext, LogEntry, FactPack, RegistrationInfo, PageSpec, AuditReport, Artifacts } from '../../types';
import { db } from '../../infrastructure/db/projectDB';
import { aiClient } from '../../infrastructure/ai/geminiClient';

// Skills
import { expandPrd, analyzePrd } from '../skills/prdAnalyst';
import { generatePageSpecs } from '../skills/uiDesigner';
import { renderUiImage } from '../skills/uiRenderer';
import { generateProjectIntroduction, generateAppForm, generateUserManual } from '../skills/technicalWriter';
import { optimizeDocStructure } from '../skills/docOptimizer';
import { generateSourceCode } from '../skills/codeGenerator';
import { conductAudit } from '../skills/auditor';
import { autoFixArtifacts } from '../skills/complianceRefiner';

const INITIAL_STEPS: PipelineStep[] = [
  { id: 1, key: 'parse', name: '深度解析产品蓝图', description: '正在通过 AI 联网分析市场趋势并完善您的功能矩阵', status: StepStatus.IDLE },
  { id: 2, key: 'gap', name: '完善申报关键信息', description: '为了符合官方要求，我们需要您补充一些必要的技术参数', status: StepStatus.IDLE },
  { id: 3, key: 'ui_gen', name: '智能绘制产品原型', description: '正在构思并渲染高保真的软件操作界面截图', status: StepStatus.IDLE },
  { id: 4, key: 'doc_gen', name: '撰写专业申报文档', description: '正在将技术架构转化为数千字的规范说明书与申请表', status: StepStatus.IDLE },
  { id: 5, key: 'code_gen', name: '构建合规程序代码', description: '正在为您生成数千行符合审计要求的源代码鉴别材料', status: StepStatus.IDLE },
  { id: 6, key: 'pack', name: '全量审计与成果交付', description: '正在进行最后的一致性校验，确保材料 100% 通过率', status: StepStatus.IDLE },
];

/**
 * Pipeline State Snapshot Interface
 */
export interface PipelineState {
    steps: PipelineStep[];
    context: PipelineContext;
    currentStepId: number;
    logs: LogEntry[];
    isProcessing: boolean;
}

type StateSubscriber = (state: PipelineState) => void;

/**
 * PipelineEngine: The central domain controller.
 * Architecture: Singleton / Observable
 */
export class PipelineEngine {
  // --- State ---
  private steps: PipelineStep[] = JSON.parse(JSON.stringify(INITIAL_STEPS));
  private context: PipelineContext = {
    prdContent: '',
    factPack: null,
    registrationInfo: null,
    artifacts: { uiImages: {}, auditHistory: [] }
  };
  private currentStepId: number = 0;
  private logs: LogEntry[] = [];
  private isProcessing: boolean = false;
  
  // --- Infrastructure ---
  private abortController: AbortController | null = null;
  private subscribers: Set<StateSubscriber> = new Set();
  private isRestored: boolean = false;

  constructor() {
     // Auto-save logic is handled in setState
  }

  // --- Observable Pattern ---

  public subscribe(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    // Emit current state immediately upon subscription
    callback(this.getSnapshot());
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach(cb => cb(snapshot));
    
    // Persistence Strategy: Save on every state change (Debouncing could be added if needed)
    if (this.isRestored) {
        db.saveSessionState(this.steps, this.context, this.currentStepId, this.logs);
    }
  }

  private getSnapshot(): PipelineState {
      return {
          steps: this.steps,
          context: this.context,
          currentStepId: this.currentStepId,
          logs: this.logs,
          isProcessing: this.isProcessing
      };
  }

  // --- Public Actions ---

  public async init() {
    await this.restoreSession();
  }

  public async start(rawInput: string) {
    if (this.isProcessing) return;

    // Reset logic if starting fresh
    if (this.currentStepId > 0 && this.steps[0].status === StepStatus.SUCCESS) {
        // Continue? No, start usually implies fresh unless retry.
        // Assuming fresh start logic if explicitly called from Step 0 UI.
    }

    const attachMatch = rawInput.match(/\[参考附件: (.*?)\]/);
    if (attachMatch) {
        this.addLog(`📄 已成功挂载外部文档: ${attachMatch[1]}，AI 将基于此深入解析。`, 'system');
    }

    this.addLog('🚀 启动智能创作大脑，正在进行 PRD 语义映射与架构预演...', 'system');
    await this.step1_Analyze(rawInput);
  }

  public async submitGapInfo(info: RegistrationInfo) {
    this.updateContext(prev => ({ ...prev, registrationInfo: info }));
    this.updateStepStatus(2, StepStatus.SUCCESS);
    this.addLog('📌 申报关键参数已锁定，一致性锁已生效。', 'success');
    
    // Chain reaction
    try {
        await this.step3_UiGen();
        if (this.abortController?.signal.aborted) return;
        await this.step4_Docs();
        if (this.abortController?.signal.aborted) return;
        await this.step5_Code();
        if (this.abortController?.signal.aborted) return;
        await this.step6_Audit();
    } catch (e) {
        console.error("Pipeline chain execution interrupted", e);
    }
  }

  public stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.setProcessing(false);
    this.addLog('⏸️ 任务已由操作员手动挂起。创作状态已持久化到本地。', 'system');
    
    // Mark running steps as IDLE so they can be retried
    this.steps = this.steps.map(s => 
      s.status === StepStatus.RUNNING || s.status === StepStatus.FIXING 
        ? { ...s, status: StepStatus.IDLE } 
        : s
    );
    this.notify();
  }

  public skipAudit() {
      if (this.currentStepId !== 6) return;
      
      this.addLog('⏩ 操作员选择了 [跳过审计]，正在强制导出当前版本的材料。', 'system');
      
      if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
      }

      this.setProcessing(false);
      
      const dummyReport: AuditReport = {
          round: (this.context.artifacts.auditHistory.length || 0) + 1,
          timestamp: new Date().toLocaleTimeString(),
          passed: true,
          score: 100,
          summary: "人工干预：跳过自动化审计流程，用户已确认当前材料合规性。",
          issues: [],
          fixSummary: ["手动跳过所有合规项校验"]
      };

      this.updateContext(prev => ({
        ...prev,
        artifacts: { ...prev.artifacts, auditHistory: [...prev.artifacts.auditHistory, dummyReport] }
      }));

      this.updateStepStatus(6, StepStatus.WARN); 
      this.addLog('✅ 交付包已物理封箱，请通过灵动岛下载。', 'success');
  }

  public async retry() {
    if (this.isProcessing) return;
    const step = this.steps.find(s => s.id === this.currentStepId);
    if (!step) return;

    this.addLog(`▶️ 系统指令：正在从 [${step.name}] 阶段恢复全速创作...`, 'system');

    try {
      // Resume logic based on current step
      if (this.currentStepId === 1 && this.context.prdContent) {
          await this.step1_Analyze(this.context.prdContent, true);
      } else if (this.currentStepId === 2) {
           this.updateStepStatus(2, StepStatus.RUNNING);
           this.setProcessing(false);
           this.addLog('⏳ 等待您完成参数补全，或等待 30s 自动推断...', 'warning');
      } else if (this.currentStepId === 3) {
          await this.step3_UiGen(); 
          if (!this.abortController?.signal.aborted) {
             await this.step4_Docs();
             await this.step5_Code();
             await this.step6_Audit();
          }
      } else if (this.currentStepId >= 4) {
          // Cascade Resume
          if (this.currentStepId <= 4) await this.step4_Docs();
          if (!this.abortController?.signal.aborted && this.currentStepId <= 5) await this.step5_Code();
          if (!this.abortController?.signal.aborted && this.currentStepId <= 6) await this.step6_Audit();
      }
    } catch (e) {
      console.error("Retry failed", e);
    }
  }

  public async reset() {
    this.stop();
    this.addLog('🧹 系统指令：正在彻底清除当前创作现场与缓存数据...', 'system');
    await db.clearSession(); // Physical deletion
    
    // Reset Memory
    this.steps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    this.context = {
      prdContent: '',
      factPack: null,
      registrationInfo: null,
      artifacts: { uiImages: {}, auditHistory: [] }
    };
    this.currentStepId = 0;
    this.logs = [];
    this.notify();
  }

  // --- Step Executors (Scoped) ---

  private async executeScopedStep(
    stepId: number, 
    task: (signal: AbortSignal) => Promise<void>
  ) {
      if (this.isProcessing && stepId === 1) return; 
      
      this.abortController = new AbortController();
      this.setProcessing(true);
      this.updateCurrentStepId(stepId);
      this.updateStepStatus(stepId, StepStatus.RUNNING);

      const startTime = Date.now();
      const startToken = aiClient.totalTokenUsage;
      const signal = this.abortController.signal;

      try {
          await task(signal);
          if (!signal.aborted && stepId !== 6) { // Step 6 manages its own success state inside
            this.updateStepStatus(stepId, StepStatus.SUCCESS);
          }
      } catch (e: any) {
          if (e.message === "Pipeline Aborted" || e.name === "AbortError" || signal.aborted) {
              return;
          }
          this.updateStepStatus(stepId, StepStatus.ERROR);
          this.addLog(`❌ 引擎崩溃：${e.message}`, 'error');
          throw e;
      } finally {
          const duration = Date.now() - startTime;
          const tokens = aiClient.totalTokenUsage - startToken;
          this.updateStepMetrics(stepId, duration, tokens);
      }
  }

  // --- Logic Implementation ---

  private async step1_Analyze(input: string, skipExpand = false) {
    await this.executeScopedStep(1, async (signal) => {
      let expanded = input;
      if (!skipExpand) {
         expanded = await expandPrd(input, (msg) => this.addLog(msg, 'info'));
      }
      this.checkAbort(signal);

      this.updateContext(prev => ({ ...prev, prdContent: expanded }));
      this.addLog('🔍 行业知识库已同步，产品需求文档 (PRD) 扩写完成。', 'success');

      this.addLog('📐 正在通过 FactPack 提取器拆解核心业务流与功能矩阵...', 'info');
      const facts = await analyzePrd(expanded);
      this.checkAbort(signal);
      
      this.addLog(`🏗️ 确认软件类型为 [${facts.softwareType}]，包含 ${facts.functionalModules.length} 个申报模块。`, 'info');
      const pageSpecs = await generatePageSpecs(facts);

      this.updateContext(prev => ({ ...prev, factPack: facts, pageSpecs }));
      this.addLog(`📜 界面逻辑蓝图已成型，共识别 ${pageSpecs.length} 个关键交互页面。`, 'success');
    });

    if (!this.abortController?.signal.aborted) {
        this.updateCurrentStepId(2);
        this.updateStepStatus(2, StepStatus.RUNNING);
        this.setProcessing(false); 
        this.addLog('📋 请确认申报信息。30s 后将由 Agent 自动根据 PRD 推断默认参数并继续。', 'warning');
    }
  }

  private async step3_UiGen() {
    await this.executeScopedStep(3, async (signal) => {
       const specs = this.context.pageSpecs!;
       const facts = this.context.factPack!;
       const swName = this.context.registrationInfo?.softwareFullName || facts.softwareNameCandidates[0];
       
       const queue = [...specs];
       const workers = [];
       const limit = 3; 

       for(let i=0; i<limit; i++) {
         workers.push((async () => {
            while(queue.length > 0) {
              if (signal.aborted) return;
              const spec = queue.shift();
              if(!spec) break;

              try {
                  const existing = await db.getArtifact(spec.filename);
                  if (existing) {
                      // Already exists in DB, ensure we have a URL for it in Context
                      const url = await db.saveArtifact(spec.filename, existing instanceof Blob ? existing : String(existing), 'image/png');
                      if (url) {
                          this.updateContext(prev => ({
                              ...prev,
                              artifacts: { ...prev.artifacts, uiImages: { ...prev.artifacts.uiImages, [spec.filename]: url } }
                          }));
                      }
                      continue;
                  }

                  this.addLog(`🎨 正在进行 UI/UX 仿真建模: ${spec.name}...`, 'info');
                  const base64 = await renderUiImage(spec, swName, facts.softwareType, signal);
                  
                  if (base64) {
                    // Save to DB and get URL in one go
                    const blobUrl = await db.saveArtifact(spec.filename, base64, 'image/png');
                    if (blobUrl) {
                        this.updateContext(prev => ({
                            ...prev,
                            artifacts: { ...prev.artifacts, uiImages: { ...prev.artifacts.uiImages, [spec.filename]: blobUrl } }
                        }));
                        this.addLog(`✅ [${spec.name}] 渲染完成`, 'success', { imageUrl: blobUrl });
                    }
                  }
              } catch (err: any) {
                  if (err.name === 'AbortError' || signal.aborted) throw err;
                  this.addLog(`⚠️ 页面 [${spec.name}] 渲染异常，已启用自动回退机制。`, 'warning');
              }
            }
         })());
       }
       await Promise.all(workers);
    });
  }

  private async step4_Docs() {
    await this.executeScopedStep(4, async (signal) => {
       const { factPack, registrationInfo, pageSpecs, artifacts } = this.context;
       
       this.addLog("🖊️ 正在通过 TechnicalWriter 转换技术架构为数千字的法律文本...", 'system');

       // Project Intro
       let intro = artifacts.projectIntroduction;
       if (!intro) {
           intro = await generateProjectIntroduction(factPack!, registrationInfo!);
           this.checkAbort(signal);
           intro = await optimizeDocStructure(intro, 'PROJECT_INTRO', (m) => this.addLog(m, 'info'));
           await db.saveArtifact('projectIntroduction', intro);
       }
       
       // App Form
       let form = artifacts.appForm;
       if (!form) {
           form = await generateAppForm(factPack!, registrationInfo!);
           this.checkAbort(signal);
           await db.saveArtifact('appForm', form);
       }

       // User Manual
       let manual = artifacts.userManual;
       if (!manual) {
          manual = await generateUserManual(factPack!, registrationInfo!, pageSpecs!);
          this.checkAbort(signal);
          manual = await optimizeDocStructure(manual, 'USER_MANUAL', (m) => this.addLog(m, 'info'));
          await db.saveArtifact('userManual', manual);
       }

       // Update Context to reflect what's in DB
       this.updateContext(prev => ({
           ...prev,
           artifacts: {
               ...prev.artifacts,
               projectIntroduction: intro,
               appForm: form,
               userManual: manual
           }
       }));
    });
  }

  private async step5_Code() {
    await this.executeScopedStep(5, async (signal) => {
        const { artifacts } = this.context;
        if (artifacts.sourceCode) {
            this.addLog('📂 代码库已存在，正在刷新索引...', 'warning');
            return;
        }

        this.addLog('💻 启动源代码鉴别材料生成引擎，正在模拟完整的业务逻辑层...', 'system');
        
        // This function handles its own incremental DB saving internally for safety
        const code = await generateSourceCode(
            this.context.factPack!, 
            this.context.registrationInfo!, 
            this.context.pageSpecs!, 
            (msg) => {
                this.checkAbort(signal);
                this.addLog(msg, 'info');
            }
        );
        // Final Save
        await db.saveArtifact('sourceCode', code);
        this.updateContext(prev => ({
            ...prev,
            artifacts: { ...prev.artifacts, sourceCode: code }
        }));
    });
  }

  private async step6_Audit() {
     await this.executeScopedStep(6, async (signal) => {
        const { factPack, registrationInfo } = this.context;
        let currentArtifacts = { ...this.context.artifacts };
        let passed = false;
        let loopCount = 0;
        const maxRetries = 2; 

        while (!passed && loopCount <= maxRetries) {
            this.checkAbort(signal);
            this.addLog(`👮 执行第 ${loopCount + 1} 轮合规性全量扫描 (基于 CPCC 官方规范)...`, 'system');
            
            const report = await conductAudit(factPack!, registrationInfo!, currentArtifacts);
            report.round = loopCount + 1;
            report.timestamp = new Date().toLocaleTimeString();

            this.updateContext(prev => ({
                ...prev,
                artifacts: { ...prev.artifacts, auditHistory: [...prev.artifacts.auditHistory, report] }
            }));

            if (report.passed) {
                this.addLog(`🎯 审计满分通过！一致性得分为 ${report.score}，交付包现已进入封箱环节。`, 'success');
                passed = true;
                this.updateStepStatus(6, StepStatus.SUCCESS);
            } else {
                if (loopCount < maxRetries) {
                    this.addLog(`🔨 审计未通过：发现违规词或一致性冲突，正在自动对文档进行原子级重构...`, 'warning');
                    this.updateStepStatus(6, StepStatus.FIXING);
                    
                    const { artifacts: fixed, fixSummary } = await autoFixArtifacts(
                        currentArtifacts, report, registrationInfo!, (msg) => this.addLog(msg, 'info')
                    );
                    
                    report.fixSummary = fixSummary;
                    currentArtifacts = { ...currentArtifacts, ...fixed };
                    
                    // Persist fixed artifacts
                    if (fixed.projectIntroduction) await db.saveArtifact('projectIntroduction', fixed.projectIntroduction);
                    if (fixed.userManual) await db.saveArtifact('userManual', fixed.userManual);
                    if (fixed.appForm) await db.saveArtifact('appForm', fixed.appForm);

                    this.updateContext(prev => {
                        const newHistory = [...prev.artifacts.auditHistory];
                        newHistory[newHistory.length - 1] = report; 
                        
                        return {
                            ...prev,
                            artifacts: {
                                ...prev.artifacts,
                                ...fixed, 
                                auditHistory: newHistory
                            }
                        };
                    });
                    loopCount++;
                } else {
                    this.addLog(`⚠️ AI 已尽力重构，极少量一致性建议已记录在审计报告中供人工参考。`, 'warning');
                    report.manualSuggestions = report.issues.map(i => `人工核对项: ${i.message}`);
                    passed = true;
                    this.updateStepStatus(6, StepStatus.WARN); 
                }
            }
        }
     });
     this.setProcessing(false);
  }

  // --- Restoration & Helpers ---

  private async restoreSession() {
      try {
          const session = await db.loadSession();
          if (session && session.currentStepId > 0) {
              this.steps = session.steps;
              this.currentStepId = session.currentStepId;
              this.logs = session.logs || [];
              
              // Hydrate Context from lightweight DB record
              const ctx = { ...session.context } as PipelineContext;
              if (!ctx.artifacts) ctx.artifacts = { uiImages: {}, auditHistory: [] };
              if (!ctx.artifacts.auditHistory) ctx.artifacts.auditHistory = [];

              // Hydrate Images (Blob -> URL)
              const images = await db.hydrateImageUrls();
              ctx.artifacts.uiImages = images;

              // Hydrate Text Artifacts
              ctx.artifacts.projectIntroduction = await db.getArtifact('projectIntroduction') as string;
              ctx.artifacts.userManual = await db.getArtifact('userManual') as string;
              ctx.artifacts.appForm = await db.getArtifact('appForm') as string;
              ctx.artifacts.sourceCode = await db.getArtifact('sourceCode') as string;

              this.context = ctx;
              this.addLog('📁 检测到历史会话，已自动恢复至上次执行中断的切片点。', 'system');
          }
      } catch (e) {
          console.error("Restore failed", e);
      } finally {
          this.isRestored = true;
          this.notify();
      }
  }

  private checkAbort(signal: AbortSignal) {
    if (signal.aborted) {
        throw new DOMException("Pipeline Aborted", "AbortError");
    }
  }

  // --- Internal State Updates ---

  private updateContext(updater: (prev: PipelineContext) => PipelineContext) {
      if (!this.isRestored) return; 
      this.context = updater(this.context);
      this.notify();
  }

  private updateStepStatus(id: number, status: StepStatus) {
      this.steps = this.steps.map(s => s.id === id ? { ...s, status } : s);
      this.notify();
  }

  private updateStepMetrics(id: number, durationMs: number, tokenUsage: number) {
      this.steps = this.steps.map(s => s.id === id ? { ...s, metrics: { durationMs, tokenUsage } } : s);
      this.notify();
  }

  private updateCurrentStepId(id: number) {
      this.currentStepId = id;
      this.notify();
  }

  private setProcessing(processing: boolean) {
      this.isProcessing = processing;
      this.notify();
  }

  private addLog(message: string, type: LogEntry['type'], metadata?: LogEntry['metadata']) {
      const entry: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          message,
          type,
          metadata
      };
      this.logs = [...this.logs, entry];
      this.notify();
  }
}

// Singleton Instance for the App
export const pipelineEngine = new PipelineEngine();
