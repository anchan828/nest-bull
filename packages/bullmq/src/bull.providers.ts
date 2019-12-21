import { Provider, Type } from "@nestjs/common";
import { ClassProvider, FactoryProvider } from "@nestjs/common/interfaces";
import { Processor, Queue, QueueBaseOptions, QueueEvents, Worker } from "bullmq";
import { BullService, getBullQueueToken } from ".";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { createQueueEventsMock, createQueueMock, createWorkerMock } from "./bull.mock";
import { mergeQueueBaseOptions } from "./bull.utils";
import { BullModuleAsyncOptions, BullModuleOptions, BullModuleOptionsFactory, BullQueueOptions } from "./interfaces";

export function createQueue(queueName: string, options: QueueBaseOptions, mock?: boolean): Queue {
  return mock ? createQueueMock(queueName, options) : new Queue(queueName, options);
}

export function createWorker(
  queueName: string,
  processor: Processor,
  options: QueueBaseOptions,
  mock?: boolean,
): Worker {
  return mock ? createWorkerMock(queueName) : new Worker(queueName, processor, options);
}
export function createQueueEvents(queueName: string, options: QueueBaseOptions, mock?: boolean): QueueEvents {
  return mock ? createQueueEventsMock(queueName) : new QueueEvents(queueName, options);
}

export function createAsyncOptionsProvider(options: BullModuleAsyncOptions): FactoryProvider {
  if (options.useFactory) {
    return {
      inject: options.inject || [],
      provide: BULL_MODULE_OPTIONS,
      useFactory: options.useFactory,
    };
  }
  return {
    inject: [options.useClass || options.useExisting].filter(
      (x): x is Type<BullModuleOptionsFactory> => x !== undefined,
    ),
    provide: BULL_MODULE_OPTIONS,
    useFactory: async (optionsFactory: BullModuleOptionsFactory): Promise<BullModuleOptions> =>
      await optionsFactory.createBullModuleOptions(),
  };
}

export function createAsyncProviders(options: BullModuleAsyncOptions): Provider[] {
  const asyncOptionsProvider = createAsyncOptionsProvider(options);
  if (options.useExisting || options.useFactory) {
    return [asyncOptionsProvider];
  }
  return [
    asyncOptionsProvider,
    {
      provide: options.useClass,
      useClass: options.useClass,
    } as ClassProvider,
  ];
}

export function createQueueProviders(queues: (string | BullQueueOptions)[]): Provider[] {
  return queues.map(queue => {
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
}
