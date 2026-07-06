/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class EventBus {
  private listeners: Record<string, ((data: any) => void | Promise<void>)[]> = {};

  public async publish(event: string, data: any): Promise<void> {
    const list = this.listeners[event] || [];
    for (const callback of list) {
      try {
        await callback(data);
      } catch (err) {
        console.error(`[EventBus] Error executing listener for event ${event}:`, err);
      }
    }
  }

  public subscribe(event: string, callback: (data: any) => void | Promise<void>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
}
