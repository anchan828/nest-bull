import { Type } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import * as Bull from "bull";
import { Redis } from "ioredis";

export type BullName = string | symbol;

export interface BullQueueDefaultProcessorOptions {
  /**
   * Bull will then call your handler in parallel respecting this maximum value.
   */
  concurrency?: number;

  /**
   * Skip call this processor if true.
   */
  skip?: boolean;
}

export interface BullQueueDefaultJobOptions {
  /**
   * Set TTL when job in the completed. (Default: -1)
   */
  setTTLOnComplete?: number;
  /**
   * Set TTL when job in the failed. (Default: -1)
   */
  setTTLOnFail?: number;
}

export interface BullQueueExtraOptions {
  defaultProcessorOptions?: BullQueueDefaultProcessorOptions;

  defaultJobOptions?: BullQueueDefaultJobOptions;
}
export type BullQueueType = string | Type<unknown>;

export interface BullQueueMock extends Pick<BullQueue, "name" | "add" | "isReady" | "close" | "process"> {
  on: (listener: string, callback: () => void) => void;
}
export interface BullModuleOptions {
  queues: BullQueueType[];
  options?: Bull.QueueOptions;
  extra?: BullQueueExtraOptions;

  /**
   * Set true if you don't want to create ${@link Queue} object.
   * If you set to true, module create {@link BullQueueMock} object
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

export interface BaseBullQueueOptions {
  name?: BullName;
}

export interface BullQueueOptions extends BaseBullQueueOptions {
  options?: Bull.QueueOptions;
  extra?: BullQueueExtraOptions;
}

export interface BullQueueProcessorOptions extends BaseBullQueueOptions {
  name?: string;
  concurrency?: number;

  /**
   * Skip call this processor if true.
   */
  skip?: boolean;
  isCustomProcessorName?: boolean;
}

export interface BullQueueEventOptions extends BaseBullQueueOptions {
  eventNames: string[];
}

export type BullQueue = Bull.Queue & { clients: Redis[] };
export type BullJob = Bull.Job & { toKey: () => string; queue: BullQueue };
export type BullQueueEvent =
  | "error"
  | "waiting"
  | "active"
  | "stalled"
  | "progress"
  | "completed"
  | "failed"
  | "paused"
  | "resumed"
  | "cleaned"
  | "drained"
  | "removed";
