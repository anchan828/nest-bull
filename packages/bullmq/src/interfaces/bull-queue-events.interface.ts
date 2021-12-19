import { QueueEventsListener, QueueEventsOptions } from "bullmq";
import { BullProcessMetadata, BullQueueBaseMetadata } from "./bull-base.interface";

/**
 * Queue events options
 */
export interface BullQueueEventsOptions {
  queueName: string;
  options?: QueueEventsOptions;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullQueueEventsMetadata
  extends BullQueueBaseMetadata<BullQueueEventsOptions, BullQueueEventsEventProcessMetadata> {}

/**
 * Queue events process interfaces
 */

export type BullQueueEventsEventProcessMetadata = BullProcessMetadata<keyof QueueEventsListener>;
