import { Processor, WorkerOptions } from "bullmq";
import { BullQueueBaseMetadata } from "./bull-base.interface";

/**
 * Worker interfaces
 */
export interface BullWorkerOptions {
  queueName: string;
  options?: WorkerOptions;
}
export interface BullWorkerMetadata extends BullQueueBaseMetadata<BullWorkerOptions> {
  processors: BullWorkerProcessMetadata[];
}

/**
 * Worker process interfaces
 */

export interface BullWorkerProcessMetadata {
  processor: Processor;
  options: WorkerOptions;
}
