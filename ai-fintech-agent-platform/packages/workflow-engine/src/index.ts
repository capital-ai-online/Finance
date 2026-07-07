/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkflowTask, WorkflowDAG } from "@fintech-platform/shared-types";
import { EventBus } from "@fintech-platform/event-bus";

/**
 * Enterprise Directed Acyclic Graph (DAG) Workflow Execution Engine
 * Supports deterministic multi-agent parallel execution, automated retries, and compensation rollbacks.
 */
export class WorkflowEngine {
  constructor(private eventBus: EventBus) {}

  /**
   * Generates a brand new Workflow DAG model
   */
  public createDAG(correlationId: string): WorkflowDAG {
    return {
      id: `dag_${Math.random().toString(36).substring(2, 11)}`,
      correlationId,
      tasks: new Map<string, WorkflowTask>(),
      status: "PENDING",
      compensationTasks: []
    };
  }

  /**
   * Adds a task node to the DAG
   */
  public addTask(dag: WorkflowDAG, task: Omit<WorkflowTask, "status" | "retriesRemaining"> & { retries?: number }): void {
    const fullTask: WorkflowTask = {
      ...task,
      status: "PENDING",
      retriesRemaining: task.retries ?? 3
    };
    dag.tasks.set(task.id, fullTask);
  }

  /**
   * Adds a transactional compensation (rollback) step
   */
  public registerCompensation(dag: WorkflowDAG, rollback: () => Promise<void>): void {
    dag.compensationTasks.push(rollback);
  }

  /**
   * Executes the DAG according to dependent task topologies with retry and rollback
   */
  public async execute(dag: WorkflowDAG, executorMap: Record<string, (payload: any) => Promise<any>>): Promise<void> {
    dag.status = "RUNNING";
    await this.eventBus.publish("workflow.dag.started", { dagId: dag.id }, dag.correlationId, "WorkflowEngine");

    try {
      while (this.hasUnresolvedTasks(dag)) {
        const executableTasks = this.getReadyTasks(dag);

        if (executableTasks.length === 0 && this.hasRunningOrPendingTasks(dag)) {
          throw new Error(`[WorkflowEngine Deadlock] Cyclic dependency detected in DAG "${dag.id}".`);
        }

        // Execute ready tasks in parallel
        await Promise.all(
          executableTasks.map(async (task) => {
            task.status = "RUNNING";
            await this.eventBus.publish(`workflow.task.${task.id}.started`, { agent: task.agentName }, dag.correlationId, "WorkflowEngine");

            let attempts = 0;
            const originalRetries = task.retriesRemaining;

            while (task.status === "RUNNING") {
              try {
                const handler = executorMap[task.agentName];
                if (!handler) {
                  throw new Error(`No executor registered for agent "${task.agentName}"`);
                }

                const result = await handler(task.payload);
                task.status = "COMPLETED";
                task.result = result;

                await this.eventBus.publish(`workflow.task.${task.id}.completed`, { result }, dag.correlationId, "WorkflowEngine");
              } catch (err: any) {
                attempts++;
                task.retriesRemaining--;

                console.warn(`[WorkflowEngine] Task "${task.id}" failed (Attempt ${attempts}/${originalRetries + 1}):`, err.message);

                if (task.retriesRemaining < 0) {
                  task.status = "FAILED";
                  task.error = err.message || "Unknown error";
                  await this.eventBus.publish(`workflow.task.${task.id}.failed`, { error: task.error }, dag.correlationId, "WorkflowEngine");
                  throw err; // Propagate failure to trigger rollback
                } else {
                  await this.eventBus.publish(`workflow.task.${task.id}.retrying`, { attempt: attempts, error: err.message }, dag.correlationId, "WorkflowEngine");
                  // Exponential backoff
                  await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 100));
                }
              }
            }
          })
        );
      }

      dag.status = "COMPLETED";
      await this.eventBus.publish("workflow.dag.completed", { dagId: dag.id }, dag.correlationId, "WorkflowEngine");
    } catch (err: any) {
      dag.status = "FAILED";
      await this.eventBus.publish("workflow.dag.failed", { dagId: dag.id, error: err.message }, dag.correlationId, "WorkflowEngine");
      await this.rollback(dag);
      throw err;
    }
  }

  /**
   * Executes transactional compensation rollback steps in reverse order
   */
  private async rollback(dag: WorkflowDAG): Promise<void> {
    await this.eventBus.publish("workflow.compensation.initiated", { dagId: dag.id }, dag.correlationId, "WorkflowEngine");
    console.warn(`[WorkflowEngine] FAILURE ENCOUNTERED! Initiating rollback for DAG "${dag.id}"...`);

    const rollbacks = [...dag.compensationTasks].reverse();
    for (const compensation of rollbacks) {
      try {
        await compensation();
      } catch (err: any) {
        console.error(`[WorkflowEngine Critical] Compensation step failed:`, err.message || err);
        await this.eventBus.publish("workflow.compensation.step.failed", { error: err.message }, dag.correlationId, "WorkflowEngine");
      }
    }

    await this.eventBus.publish("workflow.compensation.completed", { dagId: dag.id }, dag.correlationId, "WorkflowEngine");
  }

  private hasUnresolvedTasks(dag: WorkflowDAG): boolean {
    return Array.from(dag.tasks.values()).some((t) => t.status !== "COMPLETED" && t.status !== "FAILED");
  }

  private hasRunningOrPendingTasks(dag: WorkflowDAG): boolean {
    return Array.from(dag.tasks.values()).some((t) => t.status === "RUNNING" || t.status === "PENDING");
  }

  private getReadyTasks(dag: WorkflowDAG): WorkflowTask[] {
    const list: WorkflowTask[] = [];
    for (const task of dag.tasks.values()) {
      if (task.status === "PENDING") {
        const dependenciesMet = task.dependsOn.every((depId) => {
          const dep = dag.tasks.get(depId);
          return dep && dep.status === "COMPLETED";
        });
        if (dependenciesMet) {
          list.push(task);
        }
      }
    }
    return list;
  }
}
