
import React, { useState, useMemo } from 'react';
import { PipelineContext, SourceFile } from '../../types';

interface Props {
  context: PipelineContext;
  currentStepId: number;
}

export const CodeView: React.FC<Props> = ({ context, currentStepId }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const files = context.artifacts.sourceTree || [];
  
  const currentFile = useMemo(() => {
    return files.find(f => f.path === selectedFilePath) || files[0];
  }, [files, selectedFilePath]);

  if (!files.length) {
    if (currentStepId >= 5) {
      return (
        <div className="flex h-full flex-col bg-[#1e1e1e] items-center justify-center p-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>
             <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/30 animate-pulse">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <div className="space-y-2">
                    <h3 className="text-green-400 font-mono text-lg font-bold tracking-widest uppercase">Agent Cluster Building Project...</h3>
                    <p className="text-zinc-500 font-mono text-xs">Architect is designing directory structures...</p>
                </div>
                <div className="flex gap-1 justify-center">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="w-1.5 h-6 bg-green-500/40 animate-bounce" style={{ animationDelay: `${i*150}ms` }}></div>)}
                </div>
             </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono space-y-4 opacity-60">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">等待代码引擎启动</span>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono overflow-hidden">
      {/* Sidebar: File Tree */}
      <aside className="w-64 border-r border-[#333] flex flex-col shrink-0 bg-[#252526]">
        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
           <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">项目文件树</span>
           <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">{files.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFilePath(file.path)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] flex items-center gap-2 transition-all ${
                (selectedFilePath === file.path || (!selectedFilePath && files[0].path === file.path))
                  ? 'bg-[#37373d] text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-[#2a2d2e] hover:text-zinc-300'
              }`}
            >
              <span className={file.path.includes('src/main/java') ? 'text-orange-400' : 'text-blue-400'}>
                 {file.path.endsWith('.java') ? '☕' : file.path.endsWith('.sql') ? '🗄️' : '📄'}
              </span>
              <span className="truncate">{file.path.replace(/^src\/(main|test)\/(java|resources)\//, '')}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main: Code Editor */}
      <main className="flex-1 flex flex-col min-w-0">
         <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-black/20 shrink-0">
             <div className="flex items-center gap-2 bg-[#1e1e1e] px-4 py-2 border-t-2 border-blue-500 rounded-t-sm h-full text-xs">
                <span className="text-blue-400">📄</span>
                <span>{currentFile?.name}</span>
             </div>
         </div>
         
         <div className="flex-1 overflow-auto custom-scrollbar p-4 text-[13px] leading-6 selection:bg-blue-500/30">
            <pre className="font-mono">
              {currentFile?.content.split('\n').map((line, idx) => (
                <div key={idx} className="flex group/line hover:bg-white/5">
                   <span className="w-12 shrink-0 text-zinc-600 text-right pr-4 select-none group-hover/line:text-zinc-400">{idx + 1}</span>
                   <span className="whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
         </div>

         {/* Footer Status */}
         <footer className="h-6 bg-[#007acc] flex items-center px-4 justify-between text-[10px] font-bold text-white shrink-0">
            <div className="flex items-center gap-4">
                <span>UTF-8</span>
                <span>{currentFile?.language.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-4">
                <span>Ln {currentFile?.content.split('\n').length}, Col 1</span>
                <span>Spaces: 4</span>
            </div>
         </footer>
      </main>
    </div>
  );
};
