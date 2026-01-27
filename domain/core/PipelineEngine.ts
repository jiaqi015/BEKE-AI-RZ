
import { PipelineStep, StepStatus, PipelineContext, LogEntry, FactPack, RegistrationInfo, PageSpec, PipelineEngineEvents, AuditReport, Artifacts } from '../../types';
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
  { id: 1, key: 'parse', name: '需求扩写与结构分析', description: '智能意图识别与竞品分析', status: StepStatus.IDLE },
  { id: 2, key: 'gap', name: '信息补全', description: '补全核心申报字段', status: StepStatus.IDLE },
  { id: 3, key: 'ui_gen', name: 'UI 生成', description: 'AI 绘制真实界面截图', status: StepStatus.IDLE },
  { id: 4, key: 'doc_gen', name: '文档编译', description: '组装说明书与申请表', status: StepStatus.IDLE },
  { id: 5, key: 'code_gen', name: '源码构建', description: '基于 UI 蓝图反向生成代码', status: StepStatus.IDLE },
  { id: 6, key: 'pack', name: '审计打包', description: '一致性校验 & Zip导出', status: StepStatus.IDLE },
];

/**
 * PipelineEngine: The central nervous system of the application.
 * Architecture: Singleton Logic / Observer Pattern for UI.
 */
export class PipelineEngine {
  private steps: PipelineStep[] = JSON.parse(JSON.stringify(INITIAL_STEPS));
  private context: PipelineContext = {
    prdContent: '',
    factPack: null,
    registrationInfo: null,
    artifacts: { uiImages: {}, auditHistory: [] }
  };
  private currentStepId: number = 0;
  private isProcessing: boolean = false;
  private abortController: AbortController | null = null;
  private events: PipelineEngineEvents;
  
  // State Lock to prevent race conditions during DB IO
  private isRestored: boolean = false;

  constructor(events: PipelineEngineEvents) {
    this.events = events;
  }

  // --- Public Actions ---

  public async init() {
    await this.restoreSession();
  }

  public async start(rawInput: string) {
    if (this.isProcessing) return;

    // VISIBILITY FIX: Explicitly acknowledge the attachment in the logs
    // so the user knows it's been integrated into the input context.
    const attachMatch = rawInput.match(/\[参考附件: (.*?)\]/);
    if (attachMatch) {
        this.addLog(`📄 已挂载文档: ${attachMatch[1]} (内容已注入AI上下文)`, 'system');
    }

    this.addLog('启动智能意图识别引擎...', 'system');
    await this.step1_Analyze(rawInput);
  }

  public async submitGapInfo(info: RegistrationInfo) {
    // Lock info
    this.updateContext(prev => ({ ...prev, registrationInfo: info }));
    this.updateStepStatus(2, StepStatus.SUCCESS);
    this.addLog('申报信息锁定，启动 UI 渲染引擎...', 'success');
    
    // Chain remaining steps: Gap(2) -> UI(3) -> Docs(4) -> Code(5) -> Audit(6)
    try {
        await this.step3_UiGen();
        await this.step4_Docs();
        await this.step5_Code();
        await this.step6_Audit();
    } catch (e) {
        // Error handling is managed inside executeScopedStep, 
        // but we catch here to prevent unhandled promise rejections if any bubble up.
        console.error("Pipeline chain failed", e);
    }
  }

  public stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.setProcessing(false);
    this.addLog('用户手动终止了流水线', 'warning');
    
