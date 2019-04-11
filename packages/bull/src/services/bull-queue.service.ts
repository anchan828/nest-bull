import { flatten, Logger } from '@nestjs/common';
import { ValueProvider } from '@nestjs/common/interfaces';
import * as Bull from 'bull';
import * as deepmerge from 'deepmerge';
import * as glob from 'fast-glob';
import { BULL_MODULE, BULL_QUEUE_DECORATOR } from '../bull.constants';
import {
  BullJob,
  BullModuleOptions,
  BullQueue,
  BullQueueOptions,
  BullQueueType,
} from '../bull.interfaces';
import { getBullQueueToken } from '../bull.utils';

export class BullQueueService {
  private queues: BullQueue[] = [];
  constructor(private readonly bullModuleOptions: BullModuleOptions) {}
  public createBullQueueProviders(): ValueProvider[] {
    const providers: ValueProvider[] = [];
    if (!Array.isArray(this.bullModuleOptions.queues)) {
      return [];
    }
    for (const queueTarget of this.bullModuleOptions.queues) {
      const targets = this.getBullQueueTargets(queueTarget);
      for (const target of targets) {
        const options = this.getBullQueueOptions(target) as BullQueueOptions;
        const queue = this.createQueue(target, options);
        this.createExtraJobEvents(queue, options);
        Logger.log(`${queue.name} queue initialized`, BULL_MODULE, true);

        providers.push({
          provide: getBullQueueToken(options.name!),
          useValue: queue,
        });
        this.queues.push(queue);
      }
    }
    return providers;
  }
  private async setJobExpire(job: BullJob, expire: number) {
    try {
      const jobKey = `${job.toKey()}${job.id}`;
      const client = job.queue.clients[0];
      await client.expire(jobKey, expire);
    } catch (e) {
      Logger.error(e.message, e.stack, BULL_MODULE, true);
    }
  }
  private createExtraJobEvents(
    queue: BullQueue,
    options: BullQueueOptions,
  ): void {
    if (!(options.extra && options.extra.defaultJobOptions)) {
      return;
    }

    const { setTTLOnComplete, setTTLOnFail } = options.extra.defaultJobOptions;
    if (
      setTTLOnComplete !== undefined &&
      setTTLOnComplete !== null &&
      setTTLOnComplete > -1
    ) {
      queue.on('completed', (job: BullJob) => {
        this.setJobExpire(job, setTTLOnComplete);
      });
    }

    if (
      setTTLOnFail !== undefined &&
      setTTLOnFail !== null &&
      setTTLOnFail > -1
    ) {
      queue.on('failed', (job: BullJob) =>
        this.setJobExpire(job, setTTLOnFail),
      );
    }
  }

  private createQueue(target: any, options: BullQueueOptions): BullQueue {
    return new Bull(String(options.name), options.options) as BullQueue;
  }
  private getBullQueueOptions(target: any): BullQueueOptions {
    const targetOptions = Reflect.getMetadata(
      BULL_QUEUE_DECORATOR,
      target,
    ) as BullQueueOptions;

    return deepmerge.all(
      [
        {
          options: this.bullModuleOptions.options,
          extra: this.bullModuleOptions.extra,
        },
        targetOptions,
      ],
      {},
    ) as BullQueueOptions;
  }
  private getBullQueueTargets(queue: BullQueueType): object[] {
    const targets: object[] = [];
    if (typeof queue === 'function' && this.hasBullQueueDecorator(queue)) {
      targets.push(queue);
    } else if (typeof queue === 'string') {
      const queues = this.loadQueues(queue);

      targets.push(...queues.filter(q => this.hasBullQueueDecorator(q)));
    }
    return targets;
  }

  private hasBullQueueDecorator(target: any): boolean {
    return Reflect.hasMetadata(BULL_QUEUE_DECORATOR, target);
  }

  private loadQueues(filePath: string): any[] {
    return flatten(
      glob
        .sync(filePath)
        .map(entry => require(entry.toString()) as { [name: string]: any })
        .map(x => Object.values(x)),
    );
  }

  public async closeAll(): Promise<void> {
    for (const queue of this.queues) {
      await queue.close();
    }
  }

  public async isReady(): Promise<void> {
    for (const queue of this.queues) {
      await queue.isReady();
    }
  }
}
