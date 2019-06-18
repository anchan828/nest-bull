import { Injectable } from '@nestjs/common';
import { BullName, BullQueue } from '../bull.interfaces';
import { getBullQueueToken } from '../bull.utils';

@Injectable()
export class BullService {
  constructor(public isAsync: boolean = false) {}
  private queues: Map<BullName, BullQueue> = new Map<BullName, BullQueue>();

  public getQueue(token: BullName): BullQueue | undefined {
    return this.queues.get(getBullQueueToken(token));
  }

  public addQueue(token: BullName, queue: BullQueue): void {
    this.queues.set(token, queue);
  }

  public async closeAll(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
  }

  public async isReady(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.isReady();
    }
  }
}
