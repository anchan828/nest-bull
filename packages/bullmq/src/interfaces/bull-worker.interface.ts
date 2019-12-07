import { Injectable } from "@nestjs/common/interfaces";
import { Processor } from "bullmq";

/**
 * Worker interfaces
 */
export interface BullWorkerOptions {
  queueName: string;
  options?: WorkerOptions;
}
export interface BullWorkerMetadata {
  instance: Injectable;
  options: BullWorkerOptions;

  processors: BullWorkerProcessMetadata[];
}

/**
 * Worker process interfaces
 */

export interface BullWorkerProcessMetadata {
  processor: Processor;
  options: WorkerOptions;
}
