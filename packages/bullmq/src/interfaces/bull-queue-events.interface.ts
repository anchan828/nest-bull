import { Injectable } from "@nestjs/common/interfaces";
import { Processor } from "bullmq";

/**
 * Event types
 * @see https://github.com/taskforcesh/bullmq/blob/6de8b48c9612ea39bb28db5f4130cb2a2bb5ee90/src/classes/queue-base.ts#L22-L49
 */
export type BullQueueEvent =
  | "active"
  | "wait"
  | "waiting"
  | "paused"
  | "resumed"
  | "active"
  | "id"
  | "delayed"
  | "priority"
  | "stalled-check"
  | "completed"
  | "failed"
  | "stalled"
  | "repeat"
  | "limiter"
  | "drained"
  | "progress"
  | "meta"
  | "events"
  | "delay";

/**
 * Queue events options
 */
export interface BullQueueEventsOptions {
  queueName: string;
  options?: BullQueueEventsOptions;
}

export interface BullQueueEventsMetadata {
  instance: Injectable;
  options: BullQueueEventsOptions;

  events: BullQueueEventsProcessMetadata[];
}

/**
 * Queue events process interfaces
 */

export interface BullQueueEventsProcessMetadata {
  type: BullQueueEvent;
  processor: Processor | any;
}