    // Reset running steps to idle/error
    this.steps = this.steps.map(s => 
      s.status === StepStatus.RUNNING || s.status === StepStatus.FIXING 
        ? { ...s, status: StepStatus.IDLE } 
        : s
    );
    this.notifySteps();
  }

  /**
   * Skip Audit: Immediately stop Step 6 and mark pipeline as finished (Warn state).
   */
  public skipAudit() {
      if (this.currentStepId !== 6) return;
      
      this.addLog('>>> 用户指令：跳过剩余审计流程，准备强制交付...', 'warning');
      
      // 1. Abort the AI operation
      if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
      }

      // 2. Force state update
      this.setProcessing(false);
      
      // 3. Mark Step 6 as WARN (Finished but skipped)
      // This will trigger the "Finished" state in the UI (isFinished check checks for success OR warn)
      this.updateStepStatus(6, StepStatus.WARN);
      
      // 4. Ensure we have a dummy audit report so export doesn't crash if empty
      if (this.context.artifacts.auditHistory.length === 0) {
          const dummyReport: AuditReport = {
              round: 1,
              timestamp: new Date().toLocaleTimeString(),
              passed: true, // Techincally passed by force
              score: 100, // Default
              summary: "用户跳过审计，强制生成交付物。",
              issues: [],
              fixSummary: ["用户跳过"]
          };
          this.updateContext(prev => ({
            ...prev,
            artifacts: { ...prev.artifacts, auditHistory: [dummyReport] }
          }));
      }

      this.addLog('✅ 已跳过审计，您可以下载现有材料。', 'success');
  }

  public async retry() {
    if (this.isProcessing) return;
    const step = this.steps.find(s => s.id === this.currentStepId);
    if (!step) return;

    this.addLog(`尝试从步骤 [${step.name}] 断点重试...`, 'system');

    try {
      if (this.currentStepId === 1 && this.context.prdContent) {
          await this.step1_Analyze(this.context.prdContent, true);
      } else if (this.currentStepId === 2) {
           // Retry waiting for Gap Info
           this.updateStepStatus(2, StepStatus.RUNNING);
           this.setProcessing(false);
           this.addLog('等待人工补全申报信息...', 'warning');
      } else if (this.currentStepId === 3 && this.context.factPack && this.context.pageSpecs) {
          await this.step3_UiGen(); // UI Gen is now Step 3
          // If successful, continue chain
          if (!this.abortController?.signal.aborted) {
             await this.step4_Docs();
             await this.step5_Code();
             await this.step6_Audit();
          }
      } else if (this.currentStepId >= 4) {
          if (this.currentStepId <= 4) await this.step4_Docs();
          if (this.currentStepId <= 5) await this.step5_Code();
          if (this.currentStepId <= 6) await this.step6_Audit();
      }
    } catch (e) {
      console.error("Retry failed", e);
    }
  }

  public async reset() {
    this.stop();
    await db.clearSession();
    this.steps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    this.context = {
      prdContent: '',
      factPack: null,
      registrationInfo: null,
      artifacts: { uiImages: {}, auditHistory: [] }
    };
    this.currentStepId = 0;
    this.notifyAll();
  }

  // --- Core Architecture: Scoped Execution Wrapper ---

  /**
   * Executes a pipeline step within a controlled scope.
   * Handles: State updates, AbortSignal creation/reset, Timing, Token Tracking, Error Boundary.
   */
  private async executeScopedStep(
    stepId: number, 
    task: (signal: AbortSignal) => Promise<void>
  ) {
      if (this.isProcessing && stepId === 1) return; // Prevent double start
      
      this.resetAbortController();
      this.setProcessing(true);
      this.updateCurrentStepId(stepId);
      this.updateStepStatus(stepId, StepStatus.RUNNING);

      const startTime = Date.now();
      const startToken = aiClient.totalTokenUsage;
      const signal = this.abortController!.signal;

      try {
          await task(signal);
          // NOTE: We do NOT set SUCCESS here for Step 6, as it handles its own status logic
          if (!signal.aborted && stepId !== 6) {
            this.updateStepStatus(stepId, StepStatus.SUCCESS);
          }
      } catch (e: any) {
          if (e.message === "Pipeline Aborted" || e.name === "AbortError") {
              // Graceful stop
              return;
          }
          this.updateStepStatus(stepId, StepStatus.ERROR);
          this.handleError(e);
          throw e; // Re-throw to stop chain
      } finally {
          const duration = Date.now() - startTime;
          const tokens = aiClient.totalTokenUsage - startToken;
          this.updateStepMetrics(stepId, duration, tokens);
          this.saveSnapshot();
      }
  }

  // --- Business Logic Steps ---

  private async step1_Analyze(input: string, skipExpand = false) {
    await this.executeScopedStep(1, async (signal) => {
      let expanded = input;
      if (!skipExpand) {
         expanded = await expandPrd(input, (msg) => this.addLog(msg, 'info'));
      }
      this.checkAbort();

      this.updateContext(prev => ({ ...prev, prdContent: expanded }));
      this.addLog('PRD 锁定', 'success');

      this.addLog('正在解析系统架构...', 'info');
      const facts = await analyzePrd(expanded);
      this.checkAbort();
      
      this.addLog(`识别到软件类型: ${facts.softwareType}`, 'info');
      const pageSpecs = await generatePageSpecs(facts);

      this.updateContext(prev => ({ ...prev, factPack: facts, pageSpecs }));
      this.addLog(`架构蓝图完成: ${pageSpecs.length} 个核心页面`, 'success');
    });

    if (!this.abortController?.signal.aborted) {
        // TRANSITION TO STEP 2: GAP FILLING (Manual)
        this.updateCurrentStepId(2);
        this.updateStepStatus(2, StepStatus.RUNNING);
        this.setProcessing(false); // Pause for user input
        this.addLog('等待人工补全申报信息...', 'warning');
    }
  }

  private async step3_UiGen() {
    await this.executeScopedStep(3, async (signal) => {
       const specs = this.context.pageSpecs!;
       const facts = this.context.factPack!;
       // Use confirmed name if available, otherwise candidates
       const swName = this.context.registrationInfo?.softwareFullName || facts.softwareNameCandidates[0];
       
       // Improved Queue for Concurrency
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
                  const existing = await db.getContent(spec.filename);
                  if (existing) {
                      if (existing instanceof Blob) {
                          const url = URL.createObjectURL(existing);
                          this.updateContext(prev => ({
                              ...prev,
                              artifacts: { ...prev.artifacts, uiImages: { ...prev.artifacts.uiImages, [spec.filename]: url } }
                          }));
                      }
                      continue;
                  }

                  this.addLog(`正在绘制: ${spec.filename} ...`, 'info');
                  const base64 = await renderUiImage(spec, swName, facts.softwareType, signal);
                  
                  if (base64) {
                    const blobUrl = await db.saveBase64Image(spec.filename, base64);
                    this.updateContext(prev => ({
                          ...prev,
                          artifacts: { ...prev.artifacts, uiImages: { ...prev.artifacts.uiImages, [spec.filename]: blobUrl } }
                      }));
                  } else {
                     this.addLog(`⚠️ [${spec.name}] 生成为空，跳过`, 'warning');
                  }
              } catch (err: any) {
                  if (err.name === 'AbortError' || signal.aborted) throw err;
                  this.addLog(`❌ [${spec.name}] 生成失败: ${err.message}`, 'error');
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
       
       this.addLog("正在编制说明书初稿 (Docx)...", 'system');

       let intro = artifacts.projectIntroduction || await generateProjectIntroduction(factPack!, registrationInfo!);
       this.checkAbort();
       if (!artifacts.projectIntroduction) {
           intro = await optimizeDocStructure(intro, 'PROJECT_INTRO', (m) => this.addLog(m, 'info'));
           await db.saveText('projectIntroduction', intro);
       }

       let form = artifacts.appForm || await generateAppForm(factPack!, registrationInfo!);
       this.checkAbort();
       if (!artifacts.appForm) {
          await db.saveText('appForm', form);
       }

       let manual = artifacts.userManual;
       if (!manual) {
          manual = await generateUserManual(factPack!, registrationInfo!, pageSpecs!);
          this.checkAbort();
          manual = await optimizeDocStructure(manual, 'USER_MANUAL', (m) => this.addLog(m, 'info'));
          await db.saveText('userManual', manual);
       }

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
            this.addLog('检测到已有代码，跳过', 'warning');
            return;
        }

        this.addLog('启动源码构建引擎 (Context Aware)...', 'system');
        const code = await generateSourceCode(
            this.context.factPack!, 
            this.context.registrationInfo!, 
            this.context.pageSpecs!, 
            (msg) => {
                this.checkAbort();
                this.addLog(msg, 'info');
            }
        );
        await db.saveText('sourceCode', code);
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
        const maxRetries = 2; // Limit retries to 2 for speed

        while (!passed && loopCount <= maxRetries) {
            this.checkAbort();
            this.addLog(`执行第 ${loopCount + 1} 轮合规审计 (Government Standard)...`, 'system');
            
            // 1. Conduct Audit
            const report = await conductAudit(factPack!, registrationInfo!, currentArtifacts);
            report.round = loopCount + 1;
            report.timestamp = new Date().toLocaleTimeString();

            // 2. Persist INITIAL report (State Checkpoint)
            // This appends a NEW entry for the current round
            this.updateContext(prev => ({
                ...prev,
                artifacts: { ...prev.artifacts, auditHistory: [...prev.artifacts.auditHistory, report] }
            }));

            if (report.passed) {
                this.addLog(`✅ 审计通过 (得分 ${report.score})，完美交付！`, 'success');
                passed = true;
                this.updateStepStatus(6, StepStatus.SUCCESS); // FORCE SUCCESS
            } else {
                if (loopCount < maxRetries) {
                    this.addLog(`⚠️ 审计未通过 (得分 ${report.score})，触发自动精修闭环...`, 'warning');
                    this.updateStepStatus(6, StepStatus.FIXING);
                    
                    // 3. Auto Fix
                    const { artifacts: fixed, fixSummary } = await autoFixArtifacts(
                        currentArtifacts, report, registrationInfo!, (msg) => this.addLog(msg, 'info')
                    );
                    
                    // 4. Update Report with Fix Summary (Update the LAST entry)
                    report.fixSummary = fixSummary;
                    currentArtifacts = { ...currentArtifacts, ...fixed };
                    
                    // Save fixed content
                    if (fixed.projectIntroduction) await db.saveText('projectIntroduction', fixed.projectIntroduction);
                    if (fixed.userManual) await db.saveText('userManual', fixed.userManual);
                    if (fixed.appForm) await db.saveText('appForm', fixed.appForm);

                    // 5. Update state for next loop
                    this.updateContext(prev => {
                        const newHistory = [...prev.artifacts.auditHistory];
                        newHistory[newHistory.length - 1] = report; // Update current round with fixes
                        
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
                    this.addLog(`⚠️ 达到最大修复次数 (${maxRetries})，切换为[人工复核模式]。`, 'warning');
                    report.manualSuggestions = report.issues.map(i => `建议手动修复: ${i.message}`);
                    passed = true;
                    this.updateStepStatus(6, StepStatus.WARN); // FORCE WARN (Finished but imperfect)
                }
            }
        }
     });
     // Final cleanup
     this.setProcessing(false);
  }

  // --- Internals ---

  private async restoreSession() {
      try {
          const session = await db.loadSession();
          if (session && session.currentStepId > 0) {
              this.steps = session.steps;
              this.currentStepId = session.currentStepId;
              
              const ctx = { ...session.context } as PipelineContext;
              if (!ctx.artifacts) ctx.artifacts = { uiImages: {}, auditHistory: [] };
              if (!ctx.artifacts.auditHistory) ctx.artifacts.auditHistory = [];

              const images = await db.getAllImages();
              ctx.artifacts.uiImages = images;

              ctx.artifacts.projectIntroduction = await db.getContent('projectIntroduction') as string;
              ctx.artifacts.userManual = await db.getContent('userManual') as string;
              ctx.artifacts.appForm = await db.getContent('appForm') as string;
              ctx.artifacts.sourceCode = await db.getContent('sourceCode') as string;

              this.context = ctx;
              this.addLog('检测到未完成的工程，已自动恢复现场', 'system');
          }
      } catch (e) {
          console.error("Restore failed", e);
      } finally {
          this.isRestored = true;
          this.notifyAll();
      }
  }

  private saveSnapshot() {
      if (!this.isRestored) return;
      db.saveSession(this.steps, this.context, this.currentStepId).catch(console.error);
  }

  private resetAbortController() {
    this.abortController = new AbortController();
  }

  private checkAbort() {
    if (this.abortController?.signal.aborted) {
        throw new DOMException("Pipeline Aborted", "AbortError");
    }
  }

  private handleError(e: any) {
    if (e.message === "Pipeline Aborted" || e.name === "AbortError") return;
    this.addLog(`系统异常: ${e.message}`, 'error');
  }

  // --- State Updates & Notifications ---

  private updateContext(updater: (prev: PipelineContext) => PipelineContext) {
      if (!this.isRestored) return; 
      this.context = updater(this.context);
      this.events.onContextChange(this.context);
  }

  private updateStepStatus(id: number, status: StepStatus) {
      this.steps = this.steps.map(s => s.id === id ? { ...s, status } : s);
      this.notifySteps();
  }

  private updateStepMetrics(id: number, durationMs: number, tokenUsage: number) {
      this.steps = this.steps.map(s => s.id === id ? { ...s, metrics: { durationMs, tokenUsage } } : s);
      this.notifySteps();
  }

  private updateCurrentStepId(id: number) {
      this.currentStepId = id;
      this.events.onCurrentStepIdChange(id);
  }

  private setProcessing(processing: boolean) {
      this.isProcessing = processing;
      this.events.onProcessingChange(processing);
  }

  private addLog(message: string, type: LogEntry['type']) {
      const entry: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          message,
          type
      };
      this.events.onLog(entry);
  }

  private notifySteps() {
      this.events.onStepStatusChange([...this.steps]);
  }

  private notifyAll() {
      this.events.onStepStatusChange([...this.steps]);
      this.events.onContextChange({ ...this.context });
      this.events.onCurrentStepIdChange(this.currentStepId);
  }
}
