
import { StepStatus, PipelineStep, LogEntry, PipelineContext, RegistrationInfo, IWorkflowTask } from '../../types';
import { db } from '../../infrastructure/db/projectDB';
import { logStream } from './LogStream';
import { WorkflowEngine } from './WorkflowEngine';
import { 
  Agents, 
  PrdExpansionSkill, 
  DomainModelingSkill, 
  UiPlanningSkill,
  UiRenderingSkill,
  DocGenerationSkill,
  CodeGenerationSkill,
  AuditSkill 
} from '../skills/SkillAdapters';

export interface PipelineState {
    steps: PipelineStep[];
    context: PipelineContext;
    currentStepId: number;
    logs: LogEntry[];
    isProcessing: boolean;
}

/**
 * PipelineEngine (Application Layer)
 * Orchestrates the "ChenXinSoft" specific business process.
 * Acts as the bridge between UI (React) and the Domain (Workflow/Skills).
 */
class PipelineEngine {
    private workflowEngine = new WorkflowEngine();
    
    private state: PipelineState = {
        steps: [
            { id: 1, name: '需求深度分析', status: StepStatus.IDLE, description: '语义解析与业务建模' },
            { id: 2, name: '信息缺失补全', status: StepStatus.IDLE, description: '自动推断软著申报所需环境信息' },
            { id: 3, name: 'UI 界面设计', status: StepStatus.IDLE, description: '生成符合行业原期的界面设计图' },
            { id: 4, name: '申报文档撰写', status: StepStatus.IDLE, description: '编制申请表、说明书与技术简介' },
            { id: 5, name: '源代码编译', status: StepStatus.IDLE, description: '生成符合语言规范的高仿真源代码' },
            { id: 6, name: '合规性审计', status: StepStatus.IDLE, description: 'CPCC 形式审查规则自动核验与修复' },
        ],
        context: {
            prdContent: '',
            factPack: null,
            registrationInfo: null,
            artifacts: { uiImages: {}, auditHistory: [] },
            pageSpecs: []
        },
        currentStepId: 0,
        logs: [],
        isProcessing: false
    };

    private subscribers: ((state: PipelineState) => void)[] = [];

    constructor() {
        // Subscribe to LogStream to update React state
        logStream.subscribe((entry) => {
            this.state.logs.push(entry);
            this.notify();
        });
    }

    // === State Management ===

    async init() {
        const session = await db.loadSession();
        if (session) {
            this.state.steps = session.steps;
            this.state.context = session.context as PipelineContext;
            this.state.currentStepId = session.currentStepId;
            this.state.logs = session.logs;
            const images = await db.hydrateImageUrls();
            this.state.context.artifacts.uiImages = images;
            this.notify();
        }
    }

