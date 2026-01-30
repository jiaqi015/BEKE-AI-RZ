
import { PipelineContext, ISkill, IAgent, AgentRole } from '../../types';
import { expandPrd, analyzePrd } from './prdAnalyst';
import { generatePageSpecs } from './uiDesigner';
import { renderUiImage } from './uiRenderer';
import { generateProjectIntroduction, generateAppForm, generateUserManual } from './technicalWriter';
import { generateSourceCode } from './codeGenerator';
import { conductAudit } from './auditor';
import { autoFixArtifacts } from './complianceRefiner';
import { optimizeDocStructure } from './docOptimizer';
import { db } from '../../infrastructure/db/projectDB';
import { logStream } from '../core/LogStream';

// === Agent Registry ===
// Defining the "Virtual Workforce"

export const Agents: Record<AgentRole, IAgent> = {
  'Analyst': { role: 'Analyst', name: 'Alice', description: 'Product Requirement Analyst' },
  'Architect': { role: 'Architect', name: 'Bob', description: 'System & UI Architect' },
  'Developer': { role: 'Developer', name: 'Charlie', description: 'Senior Full-stack Developer' },
  'CTO': { role: 'CTO', name: 'David', description: 'Chief Technology Officer' },
  'Auditor': { role: 'Auditor', name: 'Eve', description: 'Compliance Officer' },
  'DevOps': { role: 'DevOps', name: 'Frank', description: 'Infrastructure Engineer' }
};

// === Skill Wrappers (Adapters) ===
// Wrapping legacy functional skills into the new ISkill interface

export class PrdExpansionSkill implements ISkill<string, string> {
  name = "PRD Expansion";
  description = "Expands a one-liner idea into a full requirement doc";
  async execute(input: string, context: PipelineContext): Promise<string> {
    // Adapter logic: connect legacy callback to new LogStream
    return expandPrd(input, (msg) => logStream.emit(msg, 'info', 'Analyst'));
  }
}

export class DomainModelingSkill implements ISkill<string, any> {
  name = "Domain Modeling";
  description = "Extracts FactPack from PRD";
  async execute(input: string, context: PipelineContext): Promise<any> {
    return analyzePrd(input);
  }
}

export class UiPlanningSkill implements ISkill<any, any> {
  name = "UI Planning";
  description = "Generates UI Page Specifications";
  async execute(input: any, context: PipelineContext): Promise<any> {
    return generatePageSpecs(input);
  }
}

export class UiRenderingSkill implements ISkill<any, void> {
  name = "UI Rendering";
  description = "Renders High-Fidelity Mockups";
  async execute(input: void, context: PipelineContext): Promise<void> {
    if (!context.pageSpecs || !context.registrationInfo || !context.factPack) return;
    
    for (const spec of context.pageSpecs) {
      logStream.emit(`Rendering UI: ${spec.name}...`, 'info', 'Architect');
      const base64 = await renderUiImage(spec, context.registrationInfo, context.factPack);
      if (base64) {
        const url = await db.saveArtifact(spec.filename, base64, 'image/png');
        if (url) {
          context.artifacts.uiImages[spec.filename] = url;
          // Notify UI to update image (handled by Engine state update)
        }
      }
    }
  }
}

export class DocGenerationSkill implements ISkill<void, void> {
  name = "Documentation Compilation";
  description = "Generates Intro, Form, and Manual";
  async execute(input: void, context: PipelineContext): Promise<void> {
    if (!context.factPack || !context.registrationInfo || !context.pageSpecs) throw new Error("Missing Context");
    
    // 1. Intro
    logStream.emit("Drafting Project Introduction...", 'info', 'Analyst');
    const rawIntro = await generateProjectIntroduction(context.factPack, context.registrationInfo);
    context.artifacts.projectIntroduction = await optimizeDocStructure(rawIntro, 'PROJECT_INTRO', (m) => logStream.emit(m, 'info', 'Analyst'));
    
    // 2. Form
    logStream.emit("Filling Application Form...", 'info', 'Analyst');
    context.artifacts.appForm = await generateAppForm(context.factPack, context.registrationInfo);
    
    // 3. Manual
    logStream.emit("Writing User Manual...", 'info', 'Analyst');
    const rawManual = await generateUserManual(context.factPack, context.registrationInfo, context.pageSpecs);
    context.artifacts.userManual = await optimizeDocStructure(rawManual, 'USER_MANUAL', (m) => logStream.emit(m, 'info', 'Analyst'));
  }
}

export class CodeGenerationSkill implements ISkill<void, void> {
  name = "Code Construction";
  description = "Generates Source Code Tree";
  async execute(input: void, context: PipelineContext): Promise<void> {
    if (!context.factPack || !context.registrationInfo || !context.pageSpecs) throw new Error("Missing Context");
    
    const result = await generateSourceCode(
      context.factPack, 
      context.registrationInfo, 
      context.pageSpecs, 
      (msg, role) => logStream.emit(msg, 'info', role || 'Developer')
    );
    
    context.artifacts.sourceCode = result.fullText;
    context.artifacts.sourceTree = result.tree;
  }
}

export class AuditSkill implements ISkill<void, boolean> {
  name = "Compliance Audit";
  description = "Checks artifacts against CPCC rules";
  async execute(input: void, context: PipelineContext): Promise<boolean> {
    if (!context.factPack || !context.registrationInfo) throw new Error("Missing Context");

    let round = 1;
    let passed = false;
    
    while (round <= 3 && !passed) {
      logStream.emit(`Starting Audit Round ${round}...`, 'info', 'Auditor');
      
      const report = await conductAudit(context.factPack, context.registrationInfo, context.artifacts);
      report.round = round;
      context.artifacts.auditHistory.push(report);
      
      if (report.passed) {
        passed = true;
        logStream.emit("Audit PASSED.", 'success', 'Auditor');
      } else {
        logStream.emit(`Audit FAILED (Score: ${report.score}). Initiating Auto-Fix...`, 'warning', 'Auditor');
        // Fix
        const fixResult = await autoFixArtifacts(
          context.artifacts, 
          report, 
          context.registrationInfo, 
          (m) => logStream.emit(m, 'info', 'Auditor')
        );
        context.artifacts = fixResult.artifacts;
        round++;
      }
    }
    return passed;
  }
}
