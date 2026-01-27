
import React, { useState, useEffect } from 'react';

interface Props {
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ headerAction, children }) => {
  const [isDark, setIsDark] = useState(true);

  // Toggle Theme Class on HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDark]);

  return (
    <div className={`flex h-screen flex-col font-sans overflow-hidden relative transition-colors duration-700 ${isDark ? 'bg-black text-zinc-200' : 'bg-[#F5F5F7] text-gray-900'}`}>
      
      {/* iOS Style Floating Glass Header */}
      <header className={`h-16 px-6 flex items-center justify-between shrink-0 z-50 transition-all duration-500 backdrop-blur-3xl border-b ${
          isDark 
          ? 'bg-black/60 border-white/10' // 增加不透明度，提升对比度
          : 'bg-white/80 border-black/5'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 group cursor-default">
            {/* Logo Icon with Glass effect */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative shadow-lg overflow-hidden transition-transform duration-500 group-hover:scale-105 ${
                isDark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white ring-1 ring-black/5'
            }`}>
               <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-amber-500 opacity-90"></div>
               <span className="relative z-10 text-xl font-black text-yellow-950 leading-none transform -rotate-12 select-none" style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
                  新
               </span>
            </div>
            
            <div className="flex flex-col justify-center">
              <span className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>陈新软 AI</span>
              <span className={`text-[10px] font-medium mt-0.5 tracking-wide ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>全球唯一全自动 AI 软著工具</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
           {/* Theme Toggle Pill */}
           <button 
             onClick={() => setIsDark(!isDark)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium shadow-sm hover:scale-105 active:scale-95 ${
                isDark 
                ? 'bg-white/10 border-white/10 text-zinc-200 hover:bg-white/20' 
                : 'bg-white border-black/5 text-gray-700 hover:bg-gray-50'
             }`}
           >
             {isDark ? (
                 <>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   <span>浅色模式</span>
                 </>
             ) : (
                 <>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                   <span>深色模式</span>
                 </>
             )}
           </button>

           {headerAction}
        </div>
      </header>
      
      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative z-0">
        {children}
      </main>
    </div>
  );
};
