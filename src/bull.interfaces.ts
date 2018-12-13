import * as bull from 'bull';

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

export interface BullModuleOptions {
  queues: string[];
  options?: Partial<bull.QueueOptions>;
  extra?: BullQueueExtraOptions;
}

export interface BullQueueOptions {
  name: string;
  options?: bull.QueueOptions;
  extra?: BullQueueExtraOptions;
}

export interface BullQueueProcessorOptions {
  name?: string;
  concurrency?: number;
}

export type BullQueue = {
  name: string;
} & Partial<bull.Queue>;

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
