
import React from 'react';
import { PipelineContext } from '../../types';

interface Props {
  context: PipelineContext;
}

// 简单的 Markdown 解析器，用于模拟 Word 渲染效果
const renderMarkdownLine = (line: string, index: number) => {
  const cleanLine = line.trim();
  
  // 1. Headers
  if (cleanLine.startsWith('# ')) {
    return <h1 key={index} className="text-2xl font-black mb-4 mt-6 text-black">{cleanLine.replace('# ', '')}</h1>;
  }
  if (cleanLine.startsWith('## ')) {
    return <h2 key={index} className="text-xl font-bold mb-3 mt-5 text-black">{cleanLine.replace('## ', '')}</h2>;
  }
  if (cleanLine.startsWith('### ')) {
    return <h3 key={index} className="text-lg font-bold mb-2 mt-4 text-gray-900">{cleanLine.replace('### ', '')}</h3>;
  }

  // 2. Lists
  if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
    return (
      <li key={index} className="ml-4 list-disc pl-1 mb-1 text-justify">
        {parseInlineStyles(cleanLine.substring(2))}
      </li>
    );
  }

  // 3. Numbered Lists
  if (/^\d+\.\s/.test(cleanLine)) {
    return (
       <div key={index} className="ml-4 pl-1 mb-1 text-justify flex gap-2">
         <span className="font-bold text-gray-700 select-none">{cleanLine.split(' ')[0]}</span>
         <span>{parseInlineStyles(cleanLine.replace(/^\d+\.\s/, ''))}</span>
       </div>
    );
  }

  // 4. Empty lines
  if (!cleanLine) {
    return <div key={index} className="h-4"></div>;
  }

  // 5. Standard Paragraph
  return (
    <p key={index} className="mb-2 leading-relaxed text-justify text-gray-800">
      {parseInlineStyles(cleanLine)}
    </p>
  );
};

// 解析行内样式 (**Bold**)
const parseInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-black">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const DocView: React.FC<Props> = ({ context }) => {
  if (!context.artifacts.userManual) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-600 space-y-4 opacity-60 select-none">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase">文档编译中...</span>
      </div>
    );
  }

  const content = context.artifacts.userManual;
  // Split by image tags first
  const parts = content.split(/(> \[INSERT_IMAGE::.*?\])/);
  
  let imageCounter = 0;

  return (
    <div className="p-10 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500 flex justify-center bg-[#F3F4F6] dark:bg-[#09090b]">
      {/* A4 Paper Container */}
      <div className="bg-white text-black min-h-[1123px] w-full max-w-[850px] px-[80px] py-[70px] shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative transition-transform duration-300">
        
        {/* Decorative Header Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-100"></div>
        
        <h1 className="text-3xl font-black mb-16 text-center font-serif tracking-tight text-black border-b-2 border-gray-100 pb-8">
          软件操作说明书
        </h1>
        
        {/* Render Content */}
        <div className="font-serif text-[15px]">
          {parts.map((part, i) => {
            const match = part.match(/> \[INSERT_IMAGE::(.*?)\]/);
            
            // Render Image Block
            if (match) {
              imageCounter++;
              const filename = match[1];
              const blobUrl = context.artifacts.uiImages[filename];
              
              // Clean up filename for caption (Remove "UI_01_" and ".png")
              const cleanCaption = filename
                .replace(/^UI_\d+_/, '')
                .replace(/\.(png|jpg|jpeg)$/i, '');

              return (
                <div key={i} className="my-10 break-inside-avoid">
                  <div className="p-2 border border-gray-200 bg-white shadow-sm rounded-sm">
                    {blobUrl ? ( 
                      <img src={blobUrl} alt={filename} className="w-full h-auto object-contain" style={{ maxHeight: '500px' }} /> 
                    ) : ( 
                      <div className="h-48 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 text-gray-400">
                        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-mono">[图片正在生成中: {filename}]</span>
                      </div> 
                    )}
                  </div>
                  <p className="text-center text-sm font-bold text-gray-600 mt-3 font-sans">
                    图 {imageCounter}：{cleanCaption}
                  </p>
                </div>
              );
            }

            // Render Text Block (Line by Line processing)
            if (!part.trim()) return null;
            return (
              <div key={i} className="mb-4">
                {part.split('\n').map((line, lIdx) => renderMarkdownLine(line, lIdx))}
              </div>
            );
          })}
        </div>
        
        {/* Footer Page Number Simulation */}
        <div className="absolute bottom-8 left-0 w-full text-center text-xs text-gray-400 font-mono">
           - PAGE {Math.floor(Math.random() * 5) + 1} -
        </div>
      </div>
    </div>
  );
};
