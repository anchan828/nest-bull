import { DynamicModule, Global, Inject, Module } from "@nestjs/common";
import { OnModuleInit } from "@nestjs/common/interfaces";
import { DiscoveryModule } from "@nestjs/core";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { BullExplorerService } from "./bull.explorer.service";
import {
  createAsyncProviders,
  createQueue,
  createQueueEvents,
  createQueueScheduler,
  createWorker,
} from "./bull.providers";
import { BullService } from "./bull.service";
import { mergeQueueBaseOptions } from "./bull.utils";
import { BullModuleAsyncOptions, BullModuleOptions } from "./interfaces";

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [MetadataScanner, BullExplorerService],
})
export class BullCoreModule implements OnModuleInit {
  constructor(
    @Inject(BULL_MODULE_OPTIONS)
    private readonly options: BullModuleOptions,
    private readonly explorer: BullExplorerService,

    private readonly service: BullService,
  ) {}

  async onModuleInit(): Promise<void> {
    const { workers, queueEvents, queues } = this.explorer.explore();
    for (const queue of queues) {
      const queueOptions = mergeQueueBaseOptions(this.options?.options, queue.options.options);
      const queueSchedulerInstance = await createQueueScheduler(
        queue.options.queueName,
        queueOptions,
        this.options.mock,
      );
      const queueInstance = await createQueue(queue.options.queueName, queueOptions, this.options.mock);

      for (const event of queue.events) {
        queueInstance.on(event.type, event.processor);
      }

      this.service.queueSchedulers[queue.options.queueName] = queueSchedulerInstance;
      this.service.queues[queue.options.queueName] = queueInstance;
    }

    for (const worker of workers) {
      for (const workerProcessor of worker.processors) {
        const workerInstance = await createWorker(
          worker.options.queueName,
          workerProcessor.processor,
          mergeQueueBaseOptions(this.options?.options, worker?.options?.options, workerProcessor.options),
          this.options.mock,
        );

        for (const event of worker.events) {
          workerInstance.on(event.type, event.processor);
        }

        this.service.workers[worker.options.queueName] = workerInstance;
      }
    }
    for (const queueEvent of queueEvents) {
      const queueEventInstance = await createQueueEvents(
        queueEvent.options.queueName,
        mergeQueueBaseOptions(this.options?.options, queueEvent.options.options),
        this.options.mock,
      );

      for (const event of queueEvent.events) {
        queueEventInstance.on(event.type, event.processor);
      }

      this.service.queueEvents[queueEvent.options.queueName] = queueEventInstance;
    }
  }

  public static forRoot(options: BullModuleOptions): DynamicModule {
    const providers = [{ provide: BULL_MODULE_OPTIONS, useValue: options }, BullService];
    return {
      module: BullCoreModule,
      providers,
      exports: providers,
    };
  }

  public static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
    const providers = [...createAsyncProviders(options), BullService];
    return {
      module: BullCoreModule,
      imports: [...(options.imports || [])],
      providers,
      exports: providers,
    };
  }
}
