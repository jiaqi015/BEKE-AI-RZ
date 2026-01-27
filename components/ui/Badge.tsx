
import React from 'react';

interface Props {
  status: 'idle' | 'running' | 'success' | 'warn' | 'error';
  label?: string;
}

export const Badge: React.FC<Props> = ({ status, label }) => {
  const styles = {
    idle: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
    running: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${styles[status]}`}>
      {label || status}
    </span>
  );
};
