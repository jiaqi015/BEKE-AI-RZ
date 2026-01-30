
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
 * PipelineEngine (Application Service)
 * 职责：
 * 1. 维护 React UI 所需的 View Model (State)。
 * 2. 组装业务流程 (Tasks)。
 * 3. 协调 WorkflowEngine 执行。
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
        // 监听 LogStream，单向数据流更新 UI 状态
        // 这是一个 View Model 的典型行为
        logStream.subscribe((entry) => {
            // Immutable update for React re-render
            this.state.logs = [...this.state.logs, entry];
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

    // === Public Actions (UI Triggers) ===

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
            logStream.emit(`流水线异常终止: ${e}`, 'error', 'CTO');
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

    // === Workflow Composition (The Plan) ===
    // 这里我们定义“具体的业务流程”，但执行交给 WorkflowEngine

    private async runStage1() {
        this.updateStepStatus(1, StepStatus.RUNNING);
        const startTime = Date.now();

        const tasks: IWorkflowTask[] = [
            {
                id: 'expand_prd', name: '需求文档扩展与解析', agent: Agents.Analyst,
                retryPolicy: { maxRetries: 2, backoffMs: 2000 },
                run: async (ctx, cb) => {
                    const skill = new PrdExpansionSkill();
                    ctx.prdContent = await skill.execute(ctx.prdContent, ctx, cb);
                }
            },
            {
                id: 'model_domain', name: '业务领域建模', agent: Agents.Architect,
                run: async (ctx, cb) => {
                    const skill = new DomainModelingSkill();
                    ctx.factPack = await skill.execute(ctx.prdContent, ctx, cb);
                    logStream.emit(`顶层导航设计锁定：${ctx.factPack.navigationDesign.tabs.join(' | ')}`, 'success', 'Architect');
                }
            },
            {
                id: 'plan_ui', name: 'UI 视觉蓝图规划', agent: Agents.Architect,
                run: async (ctx, cb) => {
                    const skill = new UiPlanningSkill();
                    ctx.pageSpecs = await skill.execute(ctx.factPack, ctx, cb);
                }
            }
        ];

        await this.workflowEngine.runSequence(tasks, this.state.context);

        this.updateStepStatus(1, StepStatus.SUCCESS, { durationMs: Date.now() - startTime, tokenUsage: 4500 });
        
        // Stage Transition
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
                 id: 'render_ui', name: '高保真 UI 渲染', agent: Agents.Architect,
                 retryPolicy: { maxRetries: 3, backoffMs: 1000 }, // Image gen often fails, aggressive retry
                 run: async (ctx, cb) => { await new UiRenderingSkill().execute(undefined, ctx, cb); }
             }], this.state.context);
             
             this.updateStepStatus(3, StepStatus.SUCCESS, { durationMs: Date.now() - start, tokenUsage: 8500 });
        }

        // Stage 4: Docs
        if (this.state.isProcessing && this.state.currentStepId <= 4) {
            this.state.currentStepId = 4;
            this.updateStepStatus(4, StepStatus.RUNNING);
            const start = Date.now();
            await this.workflowEngine.runSequence([{
                 id: 'gen_docs', name: '申报文档编制', agent: Agents.Analyst,
                 run: async (ctx, cb) => { await new DocGenerationSkill().execute(undefined, ctx, cb); }
             }], this.state.context);
            this.updateStepStatus(4, StepStatus.SUCCESS, { durationMs: Date.now() - start, tokenUsage: 14000 });
        }

        // Stage 5: Code
        if (this.state.isProcessing && this.state.currentStepId <= 5) {
            this.state.currentStepId = 5;
            this.updateStepStatus(5, StepStatus.RUNNING);
            const start = Date.now();
            await this.workflowEngine.runSequence([{
                 id: 'gen_code', name: '源代码工程编译', agent: Agents.CTO,
                 run: async (ctx, cb) => { await new CodeGenerationSkill().execute(undefined, ctx, cb); }
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
                 id: 'audit', name: 'CPCC 形式审查', agent: Agents.Auditor,
                 run: async (ctx, cb) => { 
                     passed = await new AuditSkill().execute(undefined, ctx, cb); 
                 }
             }], this.state.context);
             
             // Check result from artifacts instead of variable, as mutation happened in context
             const lastReport = this.state.context.artifacts.auditHistory[this.state.context.artifacts.auditHistory.length - 1];
             passed = lastReport?.passed || false;

             const status = passed ? StepStatus.SUCCESS : StepStatus.WARN;
             this.updateStepStatus(6, status, { durationMs: Date.now() - start, tokenUsage: 18000 });
        }

        this.state.isProcessing = false;
        this.notify();
    }
}

export const pipelineEngine = new PipelineEngine();