    subscribe(callback: (state: PipelineState) => void) {
        this.subscribers.push(callback);
        callback(this.state);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    private notify() {
        this.subscribers.forEach(s => s({ ...this.state }));
        // Debounce DB save ideally, but keeping simple for now
        db.saveSessionState(
            this.state.steps, 
            this.state.context, 
            this.state.currentStepId, 
            this.state.logs
        );
    }

    private updateStepStatus(id: number, status: StepStatus, metrics?: any) {
        const step = this.state.steps.find(s => s.id === id);
        if (step) {
            step.status = status;
            if (metrics) step.metrics = metrics;
        }
        this.notify();
    }

    // === Public Actions ===

    async start(rawInput: string) {
        if (this.state.isProcessing) return;
        this.state.isProcessing = true;
        this.state.context.prdContent = rawInput;
        this.state.currentStepId = 1;
        this.notify();
        try {
            await this.runStage1();
        } catch (e) {
            console.error(e);
            logStream.emit(`Pipeline Error: ${e}`, 'error', 'CTO');
            this.state.isProcessing = false;
            this.notify();
        }
    }

    async submitGapInfo(info: RegistrationInfo) {
        this.state.context.registrationInfo = info;
        this.updateStepStatus(2, StepStatus.SUCCESS);
        this.state.currentStepId = 3;
        this.state.isProcessing = true;
        this.notify();
        await this.runRemainingStages();
    }

    async stop() {
        this.state.isProcessing = false;
        this.notify();
    }

    async retry() {
        this.state.isProcessing = true;
        this.notify();
        // Determine where to resume based on currentStepId
        if (this.state.currentStepId === 1) await this.runStage1();
        else if (this.state.currentStepId >= 3) await this.runRemainingStages();
    }

    async skipAudit() {
        this.updateStepStatus(6, StepStatus.SUCCESS);
        this.state.isProcessing = false;
        this.notify();
    }

    async reset() {
        await db.clearSession();
        window.location.reload();
    }

    // === Workflow Definitions (The "Plans") ===

    private async runStage1() {
        this.updateStepStatus(1, StepStatus.RUNNING);
        const startTime = Date.now();

        // Define Tasks for Stage 1
        const tasks: IWorkflowTask[] = [
            {
                id: 'expand_prd', name: 'Expand PRD', agent: Agents.Analyst,
                run: async (ctx) => {
                    const skill = new PrdExpansionSkill();
                    ctx.prdContent = await skill.execute(ctx.prdContent, ctx);
                }
            },
            {
                id: 'model_domain', name: 'Domain Modeling', agent: Agents.Architect,
                run: async (ctx) => {
                    const skill = new DomainModelingSkill();
                    ctx.factPack = await skill.execute(ctx.prdContent, ctx);
                    logStream.emit(`Locked Navigation: ${ctx.factPack.navigationDesign.tabs.join(' | ')}`, 'success', 'Architect');
                }
            },
            {
                id: 'plan_ui', name: 'UI Planning', agent: Agents.Architect,
                run: async (ctx) => {
                    const skill = new UiPlanningSkill();
                    ctx.pageSpecs = await skill.execute(ctx.factPack, ctx);
                }
            }
        ];

        await this.workflowEngine.runSequence(tasks, this.state.context);

        this.updateStepStatus(1, StepStatus.SUCCESS, { durationMs: Date.now() - startTime, tokenUsage: 4500 });
        
        // Handover to Gap Filling
        this.state.currentStepId = 2;
        this.updateStepStatus(2, StepStatus.RUNNING);
        this.notify();
    }

    private async runRemainingStages() {
        // Stage 3: UI
        if (this.state.currentStepId <= 3) {
             this.state.currentStepId = 3;
             this.updateStepStatus(3, StepStatus.RUNNING);
             const start = Date.now();
             await this.workflowEngine.runSequence([{
                 id: 'render_ui', name: 'Render UI Assets', agent: Agents.Architect,
                 run: async (ctx) => { await new UiRenderingSkill().execute(undefined, ctx); }
             }], this.state.context);
             this.updateStepStatus(3, StepStatus.SUCCESS, { durationMs: Date.now() - start, tokenUsage: 8500 });
        }

        // Stage 4: Docs
        if (this.state.isProcessing && this.state.currentStepId <= 4) {
            this.state.currentStepId = 4;
            this.updateStepStatus(4, StepStatus.RUNNING);
            const start = Date.now();
            await this.workflowEngine.runSequence([{
                 id: 'gen_docs', name: 'Generate Documentation', agent: Agents.Analyst,
                 run: async (ctx) => { await new DocGenerationSkill().execute(undefined, ctx); }
             }], this.state.context);
            this.updateStepStatus(4, StepStatus.SUCCESS, { durationMs: Date.now() - start, tokenUsage: 14000 });
        }

        // Stage 5: Code
        if (this.state.isProcessing && this.state.currentStepId <= 5) {
            this.state.currentStepId = 5;
            this.updateStepStatus(5, StepStatus.RUNNING);
            const start = Date.now();
            await this.workflowEngine.runSequence([{
                 id: 'gen_code', name: 'Compile Source Code', agent: Agents.CTO,
                 run: async (ctx) => { await new CodeGenerationSkill().execute(undefined, ctx); }
             }], this.state.context);
            this.updateStepStatus(5, StepStatus.SUCCESS, { durationMs: Date.now() - start, tokenUsage: 28000 });
        }

        // Stage 6: Audit
        if (this.state.isProcessing && this.state.currentStepId <= 6) {
            this.state.currentStepId = 6;
            this.updateStepStatus(6, StepStatus.RUNNING);
            const start = Date.now();
            let passed = false;
            await this.workflowEngine.runSequence([{
                 id: 'audit', name: 'Compliance Audit', agent: Agents.Auditor,
                 run: async (ctx) => { 
                     passed = await new AuditSkill().execute(undefined, ctx); 
                 }
             }], this.state.context);
             
             const status = passed ? StepStatus.SUCCESS : StepStatus.WARN;
             this.updateStepStatus(6, status, { durationMs: Date.now() - start, tokenUsage: 18000 });
        }

        this.state.isProcessing = false;
        this.notify();
    }
}

export const pipelineEngine = new PipelineEngine();
