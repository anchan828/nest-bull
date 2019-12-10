import { DynamicModule, Global, Inject, Module, Provider } from "@nestjs/common";
import { ClassProvider, FactoryProvider, OnModuleInit } from "@nestjs/common/interfaces";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { Processor, Queue, QueueBaseOptions, QueueEvents, QueueEventsOptions, Worker } from "bullmq";
import * as deepmerge from "deepmerge";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { BullExplorerService } from "./bull.explorer.service";
import { BullService } from "./bull.service";
import { getBullQueueToken } from "./bull.utils";
import { BullModuleAsyncOptions, BullModuleOptions, BullModuleOptionsFactory } from "./interfaces";
import { BullQueueOptions } from "./interfaces/bull-queue.interface";
import IORedis = require("ioredis");

function mergeQueueBaseOptions(...options: (QueueBaseOptions | undefined)[]): QueueBaseOptions {
  const opts = options.filter((x): x is QueueBaseOptions => x !== undefined) as QueueEventsOptions[];
  const obj = deepmerge.all<QueueBaseOptions>(opts);

  if (obj?.connection?.options) {
    // IORedis object, but 'instanceof IORedis' returns false.
    // for now, it uses last connection object.
    obj.connection = opts
      .reverse()
      .map(x => x?.connection)
      .find(connection => connection instanceof IORedis);
  }
  return obj;
}

function createJobMock(args: any): any {
  return {
    ...args,
    waitUntilFinished: (): Promise<boolean> => Promise.resolve(true),
    isCompleted: (): Promise<boolean> => Promise.resolve(true),
    isFailed: (): Promise<boolean> => Promise.resolve(true),
    isActive: (): Promise<boolean> => Promise.resolve(true),
    isWaiting: (): Promise<boolean> => Promise.resolve(false),
    getState: (): Promise<string> => Promise.resolve("completed"),
    remove: (): Promise<boolean> => Promise.resolve(true),
  };
}

function createQueue(queueName: string, options: QueueBaseOptions, mock?: boolean): Queue {
  if (mock) {
    return {
      name: queueName,
      opts: options,
      add: (args: any) => Promise.resolve(createJobMock(args)),
      addBulk: (args: any[]) => Promise.all(args.map(x => createJobMock(x))),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      on: () => {},
    } as any;
  }

  return new Queue(queueName, options);
}
function createWorker(queueName: string, processor: Processor, options: QueueBaseOptions, mock?: boolean): Worker {
  if (mock) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      on: () => {},
    } as any;
  }
  return new Worker(queueName, processor, options);
}
function createQueueEvents(queueName: string, options: QueueBaseOptions, mock?: boolean): QueueEvents {
  if (mock) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      on: () => {},
    } as any;
  }
  return new QueueEvents(queueName, options);
}

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
      const queueInstance = createQueue(
        queue.options.queueName,
        mergeQueueBaseOptions(this.options?.options, queue.options.options),
        this.options.mock,
      );

      for (const event of queue.events) {
        queueInstance.on(event.type, event.processor);
      }

      this.service.queues[queue.options.queueName] = queueInstance;
    }

    for (const worker of workers) {
      for (const workerProcessor of worker.processors) {
        const workerInstance = createWorker(
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
      const queueEventInstance = createQueueEvents(
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
      exports: [...asyncProviders, BullService],
    };
  }

  public static forQueue(queues: (string | BullQueueOptions)[]): DynamicModule {
    const queueProviders: Provider[] = queues.map(queue => {
      const queueName = typeof queue === "string" ? queue : queue.queueName;
      const queueOptions = typeof queue === "string" ? {} : queue.options || {};
      return {
        provide: getBullQueueToken(queueName),
        useFactory: (options: BullModuleOptions, service: BullService): Queue => {
          const queueInstance = createQueue(
            queueName,
            mergeQueueBaseOptions(options?.options, queueOptions),
            options.mock,
          );
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
