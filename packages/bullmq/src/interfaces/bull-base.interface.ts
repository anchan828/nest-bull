import { Injectable } from "@nestjs/common/interfaces";
import { Processor } from "bullmq";

export interface BullQueueBaseMetadata<Options, EventType> {
  instance: Injectable;
  options: Options;
  events: EventType[];
}

export interface BullProcessMetadata<Type> {
  type: Type;
  processor: Processor | any;
}

/**
 * It seems that there are currently four types of Queue events.
 * https://github.com/taskforcesh/bullmq/blob/6de8b48c9612ea39bb28db5f4130cb2a2bb5ee90/src/classes/queue.ts
 */
export type QueueListenerType = "waiting" | "paused" | "resumed" | "cleaned";
