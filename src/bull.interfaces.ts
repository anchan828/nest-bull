import * as bull from 'bull';

export interface BullModuleOptions {
  queues: string[];
  options?: Partial<bull.QueueOptions>;
}

export interface BullQueueOptions {
  name: string;
  options?: bull.QueueOptions;
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
