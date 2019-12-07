import { DynamicModule, Global, Inject, Module, Provider } from "@nestjs/common";
import { ClassProvider, FactoryProvider, OnModuleInit } from "@nestjs/common/interfaces";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { Queue, QueueEvents, Worker } from "bullmq";
import * as deepmerge from "deepmerge";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { BullExplorerService } from "./bull.explorer.service";
import { BullService } from "./bull.service";
import { getBullQueueToken } from "./bull.utils";
import { BullModuleAsyncOptions, BullModuleOptions, BullModuleOptionsFactory } from "./interfaces";
import { BullQueueOptions } from "./interfaces/bull-queue.interface";

@Global()
@Module({
  providers: [MetadataScanner, BullExplorerService],
})
export class BullCoreModule implements OnModuleInit {
  constructor(
    @Inject(BULL_MODULE_OPTIONS)
    private readonly options: BullModuleOptions,
    private readonly explorer: BullExplorerService,

    private readonly service: BullService,
  ) {}

  onModuleInit(): void {
    const { workers, queueEvents, queues } = this.explorer.explore();
    for (const queue of queues) {
      const queueInstance = new Queue(
        queue.options.queueName,
        deepmerge(this.options || {}, queue.options.options || {}),
      );

      for (const event of queue.events) {
        queueInstance.on(event.type, event.processor);
      }

      this.service.queues[queue.options.queueName] = queueInstance;
    }

    for (const worker of workers) {
      for (const workerProcessor of worker.processors) {
        const workerInstance = new Worker(
          worker.options.queueName,
          workerProcessor.processor,
          deepmerge.all([
            { connection: this.options?.options?.connection },
            worker.options.options || {},
            workerProcessor.options || {},
          ]),
        );

        for (const event of worker.events) {
          workerInstance.on(event.type, event.processor);
        }

        this.service.workers[worker.options.queueName] = workerInstance;
      }
    }
    for (const queueEvent of queueEvents) {
      const queueEventInstance = new QueueEvents(
        queueEvent.options.queueName,
        deepmerge(this.options || {}, queueEvent.options.options || {}),
      );

      for (const event of queueEvent.events) {
        queueEventInstance.on(event.type, event.processor);
      }

      this.service.queueEvents[queueEvent.options.queueName] = queueEventInstance;
    }
  }

  public static forRoot(options: BullModuleOptions): DynamicModule {
    const optionProvider = {
      provide: BULL_MODULE_OPTIONS,
      useValue: options,
    };
    return {
      module: BullCoreModule,
      providers: [optionProvider, BullService],
      exports: [optionProvider, BullService],
    };
  }

  public static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: BullCoreModule,
      imports: [...(options.imports || [])],
      providers: [...asyncProviders, BullService],
    };
  }

  public static forQueue(queues: (string | BullQueueOptions)[]): DynamicModule {
    const queueProviders: Provider[] = queues.map(queue => {
      const queueName = typeof queue === "string" ? queue : queue.queueName;
      const queueOptions = typeof queue === "string" ? {} : queue.options || {};
      return {
        provide: getBullQueueToken(queueName),
        useFactory: (options: BullModuleOptions, service: BullService): Queue => {
          const queueInstance = new Queue(queueName, deepmerge(options.options || {}, queueOptions));
          service.queues[queueName] = queueInstance;
          return queueInstance;
        },
        inject: [BULL_MODULE_OPTIONS, BullService],
      } as Provider;
    });
    return {
      module: BullCoreModule,
      providers: queueProviders,
      exports: queueProviders,
    };
  }

  private static createAsyncProviders(options: BullModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
        inject: [options.inject || []],
      } as ClassProvider,
    ];
  }

  private static createAsyncOptionsProvider(options: BullModuleAsyncOptions): FactoryProvider {
    if (options.useFactory) {
      return {
        provide: BULL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: BULL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: BullModuleOptionsFactory): Promise<BullModuleOptions> =>
        await optionsFactory.createBullModuleOptions(),
      inject: options.useClass ? [options.useClass] : [],
    };
  }
}
