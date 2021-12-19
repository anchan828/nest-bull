import { Processor, WorkerListener, WorkerOptions } from "bullmq";
import { BullProcessMetadata, BullQueueBaseMetadata } from "./bull-base.interface";

/**
 * Worker interfaces
 */
export interface BullWorkerOptions {
  queueName: string;
  options?: WorkerOptions;
}
export interface BullWorkerMetadata extends BullQueueBaseMetadata<BullWorkerOptions, BullWorkerEventProcessMetadata> {
  processors: BullWorkerProcessMetadata[];
}

/**
 * Worker process interfaces
 */

export interface BullWorkerProcessMetadata {
  processor: Processor;
  options: WorkerOptions;
}

/**
 * Worker event process interfaces
 */

export type BullWorkerEventProcessMetadata = BullProcessMetadata<keyof WorkerListener>;
