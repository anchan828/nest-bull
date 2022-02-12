import { QueueListener, QueueOptions } from "bullmq";
import { BullBaseMetadata, BullProcessMetadata } from "./bull-base.interface";

/**
 * Queue interfaces
 */
export interface BullQueueOptions {
  queueName: string;
  options?: QueueOptions;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullQueueMetadata
  extends BullBaseMetadata<BullQueueOptions, BullProcessMetadata<keyof QueueListener<any, any, string>>> {}

export type BullQueueListenerArgs<DataType = any, ResultType = any, NameType extends string = string> = {
  [key in keyof QueueListener<DataType, ResultType, NameType>]: Parameters<
    QueueListener<DataType, ResultType, NameType>[key]
  >[0];
};
