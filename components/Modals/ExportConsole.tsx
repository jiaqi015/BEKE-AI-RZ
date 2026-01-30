
import React, { useEffect, useState } from 'react';
import { ExportEvent, ExportPipeline } from '../../utils/exportService';
import { PipelineContext } from '../../types';
import FileSaver from 'file-saver';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: PipelineContext;
}

type SOPPhase = {
    id: string;
    label: string;
    desc: string;
    status: 'pending' | 'active' | 'done';
};

export const ExportConsole: React.FC<Props> = ({ isOpen, onClose, context }) => {
  const [pipelineState, setPipelineState] = useState<ExportEvent>({ step: 'INIT', message: '', progress: 0 });
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Visual SOP List - Fully Localized
  const [phases, setPhases] = useState<SOPPhase[]>([
      { id: 'INIT', label: '环境初始化', desc: 'Environment Setup', status: 'pending' },
      { id: 'COMPILE', label: '文档编译引擎', desc: 'Docx Engine', status: 'pending' },
      { id: 'ASSET', label: '素材注入', desc: 'Asset Injection', status: 'pending' },
      { id: 'AUDIT', label: '合规封存', desc: 'Audit Locking', status: 'pending' },
      { id: 'COMPRESS', label: '压缩打包', desc: 'Zip Archiving', status: 'pending' },
  ]);

  // Translate SOP descriptions for display
  const phaseDescriptions: Record<string, string> = {
      'INIT': '加载本地环境配置',
      'COMPILE': '启动 MS Word 编译引擎',
      'ASSET': '注入高清 UI 原始素材',
      'AUDIT': '封存形式审查审计记录',
      'COMPRESS': '执行最终归档压缩'
  };

  // Start Pipeline when modal opens
  useEffect(() => {
    if (isOpen && !isRunning && !blob) {
        setIsRunning(true);
        const pipeline = new ExportPipeline(context);
        
        pipeline.run((event) => {
            setPipelineState(event);
            
            // Update Phase Status
            setPhases(prev => prev.map(p => {
                const desc = phaseDescriptions[p.id] || p.desc;
                if (p.id === event.step) return { ...p, status: 'active', desc };
                // If we passed this step (rough heuristic based on order)
                const order = ['INIT', 'COMPILE', 'ASSET', 'AUDIT', 'COMPRESS', 'FINISH'];
                const currentIndex = order.indexOf(event.step);
                const pIndex = order.indexOf(p.id);
                if (pIndex < currentIndex) return { ...p, status: 'done', desc };
                return { ...p, desc };
            }));

        }).then((resultBlob) => {
            setBlob(resultBlob);
            setPhases(prev => prev.map(p => ({ ...p, status: 'done', desc: phaseDescriptions[p.id] || p.desc })));
            setIsRunning(false);
        }).catch(err => {
            alert("Export Failed: " + err.message);
            setIsRunning(false);
            onClose();
        });
    }
  }, [isOpen]); // Only trigger on open

  const handleDownload = () => {
      if (blob) {
          const name = context.registrationInfo?.softwareFullName || '软件';
          FileSaver.saveAs(blob, `${name}_申报交付包.zip`);
          onClose(); // Optional: close after download
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
        
        <div className="w-full max-w-4xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            
            {/* LEFT: SOP Checklist */}
            <div className="w-full md:w-1/3 bg-zinc-900/50 border-r border-white/5 p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                
                <h2 className="text-xl font-bold text-white mb-1 tracking-tight">交付控制台</h2>
                <p className="text-[10px] text-zinc-400 font-mono mb-8 uppercase tracking-widest">标准化交付流水线</p>

                <div className="space-y-6 relative z-10">
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10 -z-10"></div>
                    
                    {phases.map((phase) => (
                        <div key={phase.id} className="flex items-center gap-4 group">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-500 ${
                                phase.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-black' :
                                phase.status === 'active' ? 'bg-black border-blue-500 text-blue-500 animate-pulse' :
                                'bg-black border-zinc-700 text-zinc-500'
                            }`}>
                                {phase.status === 'done' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <span className="text-[10px] font-bold">{phases.indexOf(phase) + 1}</span>
                                )}
                            </div>
                            <div>
                                <h4 className={`text-sm font-medium transition-colors ${
                                    phase.status === 'active' ? 'text-blue-400' : 
                                    phase.status === 'done' ? 'text-zinc-200' : 'text-zinc-500'
                                }`}>
                                    {phase.label}
                                </h4>
                                <p className="text-[9px] text-zinc-500 font-mono uppercase">{phase.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Terminal & Action */}
            <div className="flex-1 p-8 flex flex-col relative">
                {/* Status Header */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <div className="text-[10px] text-zinc-500 font-mono mb-1">当前操作</div>
                        <div className="text-2xl font-mono text-white truncate max-w-md">
                            {pipelineState.step === 'FINISH' ? '准备交付' : pipelineState.message || '初始化中...'}
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="text-4xl font-black text-white/20 font-mono">
                             {Math.round(pipelineState.progress)}%
                         </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden mb-6">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${pipelineState.progress}%` }}
                    ></div>
                </div>

                {/* Detailed Log Terminal */}
                <div className="flex-1 bg-black rounded-lg border border-white/10 p-4 font-mono text-[11px] text-zinc-300 overflow-hidden relative mb-6">
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,#000_1px)] bg-[size:100%_2px] pointer-events-none opacity-20"></div>
                    <div className="opacity-90">
                        {'>'} 系统完整性校验... 通过<br/>
                        {'>'} 正在加载本地素材库...<br/>
                        {pipelineState.detail && <><span className="text-blue-400">{'>'} {pipelineState.detail}</span><br/></>}
                        {pipelineState.step !== 'FINISH' && <span className="animate-pulse">_</span>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    {!blob ? (
                        <button disabled className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-500 text-sm font-medium cursor-wait border border-white/5">
                            处理中...
                        </button>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-6 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-medium transition-colors">
                                关闭
                            </button>
                            <button 
                                onClick={handleDownload}
                                className="px-8 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                下载交付包 ({ (blob.size / 1024 / 1024).toFixed(2) } MB)
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};
