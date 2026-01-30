
import { PipelineContext, IWorkflowTask, ISkillCallbacks } from '../../types';
import { logStream } from './LogStream';

/**
 * WorkflowEngine (Domain Core)
 * 职责：负责任务调度、错误捕获、自动重试。它是保证“结果稳定性”的核心组件。
 * 
 * 改进点：
 * 1. 支持任务级重试 (Resilience)
 * 2. 统一日志注入 (Observability)
 * 3. 错误边界隔离 (Safety)
 */
export class WorkflowEngine {
  
  /**
   * 执行线性任务序列
   */
  async runSequence(
    tasks: IWorkflowTask[], 
    context: PipelineContext
  ): Promise<void> {
    
    for (const task of tasks) {
      const startTime = Date.now();
      
      // 构造上下文感知的 Log 回调
      // 这样 Task 内部就不需要直接依赖 logStream，实现了 IoC (控制反转)
      const callbacks: ISkillCallbacks = {
        onLog: (msg, type = 'info') => {
          logStream.emit(msg, type, task.agent.role);
        }
      };

      // 1. Log Start
      logStream.emit(
        `[${task.agent.name}] 启动${task.name}...`, 
        'system', 
        task.agent.role
      );

      try {
        // 2. Execute with Retry Logic
        await this.executeWithRetry(task, context, callbacks);
        
        // 3. Log Success
        const duration = Date.now() - startTime;
        logStream.emit(
          `${task.name} 执行完毕 (耗时 ${(duration/1000).toFixed(1)}s)`, 
          'success', 
          task.agent.role
        );

      } catch (error: any) {
        // 4. Handle Error (Stop the line)
        logStream.emit(
          `任务 "${task.name}" 异常中止: ${error.message}`, 
          'error', 
          task.agent.role
        );
        console.error(`Workflow Error at [${task.name}]:`, error);
        throw error; // 抛出错误，暂停流水线，等待用户重试
      }
    }
  }

  /**
   * 内部重试执行器
   */
  private async executeWithRetry(
    task: IWorkflowTask, 
    context: PipelineContext, 
    callbacks: ISkillCallbacks
  ): Promise<void> {
    const maxRetries = task.retryPolicy?.maxRetries ?? 0;
    let attempts = 0;

    while (true) {
      try {
        await task.run(context, callbacks);
        return; // Success
      } catch (e: any) {
        attempts++;
        if (attempts > maxRetries) {
          throw e; // Exhausted retries
        }
        
        const delay = (task.retryPolicy?.backoffMs ?? 1000) * attempts;
        callbacks.onLog(`执行遇到波动，正在进行第 ${attempts}/${maxRetries} 次自动重试...`, 'warning');
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
