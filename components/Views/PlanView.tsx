
import React, { useState, useEffect } from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
  currentStepId: number;
}

// 模拟的终端日志流
const MOCK_LOGS = [
  "> 初始化自然语言处理核心...",
  "> 正在解构 PRD 语义...",
  "> 识别到关键实体: User, Order, Payment...",
  "> 构建业务流程泳道图...",
  "> 推演系统边界与上下文...",
  "> 匹配最佳技术栈方案...",
  "> 正在生成领域驱动设计 (DDD) 模型...",
  "> 校验逻辑闭环...",
];

export const PlanView: React.FC<Props> = ({ context, currentStepId }) => {
  // 动态状态管理
  const [logIndex, setLogIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // 模拟进度条和日志滚动
  useEffect(() => {
    if (!context.factPack && currentStepId >= 1) {
      const logInterval = setInterval(() => {
        setLogIndex(prev => (prev + 1) % MOCK_LOGS.length);
      }, 800);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return 98;
          return prev + Math.random() * 2;
        });
      }, 200);

      return () => {
        clearInterval(logInterval);
        clearInterval(progressInterval);
      };
    }
  }, [context.factPack, currentStepId]);

  // Loading State (Process Visualization)
  if (!context.factPack) {
    if (currentStepId >= 1) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto relative">
                {/* Background Grid Decoration */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

                {/* 1. Header with Dynamic Status */}
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping absolute inset-0"></div>
                            <div className="w-3 h-3 rounded-full bg-purple-500 relative shadow-[0_0_10px_#a855f7]"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-purple-400 tracking-widest uppercase animate-pulse">
                                正在深度解析业务架构
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-1">
                                AI CORE ACTIVE • {progress.toFixed(1)}% PROCESSED
                            </span>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7] transition-all duration-200 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* 2. The "Brain" - AI Reasoning Box (Cyberpunk Scanner Style) */}
                <div className="relative h-48 w-full bg-[#0c0a0e] border border-purple-500/20 rounded-2xl overflow-hidden group">
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500/50 shadow-[0_0_20px_#a855f7] animate-[scan_3s_linear_infinite] z-20"></div>
                    <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-purple-500/10 to-transparent animate-[scan_3s_linear_infinite] z-10"></div>
                    
                    {/* Matrix Data Stream */}
                    <div className="absolute inset-0 p-6 font-mono text-xs space-y-2 opacity-60">
                         {MOCK_LOGS.slice(0, logIndex + 1).slice(-6).map((log, i) => (
                             <div key={i} className="text-purple-300/80 animate-in slide-in-from-left-2 fade-in duration-300">
                                 <span className="opacity-50 mr-2">{(Date.now() - (5-i)*100).toString().slice(-4)}</span>
                                 {log}
                             </div>
                         ))}
                         <div className="w-2 h-4 bg-purple-500 animate-pulse inline-block"></div>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-900/20 blur-[80px] rounded-full"></div>
                </div>

                {/* 3. Skeleton: Flow Diagram (Connecting Nodes) */}
                <div className="space-y-4 relative z-10">
                     <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse"></div>
                     <div className="flex gap-4 items-center overflow-hidden py-2">
                        {[1,2,3,4,5].map(i => (
                             <React.Fragment key={i}>
                                <div 
                                    className="h-12 w-28 bg-zinc-900/80 border border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                    <div className="h-2 w-12 bg-zinc-800 rounded"></div>
                                </div>
                                {i < 5 && (
                                    <div className="w-8 h-[2px] bg-zinc-800 rounded-full relative overflow-hidden">
                                         <div className="absolute inset-0 bg-purple-500/50 -translate-x-full animate-[shimmer_1.5s_infinite]" style={{ animationDelay: `${i * 0.2 + 0.5}s` }}></div>
                                    </div>
                                )}
                             </React.Fragment>
                        ))}
                     </div>
                </div>

                {/* 4. Skeleton: Grid Cards (Staggered Entry) */}
                <div className="grid grid-cols-2 gap-6 mt-4 relative z-10">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-36 bg-zinc-900/40 border border-dashed border-white/10 rounded-2xl p-6 relative overflow-hidden">
                             {/* Corner Accents */}
                             <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-600 rounded-tl-lg"></div>
                             <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-600 rounded-tr-lg"></div>
                             <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-600 rounded-bl-lg"></div>
                             <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-600 rounded-br-lg"></div>

                             <div className="h-3 w-24 bg-zinc-800 rounded mb-4 animate-pulse"></div>
                             <div className="flex gap-2 flex-wrap">
                                {[1,2,3,4].map(j => (
                                    <div key={j} className="h-6 w-16 bg-zinc-800/50 rounded-full animate-pulse" style={{ animationDelay: `${j * 100}ms` }}></div>
                                ))}
                             </div>
                             
                             {/* Subtle Shimmer */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" style={{ animationDelay: `${i * 0.5}s` }}></div>
                        </div>
                    ))}
                </div>
                
                {/* CSS Injection for custom Keyframes that Tailwind might miss */}
                <style>{`
                    @keyframes scan {
                        0% { top: 0%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                `}</style>
            </div>
        );
    }
    // Idle State
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-300 space-y-4 opacity-60 select-none">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase">暂无规划数据</span>
      </div>
    );
  }

  const { factPack, registrationInfo, pageSpecs } = context;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* 1. Design Thinking / AI Reasoning */}
      <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-colors duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 0 0-1 1v4.59l-3.29 3.29a1 1 0 0 0 1.41 1.41l4-4a1 1 0 0 0 0-1.41V7a1 1 0 0 0-1-1z"/></svg>
        </div>
        <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          AI 架构师设计思考
        </h3>
        <p className="text-sm text-gray-700 dark:text-zinc-200 leading-relaxed font-serif italic relative z-10">
          "基于用户输入的PRD，系统识别到这是一个典型的 <strong>{factPack.softwareType}</strong> 架构。
          为了确保合规性，我已将其拆解为 <strong>{factPack.functionalModules.length}</strong> 个独立功能模块，
          并自动推导了 <strong>{factPack.roles.length}</strong> 类用户角色以丰富文档视角。
          核心业务流已锁定为 '{factPack.businessFlow.substring(0, 30)}...'，确保逻辑闭环。"
        </p>
      </div>

      {/* 2. Business Flow Visualization */}
      <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-300 uppercase mb-6 tracking-widest">
          核心业务流程泳道
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {factPack.businessFlow.split(/->|→/).map((step, i) => (
            <React.Fragment key={i}>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-blue-100 dark:border-blue-500/20 whitespace-nowrap">
                {step.trim()}
              </div>
              {i < factPack.businessFlow.split(/->|→/).length - 1 && (
                <svg className="w-4 h-4 text-gray-300 dark:text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. Roles & Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roles */}
        <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-300 uppercase mb-4 tracking-widest">用户角色画像</h3>
          <div className="flex flex-wrap gap-2">
            {factPack.roles.map((role, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-2"></span>
                {role}
              </span>
            ))}
          </div>
        </div>
        
        {/* Tech Stack */}
        {registrationInfo && (
          <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-300 uppercase mb-4 tracking-widest">技术栈推演</h3>
            <div className="flex flex-wrap gap-2">
              {registrationInfo.programmingLanguage.map((lang, i) => (
                <span key={i} className="border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-[10px] font-mono text-gray-500 dark:text-zinc-300">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Page Specs (Original Content) */}
      {pageSpecs && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-300 uppercase mb-4 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            界面蓝图 ({pageSpecs.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pageSpecs.map((p, i) => (
              <div key={i} className="flex items-start justify-between bg-white dark:bg-zinc-900/40 border border-gray-200 dark:border-white/5 p-4 rounded-xl hover:border-blue-300 dark:hover:border-blue-500/50 transition-all shadow-sm group">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-500 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">{p.id}</span>
                    <span className="text-sm text-gray-900 dark:text-zinc-100 font-bold">{p.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-300 line-clamp-2 leading-relaxed">{p.purpose}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
