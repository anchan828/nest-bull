import { Type } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import { QueueBaseOptions } from "bullmq";
import { BullQueueEventsMetadata } from "./bull-queue-events.interface";
import { BullQueueMetadata } from "./bull-queue.interface";
import { BullWorkerMetadata } from "./bull-worker.interface";

/**
 * Module interfaces
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullModuleOptions {
  options?: QueueBaseOptions;

  /**
   * Set true if you don't want to create {@link Queue}/{@link Worker}/{@link QueueEvents} object.
   * If you set to true, module create mock object for them
   * @type {boolean}
   * @memberof BullModuleOptions
   */
  mock?: boolean;
}

export interface BullModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useClass?: Type<BullModuleOptionsFactory>;
  useExisting?: Type<BullModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<BullModuleOptions> | BullModuleOptions;
  inject?: Array<Type<BullModuleOptionsFactory> | string | any>;
}

export interface BullModuleOptionsFactory {
  createBullModuleOptions(): Promise<BullModuleOptions> | BullModuleOptions;
}

export interface BullExploreResults {
  queues: BullQueueMetadata[];
  workers: BullWorkerMetadata[];
  queueEvents: BullQueueEventsMetadata[];
}
