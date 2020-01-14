import { Injectable } from "@nestjs/common";
import { Queue, QueueEvents, QueueScheduler, Worker } from "bullmq";
@Injectable()
export class BullService {
  public queues: Record<string, Queue> = {};

  public queueSchedulers: Record<string, QueueScheduler> = {};

  public workers: Record<string, Worker> = {};

  public queueEvents: Record<string, QueueEvents> = {};

  public async waitUntilReady(): Promise<void> {
    for (const instance of [
      ...Object.values(this.queues),
      ...Object.values(this.queueSchedulers),
      ...Object.values(this.workers),
      ...Object.values(this.queueEvents),
    ]) {
      await instance.waitUntilReady();
    }
  }
}
