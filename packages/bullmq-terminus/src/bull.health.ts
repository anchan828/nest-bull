import { BullQueue, BullQueueEvents, BullService, BullWorker, BullWorkerProcess } from "@anchan828/nest-bullmq";
import { Injectable } from "@nestjs/common";
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from "@nestjs/terminus";
import { QUEUE_NAME } from "./constants";

@BullQueue({ queueName: QUEUE_NAME, options: { defaultJobOptions: { removeOnComplete: true } } })
export class BullHealthCheckQueue {}

@BullWorker({ queueName: QUEUE_NAME })
export class BullHealthCheckWorker {
  @BullWorkerProcess()
  async process(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

@BullQueueEvents({ queueName: QUEUE_NAME })
export class BullHealthCheckQueueEvents {}

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
  constructor(private readonly service: BullService) {
    super();
  }

  async isHealthy(key = "bull"): Promise<HealthIndicatorResult> {
    try {
      const job = await this.service.queues[QUEUE_NAME].add("Health check", {});
      await job.waitUntilFinished(this.service.queueEvents[QUEUE_NAME]);
    } catch (e: any) {
      throw new HealthCheckError("BullHealthCheck failed", this.getStatus(key, false, { message: e.message }));
    }
    return this.getStatus(key, true);
  }
}
