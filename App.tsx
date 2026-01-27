
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

// 子视图组件
import { PlanView } from './components/Views/PlanView';
import { DocView } from './components/Views/DocView';
import { CodeView } from './components/Views/CodeView';

type TabType = 'plan' | 'doc' | 'code' | 'audit';

const ESTIMATED_TOTAL_MS = 25 * 60 * 1000; 

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
        }, 1000);
    } else {
        setElapsedCurrentStep(0);
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

  const handleAutoSubmitGap = () => {
    if (!context.factPack) return;
    
    const factPack = context.factPack;
    const type = factPack.softwareType;
    const isJava = type === 'Backend';
    const isApp = type === 'App';

    const defaultTools = isJava ? ['IntelliJ IDEA', 'MySQL'] : isApp ? ['Android Studio', 'Xcode'] : ['VS Code', 'Chrome'];
    const defaultLangs = isJava ? ['Java', 'SQL'] : isApp ? ['Kotlin', 'Swift'] : ['TypeScript', 'Vue.js'];

    const autoInfo: RegistrationInfo = {
      softwareFullName: factPack.softwareNameCandidates[0] || '智能申报系统',
      softwareAbbreviation: '',
      version: 'V1.0.0',
      completionDate: new Date().toISOString().split('T')[0],
      copyrightHolder: '研发技术部',
      devHardwareEnv: 'MacBook Pro M3; 32G RAM; 1TB SSD',
      runHardwareEnv: isApp ? 'iOS 16+ / Android 13+' : 'Linux CentOS 7.9',
      devSoftwareEnv: isApp ? 'macOS Sonoma' : 'Windows 11 / Linux',
      runSoftwareEnv: isApp ? 'Mobile OS' : 'Web Browser / Node.js',
      devTools: defaultTools,
      programmingLanguage: defaultLangs,
      sourceLineCount: '35000',
      isCollaboration: false,
    };

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
    setInputPrd("// 正在为您构思一个充满商业想象力的产品原型...");
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
              <p className="text-sm text-zinc-400 leading-relaxed">请选择一个有效的 API 密钥，开启您的智能写作之旅。</p>
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

      <aside className="w-72 flex flex-col h-full shrink-0 z-20 backdrop-blur-2xl transition-all duration-500 border-r dark:bg-black/60 bg-white/60 dark:border-white/10 border-white/40 hidden md:flex">
        <div className="p-6">
           <h2 className="text-[11px] font-bold dark:text-zinc-300 text-gray-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
             核心工作流
           </h2>
           <StepIndicator steps={steps} currentStepId={currentStepId} />
        </div>
        <div className="flex-1 p-6 flex flex-col justify-end">
           {(globalStats.totalTime > 0 || isProcessing) && (
                <div className="dark:bg-white/10 bg-white/80 border dark:border-white/10 border-white/50 rounded-2xl p-4 shadow-lg backdrop-blur-xl space-y-4">
                   <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 dark:text-zinc-300 uppercase font-bold tracking-widest">任务指标统计</span>
                        <div className="relative flex items-center justify-center">
                          {isProcessing && !isFinished && (
                            <span className="absolute w-4 h-4 rounded-full bg-blue-500/40 animate-ping"></span>
                          )}
                          <div className={`w-1.5 h-1.5 rounded-full z-10 ${isFinished ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse'}`}></div>
                        </div>
                   </div>
                   
                   <div className="flex items-baseline justify-between">
                      <div className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                          {globalStats.totalTime > 60000 ? (globalStats.totalTime/60000).toFixed(1) + '分' : (globalStats.totalTime/1000).toFixed(0) + '秒'}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">已投入时长</div>
                        <div className="text-[9px] font-bold text-blue-500 dark:text-blue-400 mt-0.5 whitespace-nowrap opacity-80 select-none">预估时长 50 分</div>
                      </div>
                   </div>

                   <div className="flex items-baseline justify-between border-t border-white/5 pt-2">
                      <div className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                          {(globalStats.totalTokens / 1000).toFixed(1)}k
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">Tokens 消耗</div>
                   </div>

                   <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1 overflow-hidden">
                       <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-indigo-500`} style={{ width: isFinished ? '100%' : `${Math.min(100, (globalStats.totalTime / ESTIMATED_TOTAL_MS) * 100)}%` }}></div>
                   </div>
                </div>
           )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {isIdle && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-700">
                <div className="max-w-3xl w-full animate-float">
                    <div className="glass-panel dark:glass-panel bg-white/70 dark:bg-black/60 rounded-[40px] p-10 text-center relative overflow-hidden ring-1 ring-white/20 shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-white/60 tracking-tight mb-10">
                                全球首个软著 Agent
                            </h1>
                            
                            {/* 输入卡片 */}
                            <div className="relative w-full max-w-xl mx-auto flex flex-col bg-gray-100/30 dark:bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-inner backdrop-blur-xl mb-8">
                                <textarea
                                    className="w-full h-40 p-6 bg-transparent outline-none transition-all font-mono text-sm dark:text-white/90 text-gray-800 resize-none placeholder-gray-500 dark:placeholder-white/40 custom-scrollbar"
                                    placeholder="// 请输入您的纯文字创意、点子或者 PRD 内容...\n// 您可以直接粘贴文本，或点击下方按钮上传 PDF 参考文档进行深度编译。"
                                    value={inputPrd}
                                    onChange={(e) => setInputPrd(e.target.value)}
                                />
                                
                                {attachedFile && (
                                    <div className="mx-4 mb-4 flex items-center justify-between px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <span className="text-xs font-semibold text-blue-200 truncate">{attachedFile.name}</span>
                                        </div>
                                        <button onClick={removeAttachment} className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white transition-all">✕</button>
                                    </div>
                                )}
                                
                                <div className="p-4 border-t border-white/5 flex items-center gap-3">
                                   <input type="file" ref={fileInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
                                   <button 
                                      onClick={() => fileInputRef.current?.click()} 
                                      className={`h-14 px-5 rounded-2xl bg-white/10 border border-white/5 text-[11px] font-bold text-gray-500 dark:text-zinc-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:bg-white/20 ${isReadingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                                   >
                                      {isReadingPdf ? (
                                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      )}
                                      <span>{isReadingPdf ? '解析中' : '上传文档'}</span>
                                   </button>
                                   <button onClick={handleStart} disabled={!inputPrd && !attachedFile} className="flex-1 h-14 bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] font-bold rounded-2xl shadow-xl transition-all disabled:opacity-50">
                                        开始生成材料
                                    </button>
                                   <button onClick={handleSurpriseMe} disabled={isDreaming} className="h-14 px-5 rounded-2xl bg-white/10 border border-white/5 text-[11px] font-bold text-gray-500 dark:text-zinc-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:bg-white/20">
                                      <span className={`text-lg transition-transform ${isDreaming ? 'animate-spin' : ''}`}>{isDreaming ? '💭' : '✨'}</span><span>创意</span>
                                   </button>
                                </div>
                            </div>

                            {/* 免责声明 */}
                            <div className="max-w-xl mx-auto px-6 py-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
                                <div className="flex flex-col gap-2 text-left">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">使用指南 & 免责声明</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                                        已经打通 <span className="text-zinc-200 font-bold">Gemini 核心</span>，使用需保持网络🪜连接。本工具生成的软著材料仅供参考，<span className="text-amber-500/80">请根据实际业务自行辨别并核对</span>。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`grid grid-cols-12 h-full transition-all duration-1000 ${isIdle ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className="col-span-12 lg:col-span-5 flex flex-col p-4 gap-4 h-full relative z-10 min-h-0 border-r dark:border-white/10 border-black/5 bg-gray-50/50 dark:bg-transparent">
                <div className="flex-1 relative rounded-2xl overflow-hidden border dark:border-white/10 border-white/60 bg-white/40 dark:bg-black/30 backdrop-blur-2xl shadow-sm min-h-0 flex flex-col ring-1 ring-white/20">
                    {showGapFiller ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-black/40 backdrop-blur-lg animate-in fade-in">
                        <div className="w-full max-w-2xl h-full max-h-[800px]"><GapFiller factPack={context.factPack!} onSubmit={submitGapInfo} /></div>
                    </div>
                    ) : ( <TerminalLog logs={logs} stats={globalStats} /> )}
                </div>
            </div>
            <div className="col-span-12 lg:col-span-7 flex flex-col h-full bg-white/30 dark:bg-white/5 backdrop-blur-3xl">
                <div className="h-16 border-b dark:border-white/10 border-black/5 flex items-center px-6 justify-between shrink-0">
                    <span className="text-[10px] font-bold dark:text-zinc-300 text-gray-500 uppercase tracking-widest flex items-center gap-2">产物实时预览</span>
                    <div className="flex bg-gray-200/50 dark:bg-black/30 p-1 rounded-full border dark:border-white/10 border-white/50 backdrop-blur-md">
                        <TabButton id="plan" label="架构规划" active={activeTab === 'plan'} notify={hasNewPlan} onClick={() => setActiveTab('plan')} />
                        <TabButton id="doc" label="申报文档" active={activeTab === 'doc'} notify={hasNewDoc} onClick={() => setActiveTab('doc')} />
                        <TabButton id="code" label="源代码库" active={activeTab === 'code'} notify={hasNewCode} onClick={() => setActiveTab('code')} />
                        {context.artifacts.auditHistory.length > 0 && (
                            <TabButton id="audit" label="审计全史" active={activeTab === 'audit'} notify={hasNewAudit} onClick={() => setActiveTab('audit')} />
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

        {/* 灵动岛 (Dynamic Island) - 重构版 */}
        {!isIdle && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] flex items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                <div className={`
                    flex items-center gap-2 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-white/20 backdrop-blur-3xl transition-all duration-700 w-fit
                    ${isProcessing 
                        ? 'bg-black/95 dark:bg-zinc-900/95 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                        : isFinished 
                            ? 'bg-emerald-600 dark:bg-emerald-900/95 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            : 'bg-white/95 dark:bg-black/95 border-white/20'
                    }
                    border
                `}>
                    
                    {/* 状态区 */}
                    <div className={`flex items-center gap-2.5 pl-4 pr-3 border-r transition-colors duration-500 ${isProcessing ? 'border-white/10' : 'border-black/10'}`}>
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.1em] whitespace-nowrap">
                                    {activeStep?.name || '正在创作'}
                                </span>
                            </div>
                        ) : isFinished ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap">材料已就绪</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.1em] whitespace-nowrap">
                                    {showGapFiller ? '等待补充信息' : '任务已暂停'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 动作区 */}
                    <div className="flex items-center gap-1.5 px-1">
                        {/* 智能继续倒计时（仅信息补全阶段） */}
                        {showGapFiller && gapCountdown !== null && (
                          <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full animate-in zoom-in-95 duration-500">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest whitespace-nowrap">30s 自动推断倒计时</span>
                            <div className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full font-mono text-[11px] font-black animate-pulse">
                              {gapCountdown}
                            </div>
                          </div>
                        )}

                        {/* 运行中：仅显示暂停 */}
                        {isProcessing && !showGapFiller && (
                            <button 
                                onClick={handleStop} 
                                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-black text-[11px] transition-all active:scale-90 flex items-center gap-2"
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                暂停
                            </button>
                        )}

                        {/* 暂停中：显示继续与重来 */}
                        {isStopped && (
                            <div className="flex items-center gap-1.5 animate-in slide-in-from-bottom-2">
                                <button 
                                    onClick={retryPipeline} 
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-[11px] shadow-lg transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    继续创作
                                </button>
                                <button 
                                    onClick={handleReset} 
                                    className="px-5 py-2 bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 rounded-full font-black text-[11px] transition-all active:scale-95 whitespace-nowrap"
                                >
                                    放弃重来
                                </button>
                            </div>
                        )}

                        {/* 审计环节特殊处理：跳过按钮 */}
                        {currentStepId === 6 && !isFinished && !isProcessing && (
                            <button onClick={handleSkipAuditAction} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-full font-black text-[11px] transition-all active:scale-95 whitespace-nowrap">
                                跳过审计并打包
                            </button>
                        )}

                        {/* 已完成：显示下载与新任务 */}
                        {isFinished && (
                            <div className="flex items-center gap-1.5 animate-in slide-in-from-bottom-2">
                                <button 
                                    onClick={handleExportClick} 
                                    className="px-8 py-2 bg-white text-emerald-600 rounded-full font-black text-[11px] transition-all shadow-xl active:scale-95 whitespace-nowrap flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    下载交付包
                                </button>
                                <button 
                                    onClick={handleReset} 
                                    className="p-2.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all active:scale-90"
                                    title="开启新任务"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
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
