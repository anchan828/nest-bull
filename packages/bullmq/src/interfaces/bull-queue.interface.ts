import { QueueOptions } from "bullmq";

/**
 * Queue interfaces
 */
export interface BullQueueOptions {
  queueName: string;
  options?: QueueOptions;
}
