import { BullQueue, BullQueueInject, BullQueueProcess } from "@anchan828/nest-bull";
import { Injectable } from "@nestjs/common";
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from "@nestjs/terminus";
import { Queue } from "bull";
import { QUEUE_NAME } from "./constants";

@BullQueue({
  name: QUEUE_NAME,
  options: {
    defaultJobOptions: {
      priority: 1,
    },
  },
  extra: {
    defaultJobOptions: {
      setTTLOnComplete: 10,
      setTTLOnFail: 10,
    },
  },
})
export class BullHealthCheckQueue {
  @BullQueueProcess()
  async process(): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
  constructor(@BullQueueInject(QUEUE_NAME) private readonly queue: Queue) {
    super();
  }

  async isHealthy(key = "bull"): Promise<HealthIndicatorResult> {
    try {
      const job = await this.queue.add({});
      await job.finished();
    } catch (e: any) {
      throw new HealthCheckError("BullHealthCheck failed", this.getStatus(key, false, { message: e.message }));
    }
    return this.getStatus(key, true);
  }
}
