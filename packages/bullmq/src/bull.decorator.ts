import { Inject, SetMetadata } from "@nestjs/common";
import { WorkerOptions } from "bullmq";
import {
  BULL_QUEUE_DECORATOR,
  BULL_QUEUE_EVENTS_DECORATOR,
  BULL_QUEUE_EVENTS_PROCESSOR_DECORATOR,
  BULL_WORKER_DECORATOR,
  BULL_WORKER_PROCESSOR_DECORATOR,
} from "./bull.constants";
import { getBullQueueToken } from "./bull.utils";
import { BullQueueEvent, BullQueueEventsOptions, BullQueueOptions, BullWorkerOptions } from "./interfaces";

export function BullQueue(options: BullQueueOptions): Function {
  return SetMetadata(BULL_QUEUE_DECORATOR, options);
}

export function BullWorker(options: BullWorkerOptions): Function {
  return SetMetadata(BULL_WORKER_DECORATOR, options);
}

export function BullWorkerProcess(options?: WorkerOptions): Function {
  return SetMetadata(BULL_WORKER_PROCESSOR_DECORATOR, options);
}

export function BullQueueEvents(options?: BullQueueEventsOptions): Function {
  return SetMetadata(BULL_QUEUE_EVENTS_DECORATOR, options);
}

export function BullQueueEventProcess(type: BullQueueEvent): Function {
  return SetMetadata(BULL_QUEUE_EVENTS_PROCESSOR_DECORATOR, type);
}

export function BullQueueInject(queueName: string): Function {
  return Inject(getBullQueueToken(queueName));
}
