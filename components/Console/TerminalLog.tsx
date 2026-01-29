
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LogEntry } from '../../types';
import { useTheme } from '../ThemeContext';

interface Props {
  logs: LogEntry[];
  stats?: { totalTime: number; totalTokens: number };
}

interface LogGroup {
  id: string;
  stepName: string;
  entries: LogEntry[];
  isCompleted: boolean;
  type: 'process' | 'system' | 'audit';
}

const LITERARY_TIPS = [
  "月亮并不想拯救谁，它只是在那儿，看着你狼狈。",
  "所有的道别都是为了不再见，只有人类自作多情地期盼重逢。",
  "灯火通明处未必有温暖，黑暗深处也未必有真相。",
  "我们都是时代的燃料，区别只是烧得灿烂还是冒点黑烟。",
  "所谓理想，不过是给自己套上了一层精美的枷锁。",
  "世界是一场巨大的排演，可惜正式演出时我们已经谢幕了。",
  "沉默是最高级的妥协，而喧嚣是最低级的挣扎。",
  "所有的相遇都是久别重逢，但重逢往往是为了再次弄丢对方。",
  "如果生活是一本书，我希望它是那种能让人迅速睡着的说明书。",
  "星星在几光年外就死去了，它们的余晖只是为了让我们产生‘美好’的幻觉。",
  "痛苦是平庸灵魂的唯一勋章。",
  "虚无并不可怕，可怕的是你试图填满它。",
  "灵魂的重量是二十一克，剩下的重量全是还没来得及撒的谎。",
  "我们在这个星球上漫步，不过是死神在挑选晚宴的食材。",
  "所谓的成熟，就是学会给每一颗破碎的心涂上得体的保护色。",
  "孤独是自由的税。既然交不起，就请保持清贫。",
  "如果你在深渊里仰望星空，那星空大概也在俯视深渊里的垃圾。",
  "玫瑰凋零不是因为它软弱，是因为它完成了对这个世界的最后一次讽刺。",
  "时间的沙漏里，漏掉的永远是那些最不该忘却的碎片。",
  "悲剧不是死亡，而是你发现自己竟然已经习惯了这种生活。",
  "人类最大的发明不是火，而是‘明天会更好’这句咒语。",
  "真相就像手术刀，切开谎言的同时，也切断了你最后一点念想。",
  "我们终其一生，都在为那些从未真正拥有过的东西哀悼。",
  "影子是唯一不会离开你的朋友，可惜它只能在有光的时候出现。",
  "生活不只是眼前的苟且，还有远方永远也够不着的幻觉。",
  "上帝在造人时忘了安装退出键，所以我们只能被动地运行到系统崩溃。",
  "所谓的成功，不过是换了一种更高级的方式虚度光阴。",
  "夕阳之所以美，是因为它正在无可挽回地走向沉沦。",
  "每个人都是一座孤岛，只是有些岛上有信号，有些岛上只有荒草。",
  "我们拼命想留下痕迹，却忘了大地本身就是一块巨大的橡皮擦。",
  "在这个剧场里，观众和演员都在等待一场永远不会发生的奇迹。",
  "记忆是过时的报纸，风一吹，就散成了满地的无奈。",
  "别去翻动那些陈旧的回忆，那里面除了灰尘，只有已经风干的尴尬。",
  "所谓的永恒，其实只是某种痛苦持续的时间稍微久了一点点。",
  "如果你觉得世界在旋转，那可能是你站得太久，或者想得太少。",
  "春天不是希望，它是自然界一次规模庞大的周而复始的例行公事。",
  "我们都是被困在皮囊里的困兽，偶尔嘶吼，大多时候在沉默中腐烂。",
  "生活是一场默剧，我们却都在费力地练习台词。",
  "风没有方向，是旗帜在自作多情地摇摆。",
  "如果孤独是一种病，那热闹就是一种慢性毒药。",
  "所谓的英雄主义，就是看清了生活的真相，然后选择优雅地躺平。",
  "海水是咸的，因为那是世界历史上所有遗憾凝聚成的泪滴。",
  "文字是尸体的标本，它们记录了思想死掉那一刻的姿态。",
  "在这个算法主宰的时代，我们的灵魂正变得越来越像一段冗余代码。",
  "梦境是上帝给卑微者的唯一补偿，可惜醒来后还要按原价赔付。",
  "尘土终将归于尘土，但在那之前，它总想弄脏点什么。",
  "所谓的意义，不过是我们在漫长的虚无中随手涂鸦的注解。"
];

