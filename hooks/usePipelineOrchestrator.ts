
import { useState, useRef, useEffect, useCallback } from 'react';
import { PipelineStep, StepStatus, RegistrationInfo, PipelineContext, LogEntry } from '../types';
import { PipelineEngine } from '../domain/core/PipelineEngine';

// Initial Steps Definition (Read-only reference for initial state)
const INITIAL_STEPS: PipelineStep[] = [
  { id: 1, key: 'parse', name: '需求扩写与结构分析', description: '智能意图识别与竞品分析', status: StepStatus.IDLE },
  { id: 2, key: 'gap', name: '信息补全', description: '补全核心申报字段', status: StepStatus.IDLE },
  { id: 3, key: 'ui_gen', name: 'UI 生成', description: 'AI 绘制真实界面截图', status: StepStatus.IDLE },
  { id: 4, key: 'doc_gen', name: '文档编译', description: '组装说明书与申请表', status: StepStatus.IDLE },
  { id: 5, key: 'code_gen', name: '源码构建', description: '基于 UI 蓝图反向生成代码', status: StepStatus.IDLE },
  { id: 6, key: 'pack', name: '审计打包', description: '一致性校验 & Zip导出', status: StepStatus.IDLE },
];

export const usePipelineOrchestrator = () => {
  // --- View State (Reactive) ---
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [context, setContext] = useState<PipelineContext>({
    prdContent: '',
    factPack: null,
    registrationInfo: null,
    artifacts: { uiImages: {}, auditHistory: [] }
  });
  const [currentStepId, setCurrentStepId] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestored, setIsRestored] = useState(false); // Just for UI loading state if needed

  // --- Engine Instance (Singleton per component mount) ---
  const engineRef = useRef<PipelineEngine | null>(null);

  useEffect(() => {
    // initialize engine once
    if (!engineRef.current) {
        engineRef.current = new PipelineEngine({
            onLog: (entry) => setLogs(prev => [...prev, entry]),
            onStepStatusChange: (newSteps) => setSteps(newSteps),
            onContextChange: (newCtx) => setContext(newCtx),
            onCurrentStepIdChange: (id) => setCurrentStepId(id),
            onProcessingChange: (processing) => setIsProcessing(processing)
        });
        
        // Start Restore Process
        engineRef.current.init().then(() => setIsRestored(true));
    }
  }, []);

  // --- Wrapper Actions ---

  const runAnalysis = useCallback((rawInput: string) => {
     engineRef.current?.start(rawInput);
  }, []);

  const submitGapInfo = useCallback((info: RegistrationInfo) => {
     engineRef.current?.submitGapInfo(info);
  }, []);

  const stopProcessing = useCallback(() => {
     engineRef.current?.stop();
  }, []);

  const retryPipeline = useCallback(() => {
     engineRef.current?.retry();
  }, []);

  const skipAudit = useCallback(() => {
      engineRef.current?.skipAudit();
  }, []);

  const resetPipeline = useCallback(() => {
     engineRef.current?.reset();
     // Reset local logs manually as engine might just clear state
     setLogs([]);
  }, []);

  return {
    steps,
    context,
    currentStepId,
    logs,
    isProcessing,
    isRestored,
    runAnalysis,
    submitGapInfo,
    resetPipeline,
    stopProcessing,
    retryPipeline,
    skipAudit // New export
  };
};
