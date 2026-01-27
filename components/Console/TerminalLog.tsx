
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../../types';

interface Props {
  logs: LogEntry[];
  stats?: { totalTime: number; totalTokens: number };
}

export const TerminalLog: React.FC<Props> = ({ logs, stats }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Smart Scroll
  const handleScroll = () => {
    if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, shouldAutoScroll]);

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const isError = lastLog?.type === 'error';
  const isRunning = logs.length > 0 && !isError;

  // Format Helpers
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    // Always show seconds to make it look "flowing"
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };
  
  const formatToken = (t: number) => {
    return t > 1000 ? `${(t / 1000).toFixed(1)}k` : t;
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs relative group">
      
      {/* Glass Header - Updated with Real-time Stats */}
      <div className="px-5 py-4 flex items-center justify-between select-none relative z-10 border-b border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-500 ${isRunning ? 'text-emerald-500 bg-emerald-500 animate-pulse' : 'text-zinc-500 bg-zinc-500'}`}></div>
          <span className="font-bold tracking-tight text-[11px] dark:text-zinc-300 text-gray-700 uppercase">
            核心构建引擎实时监控
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Model Badge */}
           <div className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-transparent dark:border-white/5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              <span className="text-[9px] font-bold dark:text-zinc-300 text-zinc-600">Gemini 3.0 Pro</span>
           </div>
           
           {/* Stats Badges */}
           {stats && (
             <>
                <div className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-transparent dark:border-white/5 flex items-center gap-1.5 tabular-nums">
                    <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[9px] font-mono font-medium dark:text-zinc-300 text-zinc-600">{formatTime(stats.totalTime)}</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-transparent dark:border-white/5 flex items-center gap-1.5 tabular-nums">
                    <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="text-[9px] font-mono font-medium dark:text-zinc-300 text-zinc-600">{formatToken(stats.totalTokens)}</span>
                </div>
             </>
           )}
        </div>
      </div>

      {/* Body */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 p-5 overflow-y-auto custom-scrollbar relative z-10 space-y-3.5 dark:text-zinc-200 text-gray-900 bg-white/20 dark:bg-transparent"
      >
        {logs.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center select-none space-y-4 opacity-60">
             <div className="w-12 h-12 rounded-full border border-dashed dark:border-zinc-600 border-gray-400 flex items-center justify-center">
                 <div className="w-1 h-1 bg-zinc-400 rounded-full animate-ping"></div>
             </div>
             <p className="text-[10px] tracking-widest font-medium uppercase text-center dark:text-zinc-400 text-gray-600">等待任务输入...</p>
           </div>
        )}
        
        {logs.map((log, idx) => {
            const isLast = idx === logs.length - 1;
            return (
            <div key={log.id} className={`flex gap-3 group/line transition-all duration-500 ${isLast ? 'opacity-100 translate-y-0' : 'opacity-80 hover:opacity-100'}`}>
                <span className="shrink-0 select-none w-10 text-right opacity-60 font-mono text-[9px] pt-[3px] dark:text-zinc-400 text-gray-500">
                    {log.timestamp.split(':').slice(1,3).join(':')}
                </span>
                
                <div className={`w-[2px] rounded-full mt-1.5 mb-1.5 opacity-80 ${
                    log.type === 'error' ? 'bg-rose-500' :
                    log.type === 'success' ? 'bg-emerald-500' :
                    log.type === 'warning' ? 'bg-amber-500' :
                    log.type === 'system' ? 'bg-blue-500' :
                    'bg-zinc-400 dark:bg-zinc-600'
                }`}></div>

                <div className="flex-1">
                    <span className={`break-words leading-relaxed font-medium tracking-tight ${
                    log.type === 'system' ? 'dark:text-blue-300 text-blue-700' :
                    log.type === 'success' ? 'dark:text-emerald-300 text-emerald-700' :
                    log.type === 'error' ? 'dark:text-rose-300 text-rose-600 font-bold' :
                    log.type === 'warning' ? 'dark:text-amber-300 text-amber-600' :
                    'dark:text-zinc-100 text-gray-900'
                    }`}>
                    {log.message}
                    </span>
                    {isLast && log.type === 'info' && <span className="inline-block w-1.5 h-3.5 bg-zinc-400 ml-1 animate-pulse align-middle opacity-50"></span>}
                </div>
            </div>
            );
        })}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};
