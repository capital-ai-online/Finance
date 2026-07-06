/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformEvent, EventHandler } from "@fintech-platform/shared-types";

/**
 * Replayable FinTech Event Bus
 * Implements strict naming validation, correlation tracking, and history playback.
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private history: PlatformEvent[] = [];

  // Allowed event namespace prefix rules
  private static readonly VALID_PREFIXES = [
    "agent.",
    "workflow.",
    "risk.",
    "policy.",
    "audit.",
    "execution."
  ];

  /**
   * Publishes an event to the bus and logs it in the immutable history
   */
  public async publish(name: string, payload: any, correlationId?: string, senderId?: string): Promise<PlatformEvent> {
    this.validateEventName(name);

    const event: PlatformEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 11)}`,
      name,
      correlationId: correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`,
      senderId: senderId || "system",
      payload,
      timestamp: new Date().toISOString()
    };

    this.history.push(event);

    // Call handlers matching exact pattern or wildcard
    const matchedHandlers = this.getHandlersForEvent(name);
    for (const handler of matchedHandlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in event handler for ${name}:`, err);
      }
    }

    return event;
  }

  /**
   * Subscribes a handler callback to an event pattern (supports exact match or wildcards like agent.*)
   */
  public subscribe(pattern: string, handler: EventHandler): void {
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, []);
    }
    this.handlers.get(pattern)!.push(handler);
  }

  /**
   * Replays events within a given timeframe or match pattern for audit trace and debugging
   */
  public replay(pattern?: string, sinceTimestamp?: string): PlatformEvent[] {
    return this.history.filter(event => {
      const matchesPattern = !pattern || this.matchesPattern(event.name, pattern);
      const matchesTime = !sinceTimestamp || new Date(event.timestamp) >= new Date(sinceTimestamp);
      return matchesPattern && matchesTime;
    });
  }

  /**
   * Retrieves full immutable event history
   */
  public getHistory(): PlatformEvent[] {
    return [...this.history];
  }

  /**
   * Checks event name compliance with regulatory schemas
   */
  private validateEventName(name: string): void {
    const isValid = EventBus.VALID_PREFIXES.some(prefix => name.startsWith(prefix));
    if (!isValid) {
      throw new Error(
        `[EventBus Compliance Violation] Event name "${name}" does not follow approved FinTech naming guidelines: ` +
        `Must start with one of: ${EventBus.VALID_PREFIXES.join(", ")}`
      );
    }
  }

  /**
   * Resolves list of handlers matching an event name
   */
  private getHandlersForEvent(name: string): EventHandler[] {
    const list: EventHandler[] = [];
    for (const [pattern, handlers] of this.handlers.entries()) {
      if (this.matchesPattern(name, pattern)) {
        list.push(...handlers);
      }
    }
    return list;
  }

  /**
   * Basic pattern matching for routing wildcard events (e.g. "agent.*" matches "agent.planner.started")
   */
  private matchesPattern(eventName: string, pattern: string): boolean {
    if (pattern === "*") return true;
    if (pattern.endsWith(".*")) {
      const prefix = pattern.substring(0, pattern.length - 1);
      return eventName.startsWith(prefix);
    }
    return eventName === pattern;
  }
}
