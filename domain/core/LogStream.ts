
import { LogEntry, AgentRole } from '../../types';

type LogListener = (log: LogEntry) => void;

/**
 * LogStream (Infrastructure Layer)
 * A lightweight Event Bus for high-frequency logs to avoid React Render Thrashing.
 */
class LogStreamService {
  private listeners: LogListener[] = [];

  subscribe(listener: LogListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(message: string, type: LogEntry['type'] = 'info', role?: AgentRole, metadata?: LogEntry['metadata']) {
    const entry: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
      role,
      metadata
    };
    
    this.listeners.forEach(l => l(entry));
    return entry;
  }
}

export const logStream = new LogStreamService();
