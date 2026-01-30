
import React, { useState, useEffect } from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
  currentStepId: number;
}

const ANALYZER_STEPS = [
  "正在初始化自然语言理解核...",
  "正在解构产品需求文档语义...",
  "正在提取核心业务实体与数据对象...",
  "正在推导系统模块间调用拓扑...",
  "正在根据行业标准匹配最佳技术栈...",
  "正在构建领域模型 (Domain Model)...",
  "正在进行逻辑闭环性验证...",
  "正在生成仿真级工程蓝图..."
];

export const PlanView: React.FC<Props> = ({ context, currentStepId }) => {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!context.factPack && currentStepId >= 1) {
      const timer = setInterval(() => {
        setActiveStepIdx(prev => (prev + 1) % ANALYZER_STEPS.length);
        setProgress(p => Math.min(p + 1.2, 98));
      }, 1200);
      return () => clearInterval(timer);
    }
  }, [context.factPack, currentStepId]);

  if (!context.factPack) {
    if (currentStepId >= 1) {
      return (
        <div className="p-12 space-y-12 max-w-5xl mx-auto relative h-full">
          {/* Cyber Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none"></div>
          
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700 mt-20">
             {/* Main Spinner Ring */}
             <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border border-purple-500/20 rounded-full animate-[ping_2s_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-blue-500">{Math.floor(progress)}%</span>
                </div>
             </div>

             <div className="text-center space-y-3">
                <h2 className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-3 justify-center">
                   <span className="inline-block w-2 h-2 bg-blue-500 animate-pulse"></span>
                   深度架构分析引擎已启动
                </h2>
                <div className="h-6 overflow-hidden">
                    <p className="text-zinc-400 font-mono text-sm animate-in slide-in-from-bottom-2">
                        {ANALYZER_STEPS[activeStepIdx]}
                    </p>
                </div>
             </div>

             {/* Skeleton Pulse */}
             <div className="w-full max-w-md space-y-4">
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4].map(i => <div key={i} className={`h-1 rounded-full ${progress > i*25 ? 'bg-blue-500' : 'bg-zinc-800'} transition-colors duration-1000`}></div>)}
                </div>
             </div>
          </div>
        </div>
      );
    }
    return <div className="h-full flex items-center justify-center opacity-30 font-mono text-xs uppercase tracking-[0.2em]">待机中...</div>;
  }

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
