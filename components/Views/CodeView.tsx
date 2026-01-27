
import React from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
}

export const CodeView: React.FC<Props> = ({ context }) => {
  if (!context.artifacts.sourceCode) {
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
