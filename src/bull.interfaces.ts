import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import * as Bull from 'bull';
import { Redis } from 'ioredis';

export interface BullQueueExtraOptions {
  defaultProcessorOptions?: {
    /**
     * Bull will then call your handler in parallel respecting this maximum value.
     */
    concurrency?: number;
  };

  defaultJobOptions?: {
    /**
     * Set TTL when job in the completed. (Default: -1)
     */
    setTTLOnComplete?: number;
    /**
     * Set TTL when job in the failed. (Default: -1)
     */
    setTTLOnFail?: number;
  };
}
export type BullQueueType = string | Type<unknown>;
export interface BullModuleOptions {
  queues: BullQueueType[];
  options?: Bull.QueueOptions;
  extra?: BullQueueExtraOptions;
}

export type BullModuleAsyncOptions = {
  useClass?: Type<BullModuleOptionsFactory>;
  /**
   * The factory which should be used to provide the Bull options
   */
  useFactory?: (
    ...args: unknown[]
  ) => Promise<BullModuleOptions> | BullModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: unknown[];
} & Pick<ModuleMetadata, 'imports'>;

export interface BullModuleOptionsFactory {
  createBullModuleOptions(): Promise<BullModuleOptions> | BullModuleOptions;
}

export interface BaseBullQueueOptions {
  name?: string;
}

export interface BullQueueOptions extends BaseBullQueueOptions {
  options?: Bull.QueueOptions;
  extra?: BullQueueExtraOptions;
}

export interface BullQueueProcessorOptions extends BaseBullQueueOptions {
  concurrency?: number;
}

export interface BullQueueEventOptions extends BaseBullQueueOptions {
  eventNames: string[];
}

export type BullQueue = Bull.Queue & { clients: Redis[] };
export type BullJob = Bull.Job & { toKey: () => string; queue: BullQueue };
export type BullQueueEvent =
  | 'error'
  | 'waiting'
  | 'active'
  | 'stalled'
  | 'progress'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'resumed'
  | 'cleaned'
  | 'drained'
  | 'removed';
