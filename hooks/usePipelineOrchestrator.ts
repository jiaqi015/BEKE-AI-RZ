
import { useState, useEffect, useCallback } from 'react';
import { pipelineEngine, PipelineState } from '../domain/core/PipelineEngine';

export const usePipelineOrchestrator = () => {
  // Initial state matches engine defaults
  const [state, setState] = useState<PipelineState>({
      steps: [],
      context: { prdContent: '', factPack: null, registrationInfo: null, artifacts: { uiImages: {}, auditHistory: [] } },
      currentStepId: 0,
      logs: [],
      isProcessing: false
  });
  
  const [isRestored, setIsRestored] = useState(false);

  // Subscribe to Engine
  useEffect(() => {
      // Start init process
      pipelineEngine.init().then(() => setIsRestored(true));

      // Subscribe to updates
      const unsubscribe = pipelineEngine.subscribe((newState) => {
          setState(newState);
      });

      return () => unsubscribe();
  }, []);

  // Proxy actions to Engine
  const runAnalysis = useCallback((rawInput: string) => pipelineEngine.start(rawInput), []);
  const submitGapInfo = useCallback((info: any) => pipelineEngine.submitGapInfo(info), []);
  const stopProcessing = useCallback(() => pipelineEngine.stop(), []);
  const retryPipeline = useCallback(() => pipelineEngine.retry(), []);
  const skipAudit = useCallback(() => pipelineEngine.skipAudit(), []);
  const resetPipeline = useCallback(() => pipelineEngine.reset(), []);

  return {
    ...state,
    isRestored,
    runAnalysis,
    submitGapInfo,
    stopProcessing,
    retryPipeline,
    skipAudit,
    resetPipeline
  };
};
