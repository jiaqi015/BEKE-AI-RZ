
import React from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
}

export const PlanView: React.FC<Props> = ({ context }) => {
  if (!context.factPack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-600 space-y-4 opacity-60 select-none">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase">暂无规划数据</span>
      </div>
    );
  }

  const { factPack, registrationInfo, pageSpecs } = context;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* 1. Design Thinking / AI Reasoning */}
      <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 0 0-1 1v4.59l-3.29 3.29a1 1 0 0 0 1.41 1.41l4-4a1 1 0 0 0 0-1.41V7a1 1 0 0 0-1-1z"/></svg>
        </div>
        <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          AI 架构师设计思考
        </h3>
        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed font-serif italic">
          "基于用户输入的PRD，系统识别到这是一个典型的 <strong>{factPack.softwareType}</strong> 架构。
          为了确保合规性，我已将其拆解为 <strong>{factPack.functionalModules.length}</strong> 个独立功能模块，
          并自动推导了 <strong>{factPack.roles.length}</strong> 类用户角色以丰富文档视角。
          核心业务流已锁定为 '{factPack.businessFlow.substring(0, 30)}...'，确保逻辑闭环。"
        </p>
      </div>

      {/* 2. Business Flow Visualization */}
      <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-6 tracking-widest">
          核心业务流程泳道
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {factPack.businessFlow.split(/->|→/).map((step, i) => (
            <React.Fragment key={i}>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-blue-100 dark:border-blue-500/20">
                {step.trim()}
              </div>
              {i < factPack.businessFlow.split(/->|→/).length - 1 && (
                <svg className="w-4 h-4 text-gray-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. Roles & Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roles */}
        <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 tracking-widest">用户角色画像</h3>
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
            <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 tracking-widest">技术栈推演</h3>
            <div className="flex flex-wrap gap-2">
              {registrationInfo.programmingLanguage.map((lang, i) => (
                <span key={i} className="border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-[10px] font-mono text-gray-500 dark:text-zinc-400">
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
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 tracking-widest flex items-center gap-2">
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
                  <span className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{p.purpose}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
