import { Type } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import { QueueBaseOptions } from "bullmq";
import { BullQueueEventsMetadata } from "./bull-queue-events.interface";
import { BullWorkerMetadata } from "./bull-worker.interface";

/**
 * Module interfaces
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullModuleOptions {
  options?: QueueBaseOptions;
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
  workers: BullWorkerMetadata[];
  queueEvents: BullQueueEventsMetadata[];
}