export const TerminalLog: React.FC<Props> = ({ logs, stats }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // 随机 Tip 状态
  const [currentTip, setCurrentTip] = useState(LITERARY_TIPS[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTip(LITERARY_TIPS[Math.floor(Math.random() * LITERARY_TIPS.length)]);
    }, 10000); // 10秒换一次，留给用户阅读文艺感的时间
    return () => clearInterval(timer);
  }, []);

  // 智能日志分组逻辑
  const logGroups = useMemo(() => {
    const groups: LogGroup[] = [];
    let currentGroup: LogGroup | null = null;

    logs.forEach(log => {
      const isHeader = log.type === 'system' || 
                       log.message.includes('启动') || 
                       log.message.includes('开始') || 
                       log.message.startsWith('第');

      if (isHeader) {
         if (currentGroup) currentGroup.isCompleted = true;
         currentGroup = { 
           id: `group-${log.id}`,
           stepName: log.message.replace('启动', '').replace('...', '').trim(), 
           entries: [log], 
           isCompleted: false,
           type: log.message.includes('审计') ? 'audit' : 'process'
         };
         groups.push(currentGroup);
      } else if (currentGroup) {
         currentGroup.entries.push(log);
      } else {
         groups.push({ 
           id: 'init-group', 
           stepName: '初始化系统', 
           entries: [log], 
           isCompleted: false, 
           type: 'system' 
         });
      }
    });
    return groups;
  }, [logs]);

  useEffect(() => {
    if (logGroups.length > 0) {
      const lastGroup = logGroups[logGroups.length - 1];
      setExpandedGroups(prev => {
        const next = { ...prev };
        logGroups.slice(0, -1).forEach(g => {
           if (next[g.id] === undefined) next[g.id] = false;
        });
        next[lastGroup.id] = true;
        return next;
      });
    }
  }, [logGroups.length]);

  const handleScroll = () => {
    if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, shouldAutoScroll]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`flex flex-col h-full font-mono text-xs relative group transition-colors duration-500 ${isDark ? 'bg-[#0a0a0c]' : 'bg-white'}`}>
      
      {/* 头部状态条 */}
      <div className={`px-5 py-4 flex items-center justify-between z-10 border-b backdrop-blur-xl ${isDark ? 'border-white/5 bg-black/60' : 'border-black/5 bg-white/60'}`}>
        <div className="flex items-center gap-3">
          <span className={`font-black tracking-[0.2em] text-[10px] uppercase ${isDark ? 'text-zinc-200' : 'text-gray-400'}`}>智慧写作执行记录</span>
        </div>
        
        {/* 文艺冷幽默 Tips 区域 - 🤡 在说一样 */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-1000 max-w-[60%]">
           <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-1000 ${
             isDark ? 'bg-zinc-900/50 border-white/5' : 'bg-gray-100/50 border-black/5'
           }`}>
               <span className="text-sm shrink-0 grayscale hover:grayscale-0 transition-all duration-500 select-none">🤡</span>
               <span className={`text-[10px] font-medium leading-normal italic transition-all duration-700 ${
                 isDark ? 'text-zinc-300' : 'text-gray-500'
               } truncate md:whitespace-normal`}>
                 {currentTip}
               </span>
           </div>
        </div>
      </div>

      {/* 日志渲染区 */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar space-y-4">
        {logGroups.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center opacity-30 select-none animate-pulse">
             <div className={`w-16 h-16 border-2 border-dashed rounded-3xl animate-spin duration-[15s] mb-4 ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}></div>
             <p className={`text-[10px] tracking-[0.4em] font-black uppercase ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>待机中 - 等待任务指令</p>
           </div>
        )}
        
        {logGroups.map((group, gIdx) => (
           <div key={group.id} className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
              
              <button 
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-500 ${
                  expandedGroups[group.id] 
                    ? (isDark ? 'bg-zinc-900 border-white/10 shadow-lg' : 'bg-gray-50 border-black/5 shadow-sm') 
                    : (isDark ? 'bg-zinc-900/40 border-transparent hover:bg-zinc-900/60' : 'bg-transparent border-transparent hover:bg-gray-50/50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-transform duration-500 ease-out ${expandedGroups[group.id] ? 'rotate-90' : ''}`}>
                    <svg className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-black tracking-wide uppercase ${
                      expandedGroups[group.id] ? (isDark ? 'text-zinc-100' : 'text-gray-900') : (isDark ? 'text-zinc-200' : 'text-gray-400')
                    }`}>
                      {group.stepName}
                    </span>
                  </div>
                </div>
                
                {!expandedGroups[group.id] && (
                   <span className={`text-[9px] font-mono flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>
                     <span className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>{group.entries.length} 条记录</span>
                     <span>{group.entries[group.entries.length-1].timestamp}</span>
                   </span>
                )}
              </button>

              {expandedGroups[group.id] && (
                 <div className={`pl-6 space-y-2.5 border-l ml-4 animate-in slide-in-from-top-3 duration-500 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {group.entries.map((log, lIdx) => (
                       <div key={log.id} className="flex gap-4 group/line items-start">
                          <span className={`shrink-0 w-12 text-[9px] tabular-nums py-0.5 opacity-50 group-hover/line:opacity-100 transition-opacity ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>
                             {log.timestamp.split(':').slice(1).join(':')}
                          </span>
                          <div className="flex-1 leading-relaxed flex items-center gap-2 flex-wrap">
                             <span className={`
                                ${log.type === 'system' ? (isDark ? 'text-blue-400 font-black' : 'text-blue-600 font-black') : 
                                  log.type === 'success' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 
                                  log.type === 'error' ? 'text-rose-500 font-black' : 
                                  log.type === 'warning' ? (isDark ? 'text-amber-400' : 'text-amber-600') : 
                                  (isDark ? 'text-zinc-200' : 'text-gray-700')}
                             `}>
                               {log.message}
                             </span>
                             
                             {/* Preview Button for Images */}
                             {log.metadata?.imageUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(log.metadata!.imageUrl!);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-[9px] border border-blue-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                   预览
                                </button>
                             )}

                             {lIdx === group.entries.length - 1 && gIdx === logGroups.length - 1 && !group.isCompleted && (
                                <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-2 animate-pulse align-middle shadow-[0_0_8px_#3b82f6]"></span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        ))}
        <div ref={bottomRef} className="h-10" />
      </div>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="relative max-w-full max-h-full flex flex-col items-center">
              <img src={previewImage} className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border border-white/10" alt="Preview" />
              <button 
                 onClick={() => setPreviewImage(null)}
                 className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-xs"
              >
                关闭预览
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
