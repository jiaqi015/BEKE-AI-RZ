
import React from 'react';
import { StepStatus, PipelineStep } from '../types';

interface Props {
  steps: PipelineStep[];
  currentStepId: number;
}

const StepIndicator: React.FC<Props> = ({ steps, currentStepId }) => {
  return (
    <div className="flex flex-col relative space-y-3 pl-2">
      {/* Background Track Line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-gray-300/50 dark:bg-white/10 z-0"></div>
      
      {steps.map((step, index) => {
        const isActive = step.id === currentStepId;
        const isFixing = step.status === StepStatus.FIXING;
        const isPast = step.status === StepStatus.SUCCESS;
        const isWarn = step.status === StepStatus.WARN;
        const isError = step.status === StepStatus.ERROR;
        
        // Glass Card Styles
        let cardClasses = 'bg-transparent border border-transparent opacity-60 grayscale scale-[0.98]';
        let textColors = 'text-gray-500 dark:text-zinc-400'; // Lighter base gray in dark mode

        if (isActive || isFixing) {
            cardClasses = 'bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 shadow-lg backdrop-blur-md scale-100 ring-1 ring-black/5 dark:ring-white/10';
            textColors = 'text-gray-900 dark:text-white';
        } else if (isPast || isWarn) {
            cardClasses = 'bg-gray-100/50 dark:bg-white/5 border border-transparent opacity-90 hover:opacity-100 hover:scale-[0.99] transition-all';
            textColors = 'text-gray-700 dark:text-zinc-300';
        }

        return (
          <div key={step.id} className="relative z-10 flex items-stretch group min-h-[50px] transition-all duration-500">
            
            {/* Connector Dot */}
            <div className="flex flex-col items-center mr-4 pt-4 w-6 relative">
               <div className={`w-2.5 h-2.5 rounded-full z-20 transition-all duration-500 shadow-sm border border-white dark:border-black/50 ${
                  isFixing ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b] scale-125' :
                  (isActive && !isPast && !isWarn) ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] scale-125' :
                  isPast ? 'bg-emerald-500' :
                  isWarn ? 'bg-amber-500' :
                  isError ? 'bg-rose-500' :
                  'bg-gray-300 dark:bg-zinc-700'
               }`}></div>
            </div>

            {/* Widget Card */}
            <div className={`flex-1 rounded-2xl ${cardClasses} p-3 transition-all duration-500 relative overflow-hidden`}>
              
              {/* Active Glow Gradient */}
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>}

              <div className="flex items-center justify-between mb-1 relative z-10">
                <span className={`text-[9px] font-bold uppercase tracking-wider opacity-80 ${textColors}`}>
                  第 0{index + 1} 步
                </span>
                <div className="flex items-center">
                    {isFixing && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-1"></span>}
                    {isActive && !isFixing && !isPast && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1"></span>}
                </div>
              </div>
              
              <h4 className={`text-xs font-bold mb-0.5 transition-colors ${textColors}`}>
                  {step.name}
              </h4>
              
              {isActive && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-300 font-medium animate-pulse mt-1">
                      {isFixing ? '自动精修中...' : step.description}
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
