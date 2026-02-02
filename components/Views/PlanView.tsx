
import React, { useState, useEffect, useRef } from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
  currentStepId: number;
}

// 模拟的分析任务队列
const ANALYSIS_TASKS = [
  { id: 'nlp', label: '自然语言语义解构', detail: 'Tokenizing input stream...' },
  { id: 'entity', label: '核心实体提取', detail: 'Identifying Actors & Objects...' },
  { id: 'intent', label: '业务意图推导', detail: 'Mapping User Stories...' },
  { id: 'arch', label: '系统架构匹配', detail: 'Selecting Tech Stack...' },
  { id: 'model', label: '领域模型构建', detail: 'Generating ER Diagram...' },
  { id: 'validate', label: '逻辑闭环验证', detail: 'Checking Consistency...' },
];

// 模拟的提取数据流（增加视觉丰富度）
const SIMULATED_LOGS = [
  "> [NLP] 检测到输入长度: 1024 tokens",
  "> [NLP] 语义密度分析: High",
  "> [ENTITY] 识别角色: 'User', 'Admin'",
  "> [ENTITY] 识别对象: 'Order', 'Product'",
  "> [INTENT] 核心流程: CRUD -> Audit",
  "> [ARCH] 推荐架构: Microservices",
  "> [MODEL] 实体关系: 1:N Detected",
  "> [VALIDATE] 依赖检查: Pass",
  "> [GEN] 准备生成 FactPack..."
];

export const PlanView: React.FC<Props> = ({ context, currentStepId }) => {
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 模拟任务进度
  useEffect(() => {
    if (!context.factPack && currentStepId >= 1) {
      const taskInterval = setInterval(() => {
        setActiveTaskIndex(prev => {
          if (prev < ANALYSIS_TASKS.length - 1) return prev + 1;
          return prev;
        });
      }, 1500); // 每1.5秒完成一个任务

      return () => clearInterval(taskInterval);
    }
  }, [context.factPack, currentStepId]);

  // 模拟日志流滚动
  useEffect(() => {
    if (!context.factPack && currentStepId >= 1) {
      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < SIMULATED_LOGS.length) {
          setLogs(prev => [...prev, SIMULATED_LOGS[logIdx]]);
          logIdx = (logIdx + 1) % SIMULATED_LOGS.length; // 循环播放日志保持活跃感
        }
      }, 800);
      return () => clearInterval(logInterval);
    }
  }, [context.factPack, currentStepId]);

  // 日志自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // ==================================================================================
  // LOADING STATE (The "System Monitor" Look)
  // ==================================================================================
  if (!context.factPack) {
    if (currentStepId >= 1) {
      return (
        <div className="h-full w-full bg-[#0c0c0c] text-zinc-300 font-mono p-8 md:p-12 flex flex-col relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto w-full h-full flex flex-col gap-8">
            
            {/* Header Status */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-blue-500 animate-pulse"></div>
                  深度架构分析引擎
                </h2>
                <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Deep Architecture Analysis Engine // v3.0.1</p>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-xs text-zinc-500">ELAPSED</div>
                <div className="text-lg font-bold text-blue-400 tabular-nums">00:0{activeTaskIndex + 1}:42</div>
              </div>
            </div>

            {/* Main Monitor Content */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
              
              {/* Left Column: Task Checklist */}
              <div className="flex flex-col gap-1 overflow-y-auto pr-2">
                <div className="text-[10px] font-bold text-zinc-600 uppercase mb-4 tracking-wider">Execution Pipeline</div>
                {ANALYSIS_TASKS.map((task, idx) => {
                  const status = idx < activeTaskIndex ? 'done' : idx === activeTaskIndex ? 'running' : 'pending';
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-500 ${
                        status === 'running' 
                          ? 'bg-blue-900/10 border-blue-500/30 text-white' 
                          : status === 'done'
                            ? 'bg-zinc-900/30 border-white/5 text-zinc-400'
                            : 'bg-transparent border-transparent text-zinc-700 opacity-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-5 flex justify-center shrink-0">
                        {status === 'done' && <span className="text-emerald-500">✓</span>}
                        {status === 'running' && <span className="block w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
                        {status === 'pending' && <span className="block w-1.5 h-1.5 bg-zinc-700 rounded-full"></span>}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                         <div className="text-sm font-bold flex justify-between">
                            {task.label}
                            {status === 'running' && <span className="text-[10px] font-normal text-blue-400 animate-pulse">PROCESSING</span>}
                         </div>
                         <div className="text-[10px] opacity-60 font-mono mt-0.5">
                            {status === 'pending' ? 'Waiting...' : task.detail}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Live Data Stream */}
              <div className="flex flex-col bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                 <div className="bg-zinc-900/50 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Live Output Stream</span>
                    <div className="flex gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                       <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                       <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                    </div>
                 </div>
                 <div 
                    ref={logContainerRef}
                    className="flex-1 p-4 font-mono text-xs space-y-2 overflow-y-auto custom-scrollbar text-zinc-300"
                 >
                    {logs.map((log, i) => (
                      <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-200">
                        <span className="text-blue-500/50 mr-2">{(i+1).toString().padStart(3, '0')}</span>
                        {log}
                      </div>
                    ))}
                    <div className="w-2 h-4 bg-blue-500 animate-pulse inline-block align-middle ml-1"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <div className="h-full flex items-center justify-center opacity-30 font-mono text-xs uppercase tracking-[0.2em]">待机中...</div>;
  }

  // ==================================================================================
  // FINISHED STATE (Result View)
  // ==================================================================================
  const { factPack } = context;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* 1. Reasoning Card */}
      <div className="relative p-6 bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/5 rounded-2xl group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        </div>
        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
           <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>
           AI 架构师：业务拆解分析
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed font-serif italic">
            "已深度解构 PRD。本系统被定义为典型的 <strong>{factPack.softwareType}</strong> 架构。
            我已将业务流程逻辑化为 <strong>{factPack.functionalModules.length}</strong> 个核心子系统，
            并推演了 <strong>{factPack.roles.length}</strong> 个用户角色的交互权限，确保软著申报时的逻辑闭环性达到 99.8%。"
        </p>
      </div>

      {/* 2. Visual Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
           <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">功能组件拓扑</h4>
           <div className="space-y-3">
              {factPack.functionalModules.map((m, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {i+1}
                   </div>
                   <div>
                      <div className="text-sm font-bold text-zinc-200">{m.name}</div>
                      <div className="text-[10px] text-zinc-500">{m.description}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">业务流向映射</h4>
              <div className="flex flex-wrap gap-2 items-center">
                 {factPack.businessFlow.split('->').map((step, i, arr) => (
                   <React.Fragment key={i}>
                      <span className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg border border-white/5">{step.trim()}</span>
                      {i < arr.length - 1 && <span className="text-zinc-600">→</span>}
                   </React.Fragment>
                 ))}
              </div>
           </div>
           
           <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">系统环境要求</h4>
              <div className="flex flex-wrap gap-2">
                 {factPack.environmentCandidates.map((env, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-mono border border-purple-500/20">
                       {env}
                    </span>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
