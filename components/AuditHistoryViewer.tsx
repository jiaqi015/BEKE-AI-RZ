
import React from 'react';
import { AuditReport } from '../types';

interface Props {
  history: AuditReport[];
}

export const AuditHistoryViewer: React.FC<Props> = ({ history }) => {
  if (!history || history.length === 0) return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-zinc-300 animate-in fade-in zoom-in duration-500 select-none">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest opacity-80">等待审计引擎启动...</span>
      </div>
  );

  return (
    <div className="p-8 pb-40 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
       
       <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
           <div>
             <h2 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight">质量演进全史</h2>
             <p className="text-xs text-gray-500 dark:text-zinc-300 mt-1 font-mono">Quality Evolution Timeline • {history.length} 轮迭代</p>
           </div>
           <div className="text-right">
              <div className="text-xs font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider mb-1">当前评分</div>
              <div className={`text-3xl font-black font-mono ${
                  history[history.length-1].score >= 90 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                  {history[history.length-1].score}
                  <span className="text-sm text-gray-400 font-sans font-normal ml-1">/ 100</span>
              </div>
           </div>
       </div>

       <div className="relative border-l-2 border-dashed border-gray-300 dark:border-zinc-800 ml-4 space-y-0">
          {history.map((report, idx) => {
              const isLast = idx === history.length - 1;
              const isPassed = report.passed;
              
              return (
                  <div key={idx} className="relative pl-10 pb-12 group">
                      {/* Timeline Node */}
                      <div className={`absolute -left-[11px] top-0 w-6 h-6 rounded-full border-4 border-gray-50 dark:border-black shadow-lg z-10 flex items-center justify-center transition-all duration-500 ${
                          isPassed ? 'bg-emerald-500 scale-110' : 'bg-amber-500'
                      }`}>
                          {isPassed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      
                      {/* Connecting Line Overlay for Active State */}
                      {!isLast && (
                          <div className="absolute left-[-2px] top-6 bottom-0 w-[2px] bg-blue-500/30"></div>
                      )}

                      {/* Card Container */}
                      <div className={`relative transition-all duration-500 ${isLast ? 'opacity-100 translate-x-0' : 'opacity-80 hover:opacity-100'}`}>
                          
                          {/* Header Badge */}
                          <div className="flex items-center gap-3 mb-3">
                              <span className="text-[10px] font-bold font-mono px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-zinc-200 border border-gray-200 dark:border-white/5">
                                  第 0{report.round} 轮
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">{report.timestamp}</span>
                          </div>

                          {/* Main Report Card */}
                          <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                              
                              <div className="flex items-start justify-between mb-4">
                                  <div className="pr-4">
                                      <h3 className="text-base font-bold dark:text-zinc-200 text-gray-800 leading-tight mb-2">
                                          {report.summary}
                                      </h3>
                                      <div className="flex flex-wrap gap-2">
                                          {report.issues.length === 0 ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                                  完美无瑕
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                                                  发现 {report.issues.length} 个缺陷
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <div className={`text-xl font-black font-mono ${
                                          report.score >= 90 ? 'text-emerald-500' : 'text-amber-500'
                                      }`}>
                                          {report.score}
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Problem Section (Red) */}
                              {report.issues.length > 0 && (
                                  <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-100 dark:border-rose-500/10 mb-4">
                                      <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                          审计阻断项
                                      </h4>
                                      <div className="space-y-3">
                                          {report.issues.map((issue, i) => (
                                              <div key={i} className="flex gap-3 text-xs">
                                                  <div className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                                                  <div className="flex-1">
                                                      <span className="font-bold text-rose-700 dark:text-rose-300 block mb-0.5">[{issue.category}] {issue.message}</span>
                                                      <span className="text-rose-600/70 dark:text-rose-400/60 text-[10px]">建议：{issue.suggestion}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}

                              {/* Solution Section (Blue) - This shows what happened AFTER this round */}
                              {report.fixSummary && report.fixSummary.length > 0 && (
                                  <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/10 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-3 opacity-10">
                                          <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11 17l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
                                      </div>
                                      <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                         AI 自动修复执行报告
                                      </h4>
                                      <ul className="space-y-2 relative z-10">
                                          {report.fixSummary.map((fix, i) => (
                                              <li key={i} className="text-[11px] text-blue-800 dark:text-blue-200 pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                                                  {fix}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                              
                              {/* Manual Fallback */}
                              {report.manualSuggestions && report.manualSuggestions.length > 0 && (
                                   <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-dashed border-amber-300 dark:border-amber-700 rounded-lg">
                                       <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mb-1">人工介入建议</div>
                                       {report.manualSuggestions.map((s, k) => (
                                           <div key={k} className="text-[10px] text-amber-700 dark:text-amber-400 pl-3 border-l-2 border-amber-300">{s}</div>
                                       ))}
                                   </div>
                              )}
                          </div>
                      </div>
                  </div>
              );
          })}
       </div>
    </div>
  );
};
