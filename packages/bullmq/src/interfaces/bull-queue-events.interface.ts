import { QueueEventsListener, QueueEventsOptions } from "bullmq";
import { BullBaseMetadata, BullProcessMetadata } from "./bull-base.interface";

/**
 * Queue events options
 */
export interface BullQueueEventsOptions {
  queueName: string;
  options?: QueueEventsOptions;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullQueueEventsMetadata
  extends BullBaseMetadata<BullQueueEventsOptions, BullProcessMetadata<keyof QueueEventsListener>> {}

export type BullQueueEventsListenerArgs = {
  [key in keyof QueueEventsListener]: Parameters<QueueEventsListener[key]>[0];
};
