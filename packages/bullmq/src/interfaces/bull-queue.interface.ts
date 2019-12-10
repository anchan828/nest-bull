import { QueueOptions } from "bullmq";
import { BullQueueBaseMetadata } from "./bull-base.interface";

/**
 * Queue interfaces
 */
export interface BullQueueOptions {
  queueName: string;
  options?: QueueOptions;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullQueueMetadata extends BullQueueBaseMetadata<BullQueueOptions> {}
