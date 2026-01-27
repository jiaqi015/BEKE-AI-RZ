
import React from 'react';
import { useTheme } from '../ThemeContext';

interface Props {
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ headerAction, children }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen flex-col font-sans overflow-hidden relative transition-colors duration-500`}>
      
      <header className={`h-16 px-6 flex items-center justify-between shrink-0 z-50 transition-all duration-500 backdrop-blur-3xl border-b ${
          isDark 
          ? 'bg-black/60 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-white/80 border-black/5 shadow-[0_2px_15px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 group cursor-default">
            {/* 品牌徽章 */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative shadow-lg overflow-hidden transition-all duration-500 group-hover:scale-110 active:scale-95 ${
                isDark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white ring-1 ring-black/5'
            }`}>
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90 animate-aurora"></div>
               <span className="relative z-10 text-xl font-black text-white leading-none transform -rotate-12 select-none drop-shadow-sm">
                  新
               </span>
               <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            <div className="flex flex-col justify-center">
              <span className={`text-base font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>陈新软 AI</span>
              <span className={`text-[9px] font-bold mt-1 tracking-[0.1em] uppercase ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>您的私人软著专家</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
           {/* Premium Theme Toggle */}
           <div className={`flex items-center p-1 rounded-full border transition-all duration-300 ${
             isDark ? 'bg-zinc-900 border-white/10' : 'bg-gray-100 border-black/5'
           }`}>
             <button 
               onClick={() => theme === 'light' && toggleTheme()}
               className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                 !isDark ? 'bg-white text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
               }`}
               title="明亮模式"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
             </button>
             <button 
               onClick={() => theme === 'dark' && toggleTheme()}
               className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                 isDark ? 'bg-zinc-800 text-blue-400 shadow-lg ring-1 ring-white/10' : 'text-gray-400 hover:text-gray-600'
               }`}
               title="深邃模式"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
             </button>
           </div>
           
           {headerAction}
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden relative z-0">
        {children}
      </main>
    </div>
  );
};
