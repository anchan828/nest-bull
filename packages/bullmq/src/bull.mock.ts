/* eslint-disable @typescript-eslint/no-empty-function */
import { Queue, QueueBaseOptions, QueueEvents, QueueEventsListener, Worker } from "bullmq";

function createJobMock(...args: any[]): any {
  return {
    ...args,
    waitUntilFinished: (): Promise<boolean> => Promise.resolve(true),
    isCompleted: (): Promise<boolean> => Promise.resolve(true),
    isFailed: (): Promise<boolean> => Promise.resolve(true),
    isActive: (): Promise<boolean> => Promise.resolve(true),
    isWaiting: (): Promise<boolean> => Promise.resolve(false),
    getState: (): Promise<keyof QueueEventsListener> => Promise.resolve("completed"),
    remove: (): Promise<void> => Promise.resolve(),
  };
}
export function createQueueMock(queueName: string, options: QueueBaseOptions): Queue {
  return {
    name: queueName,
    opts: options,
    add: (...args: any[]) => Promise.resolve(createJobMock(...args)),
    addBulk: (args: any[]) => Promise.all(args.map((x) => createJobMock(x))),
    on: () => {},
    waitUntilReady: async () => {},
  } as any;
}

export function createWorkerMock(queueName: string): Worker {
  return {
    name: queueName,
    on: () => {},
    waitUntilReady: async () => {},
  } as any;
}

export function createQueueEventsMock(queueName: string): QueueEvents {
  return {
    name: queueName,
    on: () => {},
    waitUntilReady: async () => {},
  } as any;
}
