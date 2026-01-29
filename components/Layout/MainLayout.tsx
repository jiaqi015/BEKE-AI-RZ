
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-[#050505] text-zinc-200 selection:bg-blue-500/30 overflow-hidden font-sans">
       {/* 
          Background Ambient Mesh 
          微弱的背景光晕，增加层次感
       */}
       <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
       <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
       
       {/* Content Layer */}
       <div className="relative z-10 flex w-full h-full">
         {children}
       </div>
    </div>
  );
};
