import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import StepIndicator from './components/StepIndicator';
import { TerminalLog } from './components/Console/TerminalLog';
import GapFiller from './components/GapFiller';
import { usePipelineOrchestrator } from './hooks/usePipelineOrchestrator';
import { generateRandomIdea } from './domain/skills/creativeDirector';
import { ExportConsole } from './components/Modals/ExportConsole';
import { AuditHistoryViewer } from './components/AuditHistoryViewer';
import { StepStatus } from './types';
import { readPdfText } from './utils/pdfReader';

// Imported Views
import { PlanView } from './components/Views/PlanView';
import { DocView } from './components/Views/DocView';
import { CodeView } from './components/Views/CodeView';

type TabType = 'plan' | 'doc' | 'code' | 'audit';

const ESTIMATED_TOTAL_MS = 25 * 60 * 1000; 

// iOS Segmented Control Style Button
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
        ? 'text-black dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-100'
    }`}
  >
    {active && (
      <span className="absolute inset-0 bg-white dark:bg-zinc-700/80 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] -z-10 animate-in fade-in zoom-in-95 duration-200"></span>
    )}
    {label}
    {notify && (
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500' : 'bg-blue-400'} shadow-sm`}></span>
    )}
  </button>
);

const App: React.FC = () => {
  const [inputPrd, setInputPrd] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [isDreaming, setIsDreaming] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  
  // New State for Silent Attachment
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [hasNewPlan, setHasNewPlan] = useState(false);
  const [hasNewDoc, setHasNewDoc] = useState(false);
  const [hasNewCode, setHasNewCode] = useState(false);
  const [hasNewAudit, setHasNewAudit] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Real-time Timer State
  const [elapsedCurrentStep, setElapsedCurrentStep] = useState(0);

  const { 
    steps, context, currentStepId, logs, isProcessing, 
    runAnalysis, submitGapInfo, resetPipeline, stopProcessing, retryPipeline, skipAudit
  } = usePipelineOrchestrator();

  // Timer Effect: Update elapsed time every second when processing
  useEffect(() => {
    let timer: any;
    if (isProcessing) {
        timer = setInterval(() => {
            setElapsedCurrentStep(prev => prev + 1000);
        }, 1000);
    } else {
        setElapsedCurrentStep(0);
    }
    return () => clearInterval(timer);
  }, [isProcessing, currentStepId]); // Reset on step change

  useEffect(() => {
     if (currentStepId === 2 && activeTab !== 'plan') setHasNewPlan(true); 
     if (currentStepId === 4 && activeTab !== 'doc') setHasNewDoc(true);
     if (currentStepId === 5 && activeTab !== 'code') setHasNewCode(true);
     if (currentStepId === 6 && activeTab !== 'audit') setHasNewAudit(true);
  }, [currentStepId, context, activeTab]);

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
    // Add current ticking time to total
    const totalTime = finishedTime + elapsedCurrentStep;
    return { totalTime, totalTokens };
  }, [steps, elapsedCurrentStep]);

  const handleStart = () => {
    // Combine manual input and attached file content
    const combinedInput = [
        inputPrd, 
        attachedFile ? `\n[参考附件: ${attachedFile.name}]\n${attachedFile.content}` : ''
    ].filter(Boolean).join('\n');

    if(!combinedInput.trim()) return;
    runAnalysis(combinedInput);
    setActiveTab('plan'); 
  };

  const handleSurpriseMe = async () => {
    if (isProcessing) return;
    if (currentStepId !== 0) resetPipeline();
    setIsDreaming(true);
    setInputPrd("// AI 正在连接贝壳研究院数据库，深度推理未来居住形态...");
    try {
        const idea = await generateRandomIdea();
        setInputPrd(idea);
    } catch (e) {
        console.error(e);
        setInputPrd("// 思维链接断开，请重试...");
    } finally {
        setIsDreaming(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert("请上传 PDF 格式的文件");
        return;
    }

    if (isProcessing) return;
    if (currentStepId !== 0) resetPipeline();

    setIsReadingPdf(true);
    
    try {
        const text = await readPdfText(file);
        if (text.trim().length === 0) {
            alert("无法从该 PDF 中提取文本，可能是纯图片扫描件。");
        } else {
            // Store as attachment instead of filling textarea
            setAttachedFile({ name: file.name, content: text });
        }
    } catch (error: any) {
        console.error(error);
        alert("PDF 解析失败: " + error.message);
    } finally {
        setIsReadingPdf(false);
        // Reset input value to allow re-uploading the same file if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
      setAttachedFile(null);
  };

  const handleStop = () => {
      if (window.confirm("确定要紧急终止当前的编译任务吗？")) stopProcessing();
  };
  
  const handleSkipAudit = () => {
      if (window.confirm("确定要跳过剩余的审计流程，直接进行交付打包吗？")) skipAudit();
  };

  const handleExportClick = () => setIsExportModalOpen(true);

  const isIdle = currentStepId === 0;
  const showGapFiller = currentStepId === 2 && steps.find(s => s.id === 2)?.status === 'running';
  const step6 = steps.find(s => s.id === 6);
  const isFinished = step6?.status === 'success' || step6?.status === 'warn';
  const activeStep = steps.find(s => s.id === currentStepId);
  const isError = activeStep?.status === StepStatus.ERROR;
  const isStopped = !isProcessing && !isFinished && currentStepId > 0 && activeStep?.status !== StepStatus.SUCCESS;

  const totalTimeSec = globalStats.totalTime / 1000;
  const progressPercent = Math.min(100, (globalStats.totalTime / ESTIMATED_TOTAL_MS) * 100);

  return (
    <MainLayout>
      <ExportConsole isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} context={context} />

      {/* LEFT SIDEBAR - Glass Effect - High Contrast */}
      <aside className="w-72 flex flex-col h-full shrink-0 z-20 backdrop-blur-2xl transition-all duration-500 border-r dark:bg-black/60 bg-white/60 dark:border-white/10 border-white/40 hidden md:flex">
        <div className="p-6">
           <h2 className="text-[11px] font-bold dark:text-zinc-300 text-gray-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
             流水线工序
           </h2>
           <StepIndicator steps={steps} currentStepId={currentStepId} />
        </div>
        <div className="flex-1 p-6 flex flex-col justify-end">
           {(globalStats.totalTime > 0 || isProcessing) && (
                <div className="dark:bg-white/10 bg-white/80 border dark:border-white/10 border-white/50 rounded-2xl p-4 shadow-lg backdrop-blur-xl">
                   <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-gray-600 dark:text-zinc-300 uppercase font-bold tracking-widest">总任务耗时</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                   </div>
                   
                   <div className="flex items-baseline justify-between mb-2">
                      <div className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                          {totalTimeSec > 60 ? (totalTimeSec/60).toFixed(1) + '分' : totalTimeSec.toFixed(0) + '秒'}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">
                          预计 ~25分
                      </div>
                   </div>
                   
                   <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1 overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ease-out ${isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} 
                         style={{ width: isFinished ? '100%' : `${progressPercent}%` }}
                       ></div>
                   </div>
                </div>
           )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {isIdle && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                <div className="max-w-3xl w-full animate-float">
                    {/* Vision Pro Style Glass Sheet */}
                    <div className="glass-panel dark:glass-panel bg-white/70 dark:bg-black/60 rounded-[40px] p-10 text-center relative overflow-hidden ring-1 ring-white/20 shadow-2xl">
                        
                        {/* Dynamic Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Title Section with Badge */}
                            <div className="relative inline-block mx-auto mb-8">
                                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-white/60 tracking-tighter">
                                    陈新软 AI
                                </h1>
                                {/* "Thank You" Badge */}
                                <div className="absolute -top-6 -right-20 rotate-12 animate-pulse duration-[3000ms] cursor-default hover:rotate-6 transition-transform z-10">
                                    <div className="bg-[#ffdd00] text-black px-3 py-1.5 rounded-full rounded-bl-none text-[10px] font-bold shadow-[0_4px_12px_rgba(255,221,0,0.3)] flex items-center gap-1.5 border-2 border-white dark:border-black transform hover:scale-110 transition-all">
                                        <svg className="w-3 h-3 text-red-500 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                        <span>谢谢陈新</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative w-full max-w-xl mx-auto group/input flex-1 flex flex-col">
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-3xl blur-md -z-10 transition-opacity opacity-0 group-hover/input:opacity-100"></div>
                                
                                {/* TEXT AREA */}
                                <div className="relative w-full">
                                    <textarea
                                        className="relative w-full h-40 p-6 bg-gray-100/50 dark:bg-white/10 border border-transparent dark:border-white/10 rounded-t-3xl rounded-b-lg focus:ring-2 focus:ring-blue-500/30 focus:border-white/20 outline-none transition-all font-mono text-sm dark:text-white/90 text-gray-800 resize-none placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-xl shadow-inner hover:bg-white/60 dark:hover:bg-white/15 custom-scrollbar"
                                        placeholder="// 请在此处粘贴 PRD / 创意 / 功能清单 (支持下方 PDF 文档投喂)..."
                                        value={inputPrd}
                                        onChange={(e) => setInputPrd(e.target.value)}
                                    />
                                    
                                    {/* Attachment Chip */}
                                    {attachedFile && (
                                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-md animate-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <svg className="w-4 h-4 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                <span className="text-xs font-medium text-blue-100 truncate max-w-[300px]">{attachedFile.name}</span>
                                            </div>
                                            <button onClick={removeAttachment} className="text-blue-300 hover:text-white transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* BUTTON ROW */}
                                <div className="mt-4 flex items-center gap-3">
                                   {/* PDF Upload Button (LEFT) */}
                                   <input 
                                     type="file" 
                                     ref={fileInputRef} 
                                     onChange={handlePdfUpload} 
                                     accept="application/pdf" 
                                     className="hidden" 
                                   />
                                   <button 
                                     onClick={() => fileInputRef.current?.click()} 
                                     disabled={isDreaming || isProcessing || isReadingPdf} 
                                     className="h-14 px-5 rounded-2xl bg-white/50 dark:bg-white/10 hover:bg-blue-500/10 border border-transparent dark:border-white/10 hover:border-blue-500/30 text-[11px] font-bold text-gray-600 dark:text-zinc-200 hover:text-blue-500 transition-all backdrop-blur-md flex flex-col items-center justify-center gap-1 group active:scale-95"
                                   >
                                      {isReadingPdf ? (
                                        <>
                                          <svg className="animate-spin w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                          <span>读取中</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-5 h-5 opacity-70 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                          <span>上传PDF</span>
                                        </>
                                      )}
                                   </button>
                                   
                                   {/* Main Start Button (CENTER) */}
                                   <button 
                                        onClick={handleStart} 
                                        disabled={(!inputPrd && !attachedFile) || isProcessing || isDreaming || isReadingPdf} 
                                        className="flex-1 h-14 bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        <span className="text-lg">开始编译任务</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>

                                   {/* Surprise Me Button (RIGHT) */}
                                   <button 
                                      onClick={handleSurpriseMe} 
                                      disabled={isDreaming || isProcessing || isReadingPdf} 
                                      className="h-14 px-5 rounded-2xl bg-white/50 dark:bg-white/10 hover:bg-purple-500/10 border border-transparent dark:border-white/10 hover:border-purple-500/30 text-[11px] font-bold text-gray-600 dark:text-zinc-200 hover:text-purple-500 transition-all backdrop-blur-md flex flex-col items-center justify-center gap-1 group active:scale-95"
                                   >
                                      {isDreaming ? (
                                        <>
                                            <span className="animate-pulse">✨</span>
                                            <span>思考中</span>
                                        </>
                                      ) : (
                                        <>
                                            <span className="text-lg group-hover:rotate-12 transition-transform">✨</span>
                                            <span>帮我创意</span>
                                        </>
                                      )}
                                   </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`grid grid-cols-12 h-full transition-all duration-1000 ${isIdle ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            
            {/* CENTER: CONSOLE */}
            <div className="col-span-12 lg:col-span-5 flex flex-col p-4 gap-4 h-full relative z-10 min-h-0 border-r dark:border-white/10 border-black/5 bg-gray-50/50 dark:bg-transparent">
                <div className="flex-1 relative rounded-2xl overflow-hidden border dark:border-white/10 border-white/60 bg-white/40 dark:bg-black/30 backdrop-blur-2xl shadow-sm min-h-0 flex flex-col ring-1 ring-white/20">
                    {showGapFiller ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-black/40 backdrop-blur-lg animate-in fade-in">
                        <div className="w-full max-w-2xl h-full max-h-[800px]"><GapFiller factPack={context.factPack!} onSubmit={submitGapInfo} /></div>
                    </div>
                    ) : ( <TerminalLog logs={logs} stats={globalStats} /> )}
                </div>
            </div>

            {/* RIGHT: PREVIEW */}
            <div className="col-span-12 lg:col-span-7 flex flex-col h-full bg-white/30 dark:bg-white/5 backdrop-blur-3xl">
                {/* Segmented Control Bar */}
                <div className="h-16 border-b dark:border-white/10 border-black/5 flex items-center px-6 justify-between shrink-0">
                    <span className="text-[10px] font-bold dark:text-zinc-300 text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        实时产物预览
                    </span>
                    <div className="flex bg-gray-200/50 dark:bg-black/30 p-1 rounded-full border dark:border-white/10 border-white/50 backdrop-blur-md">
                        <TabButton id="plan" label="规划蓝图" active={activeTab === 'plan'} notify={hasNewPlan} onClick={() => setActiveTab('plan')} />
                        <TabButton id="doc" label="交付文档" active={activeTab === 'doc'} notify={hasNewDoc} onClick={() => setActiveTab('doc')} />
                        <TabButton id="code" label="源代码" active={activeTab === 'code'} notify={hasNewCode} onClick={() => setActiveTab('code')} />
                        {(context.artifacts.auditHistory.length > 0) && (
                            <TabButton id="audit" label="审计溯源" active={activeTab === 'audit'} notify={hasNewAudit} onClick={() => setActiveTab('audit')} />
                        )}
                    </div>
                </div>
                
                <div className="flex-1 relative overflow-hidden bg-gray-50/30 dark:bg-transparent">
                    {activeTab === 'plan' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar pb-32"><PlanView context={context} /></div>}
                    {activeTab === 'doc' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar pb-32"><DocView context={context} /></div>}
                    {activeTab === 'code' && <div className="absolute inset-0 flex flex-col"><CodeView context={context} /></div>}
                    {activeTab === 'audit' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar"><AuditHistoryViewer history={context.artifacts.auditHistory} /></div>}
                </div>
            </div>
        </div>

        {/* Floating Action Island */}
        {(!isIdle) && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="flex items-center gap-1 p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-2xl border dark:border-white/20 border-white/60 rounded-full shadow-2xl ring-1 ring-black/5">
                   
                   {/* Stop Button */}
                   {isProcessing && (
                      <button 
                        onClick={handleStop}
                        className="p-3 rounded-full hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center"
                        title="紧急终止"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   )}

                   {/* Retry Button */}
                   {isStopped && (
                       <button 
                         onClick={retryPipeline}
                         className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                       >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                           <span>断点重试</span>
                       </button>
                   )}
                   
                   {/* Skip Audit (Only at step 6) */}
                   {currentStepId === 6 && !isFinished && (
                       <button 
                         onClick={handleSkipAudit}
                         className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-full font-bold text-xs flex items-center gap-2 transition-transform active:scale-95"
                       >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                           <span>跳过审计</span>
                       </button>
                   )}

                   {/* Export Button (Available when context has some data) */}
                   {currentStepId > 1 && (
                       <button 
                         onClick={handleExportClick}
                         className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-transform active:scale-95"
                       >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           <span>导出交付物</span>
                       </button>
                   )}
                </div>
            </div>
        )}

      </div>
    </MainLayout>
  );
};

export default App;