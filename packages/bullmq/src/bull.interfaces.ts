import { Type } from "@nestjs/common";
import { Injectable, ModuleMetadata } from "@nestjs/common/interfaces";
import { Processor, QueueBaseOptions, QueueOptions, WorkerOptions } from "bullmq";

/**
 * Module interfaces
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BullModuleOptions {
  options?: QueueBaseOptions;
}

export type BullModuleAsyncOptions = {
  useClass?: Type<BullModuleOptionsFactory>;
  /**
   * The factory which should be used to provide the Bull options
   */
  useFactory?: (...args: unknown[]) => Promise<BullModuleOptions> | BullModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: Array<Type<any> | string | any>;
} & Pick<ModuleMetadata, "imports">;

export interface BullModuleOptionsFactory {
  createBullModuleOptions(): Promise<BullModuleOptions> | BullModuleOptions;
}

/**
 * Queue interfaces
 */
export interface BullQueueOptions {
  queueName: string;
  options?: QueueOptions;
}

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
