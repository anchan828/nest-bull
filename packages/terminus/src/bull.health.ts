import {
  BullQueue,
  BullQueueInject,
  BullQueueProcess,
} from '@anchan828/nest-bull';
import { HealthCheckError } from '@godaddy/terminus';
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Job, Queue } from 'bull';
import { QUEUE_NAME } from './constants';

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
  async process(job: Job): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
  constructor(@BullQueueInject(QUEUE_NAME) private readonly queue: Queue) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      const job = await this.queue.add({});
      console.log(await job.finished());
      await job.finished();
    } catch (e) {
      throw new HealthCheckError(
        'BullHealthCheck failed',
        this.getStatus('bull', false, { message: e.message }),
      );
    }
    return this.getStatus('bull', true);
  }
}
