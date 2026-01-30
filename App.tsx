
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import StepIndicator from './components/StepIndicator';
import { TerminalLog } from './components/Console/TerminalLog';
import GapFiller from './components/GapFiller';
import { usePipelineOrchestrator } from './hooks/usePipelineOrchestrator';
import { creativeDirector } from './domain/skills/creativeDirector';
import { ExportConsole } from './components/Modals/ExportConsole';
import { AuditHistoryViewer } from './components/AuditHistoryViewer';
import { StepStatus, RegistrationInfo } from './types';
import { readPdfText } from './utils/pdfReader';
import { TechStackService } from './domain/services/TechStackService';

// 子视图组件
import { PlanView } from './components/Views/PlanView';
import { DocView } from './components/Views/DocView';
import { CodeView } from './components/Views/CodeView';

type TabType = 'plan' | 'doc' | 'code' | 'audit';

// Update estimated time to 70 minutes
const ESTIMATED_TOTAL_MS = 70 * 60 * 1000; 

const TabButton: React.FC<{
  id: string;
  label: string;
  active: boolean;
  notify: boolean;
  onClick: () => void;
}> = ({ id, label, active, notify, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-300 flex items-center gap-2 z-10 ${
      active
        ? 'text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        : 'text-zinc-300 hover:text-white'
    }`}
  >
    {active && (
      <span className="absolute inset-0 bg-white/10 border border-white/5 rounded-full backdrop-blur-md -z-10 animate-in fade-in zoom-in-95 duration-200"></span>
    )}
    {label}
    {notify && (
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : 'bg-blue-500/50'} shadow-sm`}></span>
    )}
  </button>
);

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [inputPrd, setInputPrd] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [isDreaming, setIsDreaming] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [hasNewPlan, setHasNewPlan] = useState(false);
  const [hasNewDoc, setHasNewDoc] = useState(false);
  const [hasNewCode, setHasNewCode] = useState(false);
  const [hasNewAudit, setHasNewAudit] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [elapsedCurrentStep, setElapsedCurrentStep] = useState(0);

  // Network Simulation for "Alive" feeling
  const [networkLatency, setNetworkLatency] = useState(0);

  // 倒计时状态
  const [gapCountdown, setGapCountdown] = useState<number | null>(null);

  const { 
    steps, context, currentStepId, logs, isProcessing, 
    runAnalysis, submitGapInfo, resetPipeline, stopProcessing, retryPipeline, skipAudit
  } = usePipelineOrchestrator();

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelection = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isProcessing) {
        timer = setInterval(() => {
            setElapsedCurrentStep(prev => prev + 1000);
            // Randomize latency to simulate active network traffic (Heartbeat)
            setNetworkLatency(Math.floor(Math.random() * 40) + 80);
        }, 1000);
    } else {
        setElapsedCurrentStep(0);
        setNetworkLatency(0);
    }
    return () => clearInterval(timer);
  }, [isProcessing, currentStepId]);

  // 处理信息补全倒计时：30秒不写自动继续
  useEffect(() => {
    const isGapStep = currentStepId === 2 && steps.find(s => s.id === 2)?.status === 'running';
    
    if (isGapStep) {
      if (gapCountdown === null) setGapCountdown(30);
      
      const timer = setInterval(() => {
        setGapCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitGap();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setGapCountdown(null);
    }
  }, [currentStepId, steps]);

  // REFACTOR: Logic delegated to Domain Service
  const handleAutoSubmitGap = () => {
    if (!context.factPack) return;
    const autoInfo = TechStackService.generateAutoRegistration(context.factPack);
    submitGapInfo(autoInfo);
  };

  useEffect(() => {
     if (currentStepId === 2 && activeTab !== 'plan') setHasNewPlan(true); 
     if (currentStepId === 4 && activeTab !== 'doc') setHasNewDoc(true);
     if (currentStepId === 5 && activeTab !== 'code') setHasNewCode(true);
     if (currentStepId === 6 && activeTab !== 'audit') setHasNewAudit(true);
  }, [currentStepId, activeTab]);

  useEffect(() => {
      if (activeTab === 'plan') setHasNewPlan(false);
      if (activeTab === 'doc') setHasNewDoc(false);
      if (activeTab === 'code') setHasNewCode(false);
      if (activeTab === 'audit') setHasNewAudit(false);
  }, [activeTab]);

  const globalStats = useMemo(() => {
    let finishedTime = 0;
    let totalTokens = 0;
    steps.forEach(s => {
        if(s.metrics) {
            finishedTime += s.metrics.durationMs;
            totalTokens += s.metrics.tokenUsage;
        }
    });
    const totalTime = finishedTime + elapsedCurrentStep;
    return { totalTime, totalTokens };
  }, [steps, elapsedCurrentStep]);

  const handleStart = () => {
    const combinedInput = [
        inputPrd, 
        attachedFile ? `\n[参考文档附件: ${attachedFile.name}]\n${attachedFile.content}` : ''
    ].filter(Boolean).join('\n');

    if(!combinedInput.trim()) return;
    runAnalysis(combinedInput);
    setActiveTab('plan'); 
  };

  const handleSurpriseMe = async () => {
    if (isProcessing) return;
    if (currentStepId !== 0) resetPipeline();
    setIsDreaming(true);
    setInputPrd("// 正在为您构思一个具有申报价值的产品点子...");
    try {
        const idea = await creativeDirector.generateIdea();
        setInputPrd(idea);
    } catch (e) {
        setInputPrd("// 灵感稍有波动，请点击重试...");
    } finally {
        setIsDreaming(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isProcessing) return;
    setIsReadingPdf(true);
    try {
        const text = await readPdfText(file);
        setAttachedFile({ name: file.name, content: text });
    } catch (error: any) {
        alert("文档读取失败，请检查文件格式。");
    } finally {
        setIsReadingPdf(false);
    }
  };

  const removeAttachment = () => setAttachedFile(null);
  const handleStop = () => { if (window.confirm("确定要暂停当前的创作任务吗？")) stopProcessing(); };
  const handleSkipAuditAction = () => { if (window.confirm("确定跳过审计，直接生成现有材料吗？")) skipAudit(); };
  
  const handleReset = () => {
      if (window.confirm("确定要放弃当前进度并回到首页吗？")) {
          resetPipeline();
          setInputPrd('');
          setAttachedFile(null);
          setActiveTab('plan');
      }
  };

  const handleFinishedReset = () => {
      if (window.confirm("请确认已下载交付物。确定要结束当前任务并返回首页吗？")) {
          resetPipeline();
          setInputPrd('');
          setAttachedFile(null);
          setActiveTab('plan');
      }
  };

  const handleExportClick = () => setIsExportModalOpen(true);

  if (hasApiKey === false) {
    return (
      <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="w-20 h-20 rounded-3xl bg-blue-500/20 flex items-center justify-center mx-auto border border-blue-500/30">
              <span className="text-4xl text-blue-400 font-black">新</span>
           </div>
           <div className="space-y-4">
              <h1 className="text-2xl font-black text-white">激活核心大脑</h1>
              <p className="text-sm text-zinc-300 leading-relaxed">请选择一个有效的 API 密钥，开启您的智能写作之旅。</p>
           </div>
           <button onClick={handleOpenKeySelection} className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
             立即激活
           </button>
        </div>
      </div>
    );
  }

  const isIdle = currentStepId === 0;
  const showGapFiller = currentStepId === 2 && steps.find(s => s.id === 2)?.status === 'running';
  const step6 = steps.find(s => s.id === 6);
  const isFinished = step6?.status === 'success' || step6?.status === 'warn';
  const activeStep = steps.find(s => s.id === currentStepId);
  const isStopped = !isProcessing && !isFinished && currentStepId > 0 && activeStep?.status !== StepStatus.SUCCESS;

  return (
    <MainLayout>
      <ExportConsole isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} context={context} />

      {/* 
         LEFT SIDEBAR
         Fixed width. Only visible when NOT idle (working state).
         Initially hidden to provide a centered landing page.
      */}
      {!isIdle && (
        <aside className="w-[280px] flex flex-col h-full shrink-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-r border-white/5 hidden md:flex relative animate-in slide-in-from-left duration-500">
          {/* Brand Area */}
          <div className="p-6 pb-4 border-b border-white/5">
               <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-400 flex items-center justify-center shadow-lg shadow-white/10 ring-1 ring-white/20">
                     <span className="text-sm font-black text-black leading-none select-none">新</span>
                  </div>
                  <div>
                     <div className="text-sm font-bold text-white leading-tight">陈新软 AI</div>
                     <div className="text-[9px] font-medium text-zinc-300 mt-0.5 tracking-wider uppercase">陈新投资的 AI 软著</div>
                  </div>
               </div>
          </div>

          {/* Steps */}
          <div className="p-6 pt-6 flex-1 overflow-y-auto custom-scrollbar">
             <h2 className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
               Agent 思维链
             </h2>
             <StepIndicator steps={steps} currentStepId={currentStepId} />
          </div>

          {/* Stats Footer */}
          <div className="p-4 border-t border-white/5 bg-black/20">
             {(globalStats.totalTime > 0 || isProcessing) ? (
                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-300 font-medium">任务耗时</span>
                          <div className="text-xs font-mono font-bold text-zinc-200">
                            {globalStats.totalTime > 60000 ? (globalStats.totalTime/60000).toFixed(1) + 'm' : (globalStats.totalTime/1000).toFixed(0) + 's'}
                          </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-300 font-medium">Tokens</span>
                        <div className="text-xs font-mono font-bold text-zinc-200">{(globalStats.totalTokens / 1000).toFixed(1)}k</div>
                     </div>
                     <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden mt-1">
                         <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-blue-600`} style={{ width: isFinished ? '100%' : `${Math.min(100, (globalStats.totalTime / ESTIMATED_TOTAL_MS) * 100)}%` }}></div>
                     </div>
                  </div>
             ) : (
               <div className="text-[10px] text-zinc-500 text-center py-2">等待任务启动...</div>
             )}
          </div>
        </aside>
      )}

      {/* 
         RIGHT MAIN AREA 
         Flex-1, contains the Workspace and the Overlay Input.
      */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-[#050505]">
        
        {/* === IDLE STATE OVERLAY (The Input Box) === */}
        {isIdle && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
                
                {/* Branding - Move to Top Left */}
                <div className="absolute top-8 left-8 md:top-12 md:left-12">
                     <div className="flex items-center gap-4 p-3 pr-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-400 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-white/30">
                            <span className="text-xl font-black text-black leading-none select-none">新</span>
                         </div>
                         <div className="text-left">
                            <div className="text-base font-bold text-white leading-tight tracking-tight">陈新软 AI</div>
                            <div className="text-[9px] font-bold text-zinc-400 tracking-[0.15em] uppercase mt-0.5">企业级软著智能编译器</div>
                         </div>
                    </div>
                </div>

                <div className="w-full max-w-2xl animate-in slide-in-from-bottom-8 duration-700">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight mb-3">
                            全球首个软著 Agent
                        </h1>
                        <p className="text-sm text-zinc-300">
                            无论是一个产品点子还是专业的PRD，AI 将自动编译全套申报材料 (代码、文档、申请表)
                        </p>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl opacity-20 group-hover:opacity-40 transition duration-1000 blur-lg"></div>
                        <div className="relative bg-[#0F0F11] border border-white/10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                             <textarea
                                className="w-full h-40 p-6 bg-transparent outline-none text-base text-zinc-100 placeholder-zinc-400 resize-none font-mono leading-relaxed custom-scrollbar"
                                placeholder={`> 在此输入需求描述...
例如：我想要一个基于 AI 的家庭植物养护系统，可以通过摄像头识别植物状态，并自动控制浇水设备。包含用户 App 和管理后台。`}
                                value={inputPrd}
                                onChange={(e) => setInputPrd(e.target.value)}
                             />
                             
                             {attachedFile && (
                                <div className="mx-6 mb-4 flex items-center justify-between px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <span className="text-xs text-blue-300 truncate max-w-[200px] flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        {attachedFile.name}
                                    </span>
                                    <button onClick={removeAttachment} className="text-zinc-500 hover:text-white transition-colors">×</button>
                                </div>
                             )}

                             <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/[0.02]">
                                <div className="flex gap-2">
                                   <input type="file" ref={fileInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
                                   <button 
                                      onClick={() => fileInputRef.current?.click()}
                                      disabled={isReadingPdf}
                                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-2"
                                   >
                                      {isReadingPdf ? <span className="animate-spin">⟳</span> : <span>📄</span>}
                                      上传 PDF
                                   </button>
                                   <button 
                                      onClick={handleSurpriseMe}
                                      disabled={isDreaming}
                                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-2"
                                   >
                                      <span>✨</span> 帮我想个点子
                                   </button>
                                </div>
                                <button 
                                    onClick={handleStart}
                                    disabled={!inputPrd && !attachedFile}
                                    className="px-6 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 active:scale-95 transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    开始
                                </button>
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 space-y-5 opacity-40 hover:opacity-100 transition-opacity duration-500">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-white/5 rounded-xl bg-white/[0.01]">
                                <div className="text-[10px] font-bold text-zinc-300 uppercase mb-1">PRO 模型驱动</div>
                                <p className="text-xs text-zinc-300">基于 Google Gemini 3.0 Pro 的超长上下文语义分析。</p>
                            </div>
                            <div className="p-4 border border-white/5 rounded-xl bg-white/[0.01]">
                                <div className="text-[10px] font-bold text-zinc-300 uppercase mb-1">合规性校验</div>
                                <p className="text-xs text-zinc-300">内置 CPCC 形式审查规则，自动规避 100+ 敏感词。</p>
                            </div>
                        </div>

                        <div className="text-sm font-medium text-red-400 text-center leading-relaxed">
                            <p>使用需保持网络楼梯连接。本工具生成的软著材料仅供娱乐，请根据实际业务自行辨别并核对。</p>
                            <p>全程 AI 编写使用PRO模型，需要大约70分钟，耐心不断网挂机等待</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === WORKING STATE GRID === */}
        <div className={`flex-1 flex flex-col md:flex-row h-full transition-all duration-700 ${isIdle ? 'opacity-0 scale-95 pointer-events-none blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
            
            {/* Terminal Panel (Left/Top) */}
            <div className="w-full md:w-[35%] h-[40%] md:h-full border-b md:border-b-0 md:border-r border-white/5 bg-[#0C0C0E] relative z-10">
                <div className="h-full flex flex-col">
                    <div className="flex-1 relative min-h-0">
                       {showGapFiller && context.factPack ? (
                           <div className="absolute inset-0 z-20 overflow-y-auto bg-black/80 backdrop-blur-md p-6">
                               <GapFiller factPack={context.factPack} onSubmit={submitGapInfo} />
                           </div>
                       ) : (
                           <TerminalLog logs={logs} stats={globalStats} />
                       )}
                    </div>
                </div>
            </div>

            {/* Preview Panel (Right/Bottom) */}
            <div className="flex-1 h-[60%] md:h-full bg-[#121214] flex flex-col relative">
                {/* Tabs */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">实时产物预览</span>
                    <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                        <TabButton id="plan" label="架构规划" active={activeTab === 'plan'} notify={hasNewPlan} onClick={() => setActiveTab('plan')} />
                        <TabButton id="doc" label="申报文档" active={activeTab === 'doc'} notify={hasNewDoc} onClick={() => setActiveTab('doc')} />
                        <TabButton id="code" label="源代码" active={activeTab === 'code'} notify={hasNewCode} onClick={() => setActiveTab('code')} />
                        {context.artifacts.auditHistory.length > 0 && (
                            <TabButton id="audit" label="审计全史" active={activeTab === 'audit'} notify={hasNewAudit} onClick={() => setActiveTab('audit')} />
                        )}
                    </div>
                </div>

                {/* Viewport */}
                <div className="flex-1 relative overflow-hidden">
                    {activeTab === 'plan' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar pb-32"><PlanView context={context} currentStepId={currentStepId} /></div>}
                    {activeTab === 'doc' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar pb-32"><DocView context={context} currentStepId={currentStepId} /></div>}
                    {activeTab === 'code' && <div className="absolute inset-0 flex flex-col"><CodeView context={context} currentStepId={currentStepId} /></div>}
                    {activeTab === 'audit' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar"><AuditHistoryViewer history={context.artifacts.auditHistory} /></div>}
                </div>
            </div>
        </div>

        {/* Dynamic Action Bar (Floating) */}
        {!isIdle && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 duration-700">
                <div className="flex items-center gap-2 p-1.5 pl-4 pr-1.5 rounded-full bg-[#18181b]/90 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-black/50">
                    {/* Status Text */}
                    <div className="flex items-center gap-3 mr-4">
                        {isProcessing ? (
                             <>
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide min-w-[60px]">{activeStep?.name || 'Processing'}</span>
                                
                                {/* Network Heartbeat Visualizer */}
                                <div className="flex items-center gap-2 px-3 border-l border-white/10 ml-2 h-4">
                                    <div className="flex space-x-0.5 items-end h-3">
                                         <div className="w-0.5 bg-emerald-500/80 animate-[pulse_1s_ease-in-out_infinite] h-1.5 rounded-full"></div>
                                         <div className="w-0.5 bg-emerald-500/80 animate-[pulse_1.5s_ease-in-out_infinite] h-3 rounded-full"></div>
                                         <div className="w-0.5 bg-emerald-500/80 animate-[pulse_0.8s_ease-in-out_infinite] h-2 rounded-full"></div>
                                         <div className="w-0.5 bg-emerald-500/80 animate-[pulse_1.2s_ease-in-out_infinite] h-2.5 rounded-full"></div>
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-500">
                                       LINK_ACTIVE <span className="text-emerald-500 font-bold tabular-nums">{networkLatency}ms</span>
                                    </span>
                                </div>
                             </>
                        ) : isFinished ? (
                             <>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wide">Ready</span>
                             </>
                        ) : (
                             <>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide">Paused</span>
                             </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {isProcessing && !showGapFiller && (
                            <button onClick={handleStop} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-zinc-300 transition-colors">
                                暂停
                            </button>
                        )}
                        
                        {/* Gap Filler Countdown */}
                        {showGapFiller && gapCountdown !== null && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                <span className="text-[10px] font-bold text-blue-400">自动继续</span>
                                <span className="text-xs font-mono text-white w-4 text-center">{gapCountdown}</span>
                            </div>
                        )}

                        {isStopped && (
                            <>
                                <button onClick={retryPipeline} className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all shadow-lg shadow-blue-500/20">
                                    继续
                                </button>
                                <button onClick={handleReset} className="px-4 py-2 rounded-full hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 text-[10px] font-bold transition-colors">
                                    重置
                                </button>
                            </>
                        )}

                        {isFinished && (
                            <>
                                <button onClick={handleFinishedReset} className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] font-bold transition-all shadow-lg flex items-center gap-2 border border-white/5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    回到首页
                                </button>
                                <button onClick={handleExportClick} className="px-5 py-2 rounded-full bg-white text-black hover:bg-zinc-200 text-[10px] font-bold transition-all shadow-lg flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    下载交付包
                                </button>
                            </>
                        )}

                        {currentStepId === 6 && (isProcessing || isStopped) && (
                            <button onClick={handleSkipAuditAction} className="p-2 rounded-full hover:bg-amber-500/20 text-zinc-500 hover:text-amber-400 transition-colors" title="强制跳过审计">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </MainLayout>
  );
};

export default App;
