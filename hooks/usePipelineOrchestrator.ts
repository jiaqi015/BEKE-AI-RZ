
import { useState, useRef, useEffect, useCallback } from 'react';
import { PipelineStep, StepStatus, RegistrationInfo, PipelineContext, LogEntry } from '../types';
import { PipelineEngine } from '../domain/core/PipelineEngine';

// 初始步骤定义（采用更友好的文案）
const INITIAL_STEPS: PipelineStep[] = [
  { 
    id: 1, 
    key: 'parse', 
    name: '深度解析产品蓝图', 
    description: '通过 AI 联网分析市场趋势并完善您的功能矩阵', 
    status: StepStatus.IDLE 
  },
  { 
    id: 2, 
    key: 'gap', 
    name: '完善申报关键信息', 
    description: '为了符合官方要求，我们需要您补充一些必要的技术参数', 
    status: StepStatus.IDLE 
  },
  { 
    id: 3, 
    key: 'ui_gen', 
    name: '智能绘制产品原型', 
    description: '正在构思并渲染高保真的软件操作界面截图', 
    status: StepStatus.IDLE 
  },
  { 
    id: 4, 
    key: 'doc_gen', 
    name: '撰写专业申报文档', 
    description: '正在将技术架构转化为数千字的规范说明书与申请表', 
    status: StepStatus.IDLE 
  },
  { 
    id: 5, 
    key: 'code_gen', 
    name: '构建合规程序代码', 
    description: '正在为您生成数千行符合审计要求的源代码鉴别材料', 
    status: StepStatus.IDLE 
  },
  { 
    id: 6, 
    key: 'pack', 
    name: '全量审计与成果交付', 
    description: '正在进行最后的一致性校验，确保材料 100% 通过率', 
    status: StepStatus.IDLE 
  },
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
  const [isRestored, setIsRestored] = useState(false); 

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
    skipAudit
  };
};
