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

export type BullModuleAsyncOptions = {
  useClass?: Type<BullModuleOptionsFactory>;
  /**
   * The factory which should be used to provide the Bull options
   */
  useFactory?: (...args: unknown[]) => Promise<BullModuleOptions> | BullModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: Array<Type<any> | string | any>;
} & Pick<ModuleMetadata, "imports">;

export interface BullModuleOptionsFactory {
  createBullModuleOptions(): Promise<BullModuleOptions> | BullModuleOptions;
}

export interface BullExploreResults {
  queues: BullQueueMetadata[];
  workers: BullWorkerMetadata[];
  queueEvents: BullQueueEventsMetadata[];
}
