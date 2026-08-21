export type RuntimeAgentStatus = 'IDLE' | 'ACTIVE';

export interface OrchestratorAgentDescriptor {
  id: string;
  name: string;
  role: string;
  orchestratorId: string;
  model: string;
}

export interface OrchestratorAgentRuntimeView extends OrchestratorAgentDescriptor {
  status: RuntimeAgentStatus;
  activeTask: string;
  queriesCount: number;
  performance: 'N/A';
}

/**
 * Read-only operational projection owned by the existing orchestrator composition.
 *
 * This is deliberately NOT a second agent registry authority: an agent becomes visible only when
 * an actually constructed orchestrator registers the descriptor of the agent instance it owns.
 * Repository/ADR governance still controls which agent implementations may enter production.
 */
export class OrchestratorAgentRuntimeProjection {
  private readonly agents = new Map<string, OrchestratorAgentRuntimeView>();

  registerMany(descriptors: readonly OrchestratorAgentDescriptor[]): void {
    for (const descriptor of descriptors) {
      const existing = this.agents.get(descriptor.id);
      if (existing) {
        const conflicts = existing.name !== descriptor.name
          || existing.role !== descriptor.role
          || existing.orchestratorId !== descriptor.orchestratorId
          || existing.model !== descriptor.model;
        if (conflicts) {
          throw new Error(
            `[OrchestratorAgentRuntimeProjection] Conflicting descriptor for agent '${descriptor.id}'.`,
          );
        }
        continue;
      }

      this.agents.set(descriptor.id, {
        ...descriptor,
        status: 'IDLE',
        activeTask: 'Keine aktive Aufgabe',
        queriesCount: 0,
        performance: 'N/A',
      });
    }
  }

  updateActivity(id: string, activeTask: string, isStarting: boolean): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;

    if (isStarting) {
      agent.status = 'ACTIVE';
      agent.activeTask = activeTask;
      agent.queriesCount += 1;
    } else {
      agent.status = 'IDLE';
      agent.activeTask = 'Keine aktive Aufgabe';
    }
    return true;
  }

  list(): OrchestratorAgentRuntimeView[] {
    return [...this.agents.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((agent) => ({ ...agent }));
  }

  countForOrchestrator(orchestratorId: string): number {
    return [...this.agents.values()].filter((agent) => agent.orchestratorId === orchestratorId).length;
  }
}

export const orchestratorAgentRuntimeProjection = new OrchestratorAgentRuntimeProjection();
