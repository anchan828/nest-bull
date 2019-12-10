import { Processor, QueueEventsOptions } from "bullmq";
import { BullQueueBaseMetadata } from "./bull-base.interface";

/**
 * Event types
 * @see https://github.com/taskforcesh/bullmq/blob/6de8b48c9612ea39bb28db5f4130cb2a2bb5ee90/src/classes/queue-base.ts#L22-L49
 */
export type BullQueueEvent =
  | "active"
  | "wait"
  | "waiting"
  | "paused"
  | "resumed"
  | "active"
  | "id"
  | "delayed"
  | "priority"
  | "stalled-check"
  | "completed"
  | "failed"
  | "stalled"
  | "repeat"
  | "limiter"
  | "drained"
  | "progress"
  | "meta"
  | "events"
  | "delay";

/**
 * Queue events options
 */
export interface BullQueueEventsOptions {
  queueName: string;
  options?: QueueEventsOptions;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullQueueEventsMetadata extends BullQueueBaseMetadata<BullQueueEventsOptions> {}

/**
 * Queue events process interfaces
 */

export interface BullQueueEventsProcessMetadata {
  type: BullQueueEvent;
  processor: Processor | any;
}
