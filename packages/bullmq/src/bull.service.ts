import { Injectable } from "@nestjs/common";
import { Queue, QueueEvents, Worker } from "bullmq";
@Injectable()
export class BullService {
  public queues: Record<string, Queue> = {};

  public workers: Record<string, Worker> = {};

  public queueEvents: Record<string, QueueEvents> = {};

  public async waitUntilReady(): Promise<void> {
    for (const instance of [
      ...Object.values(this.queues),
      ...Object.values(this.workers),
      ...Object.values(this.queueEvents),
    ]) {
      await instance.waitUntilReady();
    }
  }
}
