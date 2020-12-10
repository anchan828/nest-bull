import { Provider, Type } from "@nestjs/common";
import { ClassProvider, FactoryProvider } from "@nestjs/common/interfaces";
import { Processor, Queue, QueueBase, QueueBaseOptions, QueueEvents, QueueScheduler, Worker } from "bullmq";
import { BullService, getBullQueueToken } from ".";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { createQueueEventsMock, createQueueMock, createQueueSchedulerMock, createWorkerMock } from "./bull.mock";
import { mergeQueueBaseOptions } from "./bull.utils";
import { BullModuleAsyncOptions, BullModuleOptions, BullModuleOptionsFactory, BullQueueOptions } from "./interfaces";

async function createQueueBase<T extends QueueBase>(
  createMockFunction: () => T,
  createFunction: () => T,
  mock: boolean,
): Promise<T> {
  if (mock) {
    return createMockFunction();
  }
  const queueBase = createFunction();
  await queueBase.waitUntilReady();
  return queueBase;
}

export async function createQueue(queueName: string, options: QueueBaseOptions, mock = false): Promise<Queue> {
  return createQueueBase(
    () => createQueueMock(queueName, options),
    () => new Queue(queueName, options),
    mock,
  );
}

export async function createQueueScheduler(
  queueName: string,
  options: QueueBaseOptions,
  mock = false,
): Promise<QueueScheduler> {
  return createQueueBase(
    () => createQueueSchedulerMock(queueName, options),
    () => new QueueScheduler(queueName, options),
    mock,
  );
}

export async function createWorker(
  queueName: string,
  processor: Processor,
  options: QueueBaseOptions,
  mock = false,
): Promise<Worker> {
  return createQueueBase(
    () => createWorkerMock(queueName),
    () => new Worker(queueName, processor, options),
    mock,
  );
}
export async function createQueueEvents(
  queueName: string,
  options: QueueBaseOptions,
  mock = false,
): Promise<QueueEvents> {
  return createQueueBase(
    () => createQueueEventsMock(queueName),
    () => new QueueEvents(queueName, options),
    mock,
  );
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
    useFactory: async (optionsFactory?: BullModuleOptionsFactory): Promise<BullModuleOptions> => {
      if (!optionsFactory) {
        return {};
      }
      return optionsFactory.createBullModuleOptions();
    },
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
  return queues.map((queue) => {
    const queueName = typeof queue === "string" ? queue : queue.queueName;
    const queueOptions = typeof queue === "string" ? {} : queue.options || {};
    return {
      provide: getBullQueueToken(queueName),
      useFactory: async (options: BullModuleOptions, service: BullService): Promise<Queue> => {
        const mergedOptions = mergeQueueBaseOptions(options?.options, queueOptions);
        const queueSchedulerInstance = await createQueueScheduler(queueName, mergedOptions, options.mock);
        const queueInstance = await createQueue(queueName, mergedOptions, options.mock);
        service.queueSchedulers[queueName] = queueSchedulerInstance;
        service.queues[queueName] = queueInstance;
        return queueInstance;
      },
      inject: [BULL_MODULE_OPTIONS, BullService],
    } as Provider;
  });
}
