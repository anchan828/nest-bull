import { Processor, WorkerListener, WorkerOptions } from "bullmq";
import { BullBaseMetadata, BullProcessMetadata } from "./bull-base.interface";

/**
 * Worker interfaces
 */
export interface BullWorkerOptions {
  queueName: string;
  options?: WorkerOptions;
}

/**
 * Worker process interfaces
 */

export interface BullWorkerProcessMetadata {
  processor: Processor;
  options: WorkerOptions;
}
export interface BullWorkerMetadata
  extends BullBaseMetadata<BullWorkerOptions, BullProcessMetadata<keyof WorkerListener>> {
  processors: BullWorkerProcessMetadata[];
}

export type BullWorkerListenerArgs = {
  [key in keyof WorkerListener]: Parameters<WorkerListener[key]>[0];
};
