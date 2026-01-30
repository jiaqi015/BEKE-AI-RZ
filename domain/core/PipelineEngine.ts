
import { StepStatus, PipelineStep, LogEntry, PipelineContext, RegistrationInfo, AgentRole } from '../../types';
import { db } from '../../infrastructure/db/projectDB';
import { expandPrd, analyzePrd } from '../skills/prdAnalyst';
import { generatePageSpecs } from '../skills/uiDesigner';
import { renderUiImage } from '../skills/uiRenderer';
import { 
    generateProjectIntroduction, 
    generateAppForm, 
    generateUserManual 
} from '../skills/technicalWriter';
import { generateSourceCode } from '../skills/codeGenerator';
import { conductAudit } from '../skills/auditor';
import { autoFixArtifacts } from '../skills/complianceRefiner';
import { optimizeDocStructure } from '../skills/docOptimizer';

export interface PipelineState {
    steps: PipelineStep[];
    context: PipelineContext;
    currentStepId: number;
    logs: LogEntry[];
    isProcessing: boolean;
}

/**
 * PipelineEngine: 领域调度核心 (Orchestrator)
 * 采用 DDD 思想，作为整个 Application Layer 的协调者。
 */
class PipelineEngine {
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
            artifacts: {
                uiImages: {},
                auditHistory: []
            },
            pageSpecs: []
        },
        currentStepId: 0,
        logs: [],
        isProcessing: false
    };

    private subscribers: ((state: PipelineState) => void)[] = [];

    constructor() {}

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

    private addLog(message: string, type: LogEntry['type'] = 'info', role?: AgentRole) {
        const log: LogEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type,
            role
        };
        this.state.logs.push(log);
        this.notify();
    }

    private updateStep(id: number, status: StepStatus, metrics?: any) {
        const step = this.state.steps.find(s => s.id === id);
        if (step) {
            step.status = status;
            if (metrics) step.metrics = metrics;
        }
        this.notify();
    }

    async start(rawInput: string) {
        if (this.state.isProcessing) return;
        this.state.isProcessing = true;
        this.state.context.prdContent = rawInput;
        this.state.currentStepId = 1;
        this.notify();
        try {
            await this.runPipeline();
        } catch (e) {
            console.error(e);
            this.addLog(`Pipeline Error: ${e}`, 'error');
            this.state.isProcessing = false;
            this.notify();
        }
    }

    private async runPipeline() {
        // 使用状态机驱动步骤，确保可重放性
        const pipelineHandlers: Record<number, () => Promise<void>> = {
            1: () => this.step1_Analysis(),
            3: () => this.step3_UI(),
            4: () => this.step4_Docs(),
            5: () => this.step5_Code(),
            6: () => this.step6_Audit()
        };

        while (this.state.isProcessing && pipelineHandlers[this.state.currentStepId]) {
            await pipelineHandlers[this.state.currentStepId]();
        }
        
        this.state.isProcessing = false;
        this.notify();
    }

    async submitGapInfo(info: RegistrationInfo) {
        this.state.context.registrationInfo = info;
        this.updateStep(2, StepStatus.SUCCESS);
        this.state.currentStepId = 3;
        this.state.isProcessing = true;
        this.notify();
        await this.runPipeline();
    }

    async stop() {
        this.state.isProcessing = false;
        this.notify();
    }

    async retry() {
        this.state.isProcessing = true;
        this.notify();
        await this.runPipeline();
    }

    async skipAudit() {
        this.updateStep(6, StepStatus.SUCCESS);
        this.state.isProcessing = false;
        this.notify();
    }

    async reset() {
        await db.clearSession();
        window.location.reload();
    }

    // --- 各步骤领域逻辑 (解构) ---

    private async step1_Analysis() {
        const startTime = Date.now();
        this.updateStep(1, StepStatus.RUNNING);
        this.addLog("启动语义解析集群...", "system", "Analyst");
        
        const expanded = await expandPrd(this.state.context.prdContent, (msg) => this.addLog(msg, "info", "Analyst"));
        this.state.context.prdContent = expanded;
        
        this.addLog("建立业务模型真理来源 (SSOT)...", "info", "Architect");
        const factPack = await analyzePrd(expanded);
        this.state.context.factPack = factPack;
        
        this.addLog(`顶层导航已锁定：[${factPack.navigationDesign.tabs.join(' | ')}]`, "success", "Architect");

        const pageSpecs = await generatePageSpecs(factPack);
        this.state.context.pageSpecs = pageSpecs;

        const duration = Date.now() - startTime;
        this.updateStep(1, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 4500 });
        this.state.currentStepId = 2;
        this.updateStep(2, StepStatus.RUNNING); 
        this.notify();
    }

    private async step3_UI() {
        const startTime = Date.now();
        this.updateStep(3, StepStatus.RUNNING);
        this.addLog("启动 UI 艺术编译引擎...", "system", "Architect");
        
        const specs = this.state.context.pageSpecs || [];
        for (const spec of specs) {
            this.addLog(`正在渲染 [${spec.name}] 界面...`, "info", "Architect");
            const imgBase64 = await renderUiImage(
                spec, 
                this.state.context.registrationInfo!, 
                this.state.context.factPack!
            );
            if (imgBase64) {
                const url = await db.saveArtifact(spec.filename, imgBase64, 'image/png');
                this.state.context.artifacts.uiImages[spec.filename] = url!;
                this.notify();
            }
        }
        
        const duration = Date.now() - startTime;
        this.updateStep(3, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 8500 });
        this.state.currentStepId = 4;
        this.notify();
    }

    private async step4_Docs() {
        const startTime = Date.now();
        this.updateStep(4, StepStatus.RUNNING);
        this.addLog("启动合规文案集群...", "system", "Analyst");

        const { factPack, registrationInfo, pageSpecs } = this.state.context;
        
        this.addLog("正在编制项目简介与申请表...", "info", "Analyst");
        const intro = await generateProjectIntroduction(factPack!, registrationInfo!);
        this.state.context.artifacts.projectIntroduction = await optimizeDocStructure(intro, 'PROJECT_INTRO', (m) => this.addLog(m, "info", "Analyst"));
        
        this.state.context.artifacts.appForm = await generateAppForm(factPack!, registrationInfo!);
        
        this.addLog("正在编制用户说明书并注入 UI 锚点...", "info", "Analyst");
        const manual = await generateUserManual(factPack!, registrationInfo!, pageSpecs!);
        this.state.context.artifacts.userManual = await optimizeDocStructure(manual, 'USER_MANUAL', (m) => this.addLog(m, "info", "Analyst"));

        const duration = Date.now() - startTime;
        this.updateStep(4, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 14000 });
        this.state.currentStepId = 5;
        this.notify();
    }

    private async step5_Code() {
        const startTime = Date.now();
        this.updateStep(5, StepStatus.RUNNING);
        
        this.addLog("召集代码特遣队启动编译...", "system", "CTO");

        const { factPack, registrationInfo, pageSpecs } = this.state.context;
        const result = await generateSourceCode(
            factPack!, 
            registrationInfo!, 
            pageSpecs!, 
            (msg, role) => this.addLog(msg, "info", role)
        );
        
        this.state.context.artifacts.sourceCode = result.fullText;
        this.state.context.artifacts.sourceTree = result.tree;

        const duration = Date.now() - startTime;
        this.updateStep(5, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 28000 });
        this.state.currentStepId = 6;
        this.notify();
    }

    private async step6_Audit() {
        const startTime = Date.now();
        this.updateStep(6, StepStatus.RUNNING);
        this.addLog("形式审查官接入审计...", "system", "Auditor");

        let round = 1;
        let passed = false;
        
        while (round <= 3 && !passed) {
            this.addLog(`启动第 ${round} 轮深度扫描...`, "info", "Auditor");
            const report = await conductAudit(
                this.state.context.factPack!, 
                this.state.context.registrationInfo!, 
                this.state.context.artifacts
            );
            
            report.round = round;
            this.state.context.artifacts.auditHistory.push(report);
            this.notify();

            if (report.passed) {
                passed = true;
                this.addLog("审计通过，符合 CPCC 申报标准。", "success", "Auditor");
            } else {
                this.addLog(`审计未通过 (${report.score})，触发自动修复机...`, "warning", "Auditor");
                this.updateStep(6, StepStatus.FIXING);
                
                const fixResult = await autoFixArtifacts(
                    this.state.context.artifacts, 
                    report, 
                    this.state.context.registrationInfo!,
                    (m) => this.addLog(m, "info", "Auditor")
                );
                
                this.state.context.artifacts = fixResult.artifacts;
                round++;
            }
        }

        const duration = Date.now() - startTime;
        this.updateStep(6, passed ? StepStatus.SUCCESS : StepStatus.WARN, { durationMs: duration, tokenUsage: 18000 });
    }
}

export const pipelineEngine = new PipelineEngine();
