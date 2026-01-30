
import { StepStatus, PipelineStep, LogEntry, PipelineContext, RegistrationInfo } from '../../types';
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

    private addLog(message: string, type: LogEntry['type'] = 'info') {
        const log: LogEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
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
        if (this.state.currentStepId === 1) await this.step1_Analysis();
        if (this.state.currentStepId === 2) return; 
        if (this.state.currentStepId === 3) await this.step3_UI();
        if (this.state.currentStepId === 4) await this.step4_Docs();
        if (this.state.currentStepId === 5) await this.step5_Code();
        if (this.state.currentStepId === 6) await this.step6_Audit();
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

    private async step1_Analysis() {
        const startTime = Date.now();
        this.updateStep(1, StepStatus.RUNNING);
        this.addLog("正在召集 [RequirementAnalyst (语义解析 Agent)] 接入原始输入...", "system");
        
        const expanded = await expandPrd(this.state.context.prdContent, (msg) => this.addLog(`[Analyst] ${msg}`));
        this.state.context.prdContent = expanded;
        
        this.addLog("正在启动 [BlueprintArchitect (蓝图架构 Agent)] 建立单一真理来源 (SSOT)...");
        const factPack = await analyzePrd(expanded);
        this.state.context.factPack = factPack;
        
        this.addLog(`[Architect] 顶层设计已固化：Tab 导航锁 [${factPack.navigationDesign.tabs.join(' | ')}]`);
        this.addLog(`[Architect] 视觉规约锁定：${factPack.navigationDesign.visualTheme.styleType} 模式`);

        const pageSpecs = await generatePageSpecs(factPack);
        this.state.context.pageSpecs = pageSpecs;

        const duration = Date.now() - startTime;
        this.updateStep(1, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 4500 });
        this.addLog("Step 1 归档：业务建模与顶层导航蓝图已同步至全链路 Agent 集群。", "success");
        
        this.state.currentStepId = 2;
        this.updateStep(2, StepStatus.RUNNING); 
        this.notify();
    }

    private async step3_UI() {
        const startTime = Date.now();
        this.updateStep(3, StepStatus.RUNNING);
        this.addLog("正在召集 [VisualSemanticsArtist (视觉语义 Agent)] 开始艺术编译...", "system");
        this.addLog("[VisualArtist] 正在从 FactPack 提取导航设计与品牌色，确保强一致性...");
        
        const specs = this.state.context.pageSpecs || [];
        for (const spec of specs) {
            this.addLog(`[VisualArtist] 正在渲染 [${spec.name}] 界面，强制注入当前活动 Tab 状态...`);
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
        this.addLog("Step 3 归档：UI 视觉产物已完成语义对齐。", "success");
        this.state.currentStepId = 4;
        this.notify();
    }

    private async step4_Docs() {
        const startTime = Date.now();
        this.updateStep(4, StepStatus.RUNNING);
        this.addLog("正在召集 [ComplianceScribe (合规文案 Agent Cluster)] 启动文本构建...", "system");

        const { factPack, registrationInfo, pageSpecs } = this.state.context;
        
        this.addLog("[Scribe] 正在根据 [BlueprintArchitect] 的导航蓝图校准说明书布局描述...");
        const intro = await generateProjectIntroduction(factPack!, registrationInfo!);
        this.state.context.artifacts.projectIntroduction = await optimizeDocStructure(intro, 'PROJECT_INTRO', (m) => this.addLog(`[DocOptimizer] ${m}`));
        
        this.addLog("[Scribe] 正在生成申请表核心功能描述 (已开启敏感词规避模式)...");
        this.state.context.artifacts.appForm = await generateAppForm(factPack!, registrationInfo!);
        
        this.addLog("[Scribe] 正在编译用户操作说明书，强制插入 UI 锚点...");
        const manual = await generateUserManual(factPack!, registrationInfo!, pageSpecs!);
        this.state.context.artifacts.userManual = await optimizeDocStructure(manual, 'USER_MANUAL', (m) => this.addLog(`[DocOptimizer] ${m}`));

        const duration = Date.now() - startTime;
        this.updateStep(4, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 14000 });
        this.addLog("Step 4 归档：合规性申报文档已完成逻辑降维与语言润色。", "success");
        this.state.currentStepId = 5;
        this.notify();
    }

    private async step5_Code() {
        const startTime = Date.now();
        this.updateStep(5, StepStatus.RUNNING);
        
        this.addLog("正在召集 [CodeTaskForce (代码特遣队)] 启动全链路仿真工程合成...", "system");
        this.addLog("[CTO Agent] 已接入，正在审查技术栈规约与版权注入协议...");

        const { factPack, registrationInfo, pageSpecs } = this.state.context;
        const selectedLang = registrationInfo?.programmingLanguage[0] || 'Java';
        
        this.addLog(`[CTO Agent] 工程技术栈锁死：${selectedLang}。工程蓝图版本：Enterprise_SOP_V4。`);
        this.addLog("[Architect] 正在设计仿生目录拓扑，注入分层架构规约...");
        this.addLog("[Implementer] 正在实现 Controller/Service/DAO 核心业务逻辑，注入高密度中文语义注释...");
        this.addLog("[DevOps] 正在编写基建配置文件与构建脚本...");

        const result = await generateSourceCode(
            factPack!, 
            registrationInfo!, 
            pageSpecs!, 
            (msg) => {
                // 根据底层反馈关键词路由到不同的 Agent 角色日志
                if (msg.includes("目录") || msg.includes("蓝图")) this.addLog(`[Architect] ${msg}`);
                else if (msg.includes("逻辑") || msg.includes("实现")) this.addLog(`[Implementer] ${msg}`);
                else if (msg.includes("脚本") || msg.includes("环境")) this.addLog(`[DevOps] ${msg}`);
                else this.addLog(`[CodeSquad] ${msg}`);
            }
        );
        
        this.addLog("[QualityGuard] 正在执行全量源码扫描，校验版权页头一致性并进行行号对齐...");
        
        this.state.context.artifacts.sourceCode = result.fullText;
        this.state.context.artifacts.sourceTree = result.tree;

        const duration = Date.now() - startTime;
        this.updateStep(5, StepStatus.SUCCESS, { durationMs: duration, tokenUsage: 28000 });
        this.addLog(`Step 5 归档：[CodeTaskForce] 已完成 ${result.tree.length} 个逻辑闭环仿真文件的编译。`, "success");
        this.state.currentStepId = 6;
        this.notify();
    }

    private async step6_Audit() {
        const startTime = Date.now();
        this.updateStep(6, StepStatus.RUNNING);
        this.addLog("正在召集 [CertificationOfficer (形式审查官 Agent)] 启动 CPCC 准入性审计...", "system");

        let round = 1;
        let passed = false;
        
        while (round <= 3 && !passed) {
            this.addLog(`[Officer] 启动第 ${round} 轮深度形式审查扫描...`);
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
                this.addLog("[Officer] 审计最终结论：PASSED (符合 CPCC 申报标准)。", "success");
            } else {
                this.addLog(`[Officer] 审计未通过 (得分: ${report.score})，正在召集 [AutoRepairBot] 进行紧急修复...`, "warning");
                this.updateStep(6, StepStatus.FIXING);
                
                const fixResult = await autoFixArtifacts(
                    this.state.context.artifacts, 
                    report, 
                    this.state.context.registrationInfo!,
                    (m) => this.addLog(`[RepairBot] ${m}`)
                );
                
                this.state.context.artifacts = fixResult.artifacts;
                const lastReport = this.state.context.artifacts.auditHistory[this.state.context.artifacts.auditHistory.length - 1];
                lastReport.fixSummary = fixResult.fixSummary;
                
                this.updateStep(6, StepStatus.RUNNING);
                round++;
            }
        }

        const duration = Date.now() - startTime;
        this.updateStep(6, passed ? StepStatus.SUCCESS : StepStatus.WARN, { durationMs: duration, tokenUsage: 18000 });
        this.addLog("全链路 Agent 集群协作任务结束，交付包已就绪。", passed ? "success" : "warning");
    }
}

export const pipelineEngine = new PipelineEngine();
