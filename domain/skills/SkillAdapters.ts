
import { PipelineContext, ISkill, IAgent, AgentRole, ISkillCallbacks } from '../../types';
import { expandPrd, analyzePrd } from './prdAnalyst';
import { generatePageSpecs } from './uiDesigner';
import { renderUiImage } from './uiRenderer';
import { generateProjectIntroduction, generateAppForm, generateUserManual } from './technicalWriter';
import { generateSourceCode } from './codeGenerator';
import { conductAudit } from './auditor';
import { autoFixArtifacts } from './complianceRefiner';
import { optimizeDocStructure } from './docOptimizer';
import { db } from '../../infrastructure/db/projectDB';

// === Agent Registry ===
export const Agents: Record<AgentRole, IAgent> = {
  'Analyst': { role: 'Analyst', name: '需求分析师', description: '负责产品需求拆解与文档编制' },
  'Architect': { role: 'Architect', name: '系统架构师', description: '负责顶层设计与技术选型' },
  'Developer': { role: 'Developer', name: '高级工程师', description: '负责核心代码实现与逻辑构建' },
  'CTO': { role: 'CTO', name: '首席技术官', description: '负责技术决策与质量把控' },
  'Auditor': { role: 'Auditor', name: '合规审查员', description: '负责形式审查与合规性校验' },
  'DevOps': { role: 'DevOps', name: '运维工程师', description: '负责基础设施与交付环境配置' }
};

// === Skill Wrappers (Adapters) ===
// 现在，所有 Skill 都遵循 execute(input, context, callbacks) 协议

export class PrdExpansionSkill implements ISkill<string, string> {
  name = "需求文档扩展";
  description = "将一句话创意扩展为完整的 PRD 文档";
  async execute(input: string, context: PipelineContext, cb: ISkillCallbacks): Promise<string> {
    // 将 callbacks 传递给底层函数，实现日志桥接
    return expandPrd(input, (msg) => cb.onLog(msg, 'info'));
  }
}

export class DomainModelingSkill implements ISkill<string, any> {
  name = "领域建模";
  description = "从 PRD 中提取实体与业务规则";
  async execute(input: string, context: PipelineContext, cb: ISkillCallbacks): Promise<any> {
    // 纯计算 Skill，可能不需要详细日志
    return analyzePrd(input);
  }
}

export class UiPlanningSkill implements ISkill<any, any> {
  name = "UI 蓝图规划";
  description = "生成符合业务场景的界面规范";
  async execute(input: any, context: PipelineContext, cb: ISkillCallbacks): Promise<any> {
    return generatePageSpecs(input);
  }
}

export class UiRenderingSkill implements ISkill<any, void> {
  name = "UI 高保真渲染";
  description = "生成用于申报的界面截图";
  async execute(input: void, context: PipelineContext, cb: ISkillCallbacks): Promise<void> {
    if (!context.pageSpecs || !context.registrationInfo || !context.factPack) return;
    
    for (const spec of context.pageSpecs) {
      cb.onLog(`正在渲染界面: ${spec.name}...`, 'info');
      const base64 = await renderUiImage(spec, context.registrationInfo, context.factPack);
      if (base64) {
        const url = await db.saveArtifact(spec.filename, base64, 'image/png');
        if (url) {
          context.artifacts.uiImages[spec.filename] = url;
        }
      }
    }
  }
}

export class DocGenerationSkill implements ISkill<void, void> {
  name = "申报文档编制";
  description = "生成说明书、申请表等全套文档";
  async execute(input: void, context: PipelineContext, cb: ISkillCallbacks): Promise<void> {
    if (!context.factPack || !context.registrationInfo || !context.pageSpecs) throw new Error("缺少上下文信息");
    
    // 1. Intro
    cb.onLog("正在编制项目简介...", 'info');
    const rawIntro = await generateProjectIntroduction(context.factPack, context.registrationInfo);
    context.artifacts.projectIntroduction = await optimizeDocStructure(rawIntro, 'PROJECT_INTRO', (m) => cb.onLog(m, 'info'));
    
    // 2. Form
    cb.onLog("正在填写申请表技术参数...", 'info');
    context.artifacts.appForm = await generateAppForm(context.factPack, context.registrationInfo);
    
    // 3. Manual
    cb.onLog("正在撰写用户操作说明书...", 'info');
    const rawManual = await generateUserManual(context.factPack, context.registrationInfo, context.pageSpecs);
    context.artifacts.userManual = await optimizeDocStructure(rawManual, 'USER_MANUAL', (m) => cb.onLog(m, 'info'));
  }
}

export class CodeGenerationSkill implements ISkill<void, void> {
  name = "源代码构建";
  description = "生成符合语法的工程代码树";
  async execute(input: void, context: PipelineContext, cb: ISkillCallbacks): Promise<void> {
    if (!context.factPack || !context.registrationInfo || !context.pageSpecs) throw new Error("缺少上下文信息");
    
    const result = await generateSourceCode(
      context.factPack, 
      context.registrationInfo, 
      context.pageSpecs, 
      (msg, role) => cb.onLog(msg, 'info') // Log role ignored here as parent handles it, or we could pass it if callback supported it
    );
    
    context.artifacts.sourceCode = result.fullText;
    context.artifacts.sourceTree = result.tree;
  }
}

export class AuditSkill implements ISkill<void, boolean> {
  name = "合规性审计";
  description = "对照 CPCC 规则进行形式审查";
  async execute(input: void, context: PipelineContext, cb: ISkillCallbacks): Promise<boolean> {
    if (!context.factPack || !context.registrationInfo) throw new Error("缺少上下文信息");

    let round = 1;
    let passed = false;
    
    while (round <= 3 && !passed) {
      cb.onLog(`启动第 ${round} 轮合规性扫描...`, 'info');
      
      const report = await conductAudit(context.factPack, context.registrationInfo, context.artifacts);
      report.round = round;
      context.artifacts.auditHistory.push(report);
      
      if (report.passed) {
        passed = true;
        cb.onLog("审计通过，符合申报标准。", 'success');
      } else {
        cb.onLog(`审计未通过 (得分: ${report.score})，触发自动修复引擎...`, 'warning');
        // Fix
        const fixResult = await autoFixArtifacts(
          context.artifacts, 
          report, 
          context.registrationInfo, 
          (m) => cb.onLog(m, 'info')
        );
        context.artifacts = fixResult.artifacts;
        round++;
      }
    }
    return passed;
  }
}
