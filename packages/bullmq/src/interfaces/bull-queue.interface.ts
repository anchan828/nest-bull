import { QueueOptions } from "bullmq";
import { BullProcessMetadata, BullQueueBaseMetadata, QueueListenerType } from "./bull-base.interface";

/**
 * Queue interfaces
 */
export interface BullQueueOptions {
  queueName: string;
  options?: QueueOptions;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullQueueMetadata extends BullQueueBaseMetadata<BullQueueOptions, BullQueueEventProcessMetadata> {}

export type BullQueueEventProcessMetadata = BullProcessMetadata<QueueListenerType>;
