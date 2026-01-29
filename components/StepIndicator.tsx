
import React from 'react';
import { StepStatus, PipelineStep } from '../types';

interface Props {
  steps: PipelineStep[];
  currentStepId: number;
}

const StepIndicator: React.FC<Props> = ({ steps, currentStepId }) => {
  return (
    <div className="flex flex-col relative space-y-4 pl-2">
      {/* 轨迹背景线 */}
      <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gray-200 dark:bg-white/5 z-0"></div>
      
      {steps.map((step, index) => {
        const isActive = step.id === currentStepId;
        const isFixing = step.status === StepStatus.FIXING;
        const isPast = step.status === StepStatus.SUCCESS || step.status === StepStatus.WARN;
        const isError = step.status === StepStatus.ERROR;
        
        // 动态卡片样式
        let cardClasses = 'bg-transparent border border-transparent opacity-40 grayscale scale-[0.98]';
        let titleColor = 'text-gray-400 dark:text-zinc-300';
        let descColor = 'text-gray-300 dark:text-zinc-400';

        if (isActive || isFixing) {
            cardClasses = 'bg-white/80 dark:bg-white/10 border border-blue-500/30 dark:border-white/20 shadow-xl backdrop-blur-xl scale-105 ring-1 ring-blue-500/20';
            titleColor = 'text-gray-900 dark:text-white';
            descColor = 'text-blue-600 dark:text-blue-300';
        } else if (isPast) {
            cardClasses = 'bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 opacity-100 hover:scale-[1.02] transition-all';
            titleColor = 'text-gray-800 dark:text-zinc-200';
            descColor = 'text-emerald-600 dark:text-emerald-400';
        }

        return (
          <div key={step.id} className="relative z-10 flex items-stretch group transition-all duration-500">
            
            {/* 状态圆点指示器 */}
            <div className="flex flex-col items-center mr-5 pt-5 w-8 relative">
               <div className={`w-3.5 h-3.5 rounded-full z-20 transition-all duration-500 shadow-md border-2 border-white dark:border-zinc-900 ${
                  isFixing ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b] scale-125' :
                  (isActive && !isPast) ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6] scale-125' :
                  isPast ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  isError ? 'bg-rose-500' :
                  'bg-gray-300 dark:bg-zinc-700'
               }`}></div>
            </div>

            {/* 步骤内容卡片 */}
            <div className={`flex-1 rounded-[20px] ${cardClasses} p-4 transition-all duration-500 relative overflow-hidden`}>
              
              {/* 激活时的背景渐变 */}
              {isActive && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none animate-pulse"></div>}

              <div className="flex items-center justify-between mb-1 relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-blue-500' : 'opacity-60'}`}>
                  序章 0{index + 1}
                </span>
                
                {/* 耗时与消耗展示 */}
                {step.metrics && (
                   <div className="flex items-center gap-2 font-mono text-[9px] font-bold opacity-70">
                      <span className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {(step.metrics.durationMs / 1000).toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {(step.metrics.tokenUsage / 1000).toFixed(1)}k
                      </span>
                   </div>
                )}
              </div>
              
              <h4 className={`text-[14px] font-black mb-1 transition-colors leading-tight ${titleColor}`}>
                  {step.name}
              </h4>
              
              <div className={`text-[11px] font-medium leading-relaxed transition-all ${isActive ? 'opacity-100' : 'opacity-60'} ${descColor}`}>
                  {isFixing ? '正在应用专家建议进行自我修正...' : step.description}
              </div>

              {/* 成功状态的小勾选 */}
              {isPast && (
                <div className="absolute bottom-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
