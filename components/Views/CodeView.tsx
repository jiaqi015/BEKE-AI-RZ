
import React from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
  currentStepId: number;
}

export const CodeView: React.FC<Props> = ({ context, currentStepId }) => {
  if (!context.artifacts.sourceCode) {
    if (currentStepId >= 5) {
        // Hacker Style Loading
        return (
            <div className="flex h-full flex-col bg-[#1e1e1e] relative overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3 bg-[#252526] border-b border-black/50 shrink-0 z-10">
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                        <span className="ml-4 text-sm text-zinc-500 font-mono">Compiling...</span>
                    </div>
                </div>
                
                <div className="p-6 font-mono text-xs space-y-1 opacity-70">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="flex gap-4 animate-pulse" style={{ animationDelay: `${i * 50}ms`, opacity: 1 - i * 0.05 }}>
                            <div className="w-8 text-zinc-600 text-right">{i+1}</div>
                            <div className="h-3 bg-zinc-700/50 rounded" style={{ width: `${Math.random() * 40 + 20}%` }}></div>
                        </div>
                    ))}
                </div>

                {/* Matrix Rain Effect Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
                
                <div className="absolute bottom-10 right-10 bg-black/80 backdrop-blur border border-green-500/30 px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.1)]">
                     <div className="flex items-center gap-3">
                         <span className="relative flex h-3 w-3">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                         </span>
                         <div className="font-mono text-green-400 font-bold tracking-widest text-sm">
                             BUILDING_SOURCE_TREE
                         </div>
                     </div>
                     <div className="mt-2 text-[10px] text-green-600 font-mono">
                         > Generating Module: Controller... OK<br/>
                         > Generating Module: Service... OK<br/>
                         > Generating Module: DAO... PENDING
                     </div>
                </div>
            </div>
        );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-600 space-y-4 opacity-60 select-none">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase">代码构建中...</span>
      </div>
    );
  }

  const lines = context.artifacts.sourceCode.split('\n');

  return (
    <div className="flex h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-6 py-3 bg-[#252526] border-b border-black/50 shrink-0 z-10 select-none shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
          <span className="ml-4 text-sm text-zinc-300 font-sans tracking-tight font-medium">SourceGenerator.java</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">Ln {lines.length}, Col 1</span>
      </div>
      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-0 custom-scrollbar">
        <div className="flex flex-col min-h-full font-mono text-[13.5px] leading-7">
          {lines.map((line, idx) => (
            <div key={idx} className="flex hover:bg-[#2a2d2e] group/code transition-colors">
              <div className="w-16 text-right pr-6 text-[#6e7681] select-none text-xs pt-[1px] group-hover/code:text-[#c6c6c6] bg-[#1e1e1e] border-r border-transparent group-hover/code:border-[#404040]">{idx + 1}</div>
              <div className="flex-1 pl-6 text-[#d4d4d4] whitespace-pre tab-4">{line}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
