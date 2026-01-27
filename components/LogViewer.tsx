
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const LogViewer: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm h-full overflow-y-auto border border-slate-700">
      <div className="space-y-1">
        {logs.map((log, idx) => (
          <div key={idx} className="flex space-x-2">
            <span className="text-slate-500">[{log.timestamp}]</span>
            <span className={
              log.type === 'success' ? 'text-green-400' :
              log.type === 'error' ? 'text-red-400' :
              log.type === 'warning' ? 'text-amber-400' :
              'text-slate-300'
            }>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-slate-600 italic">Waiting for process to start...</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogViewer;
