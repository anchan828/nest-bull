/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { flatten, Injectable, Logger } from "@nestjs/common";
import { ValueProvider } from "@nestjs/common/interfaces";
import * as Bull from "bull";
import * as deepmerge from "deepmerge";
import * as glob from "fast-glob";
import { BULL_MODULE, BULL_QUEUE_DECORATOR } from "../bull.constants";
import { BullJob, BullModuleOptions, BullQueue, BullQueueOptions, BullQueueType } from "../bull.interfaces";
import { getBullQueueToken } from "../bull.utils";
import { BullService } from "./bull.service";

@Injectable()
export class BullQueueProviderService {
  private readonly logger = new Logger(BULL_MODULE, true);

  constructor(private readonly bullModuleOptions: BullModuleOptions, private readonly bullService: BullService) {}

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
        this.logger.log(`${queue.name} queue initialized`);
        const token = getBullQueueToken(options.name!);
        providers.push({
          provide: token,
          useValue: queue,
        });
        this.bullService.addQueue(token, queue);
      }
    }
    return providers;
  }

  private async setJobExpire(job: BullJob, expire: number): Promise<void> {
    try {
      const jobKey = `${job.toKey()}${job.id}`;
      const client = job.queue.clients[0];
      await client.expire(jobKey, expire);
    } catch (e) {
      this.logger.error(e.message, e.stack);
    }
  }

  private createExtraJobEvents(queue: BullQueue, options: BullQueueOptions): void {
    if (!(options.extra && options.extra.defaultJobOptions)) {
      return;
    }

    const { setTTLOnComplete, setTTLOnFail } = options.extra.defaultJobOptions;
    if (setTTLOnComplete !== undefined && setTTLOnComplete !== null && setTTLOnComplete > -1) {
      queue.on("completed", (job: BullJob) => {
        this.setJobExpire(job, setTTLOnComplete);
      });
    }

    if (setTTLOnFail !== undefined && setTTLOnFail !== null && setTTLOnFail > -1) {
      queue.on("failed", (job: BullJob) => this.setJobExpire(job, setTTLOnFail));
    }
  }

  private createQueue(target: any, options: BullQueueOptions): BullQueue {
    if (this.bullModuleOptions.mock) {
      return ({
        name: String(options.name),
        add: (args: any) => Promise.resolve(args),
        isReady: () => Promise.resolve(true),
        close: () => Promise.resolve(),
        process: () => Promise.resolve(),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        on: () => {},
      } as any) as BullQueue;
    }

    return new Bull(String(options.name), options.options) as BullQueue;
  }

  private getBullQueueOptions(target: any): BullQueueOptions {
    const targetOptions = Reflect.getMetadata(BULL_QUEUE_DECORATOR, target) as BullQueueOptions;

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
    if (typeof queue === "function" && this.hasBullQueueDecorator(queue)) {
      targets.push(queue);
    } else if (typeof queue === "string") {
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
}
