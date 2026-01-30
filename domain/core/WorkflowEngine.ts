
import { PipelineContext, IWorkflowTask } from '../../types';
import { logStream } from './LogStream';

/**
 * WorkflowEngine (Domain/Application Layer)
 * Generic Task Runner that orchestrates Agents and Skills.
 * It is unaware of the specific "Soft Copyright" logic, only executing Tasks.
 */
export class WorkflowEngine {
  
  /**
   * Executes a sequence of tasks linearly.
   * Future upgrade: Support DAG (Directed Acyclic Graph) for parallel execution.
   */
  async runSequence(
    tasks: IWorkflowTask[], 
    context: PipelineContext
  ): Promise<void> {
    
    for (const task of tasks) {
      const startTime = Date.now();
      
      // 1. Log Start
      logStream.emit(
        `[${task.agent.role}] ${task.agent.name} is executing: ${task.name}...`, 
        'info', 
        task.agent.role
      );

      try {
        // 2. Execute Task (Mutation of Context happens inside)
        await task.run(context);
        
        // 3. Log Success
        const duration = Date.now() - startTime;
        logStream.emit(
          `Task "${task.name}" completed in ${(duration/1000).toFixed(1)}s`, 
          'success', 
          task.agent.role
        );

      } catch (error: any) {
        // 4. Handle Error (Stop the line)
        logStream.emit(
          `Task "${task.name}" FAILED: ${error.message}`, 
          'error', 
          task.agent.role
        );
        console.error(`Workflow Error at [${task.name}]:`, error);
        throw error; // Propagate up to PipelineEngine to update UI state
      }
    }
  }
}
