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
import { BullQueueEventsOptions, BullQueueOptions, BullWorkerOptions } from "./interfaces";
import { QueueListenerType } from "./interfaces/bull-base.interface";

export function BullQueue(options: BullQueueOptions): ClassDecorator {
  return SetMetadata(BULL_QUEUE_DECORATOR, options);
}

export function BullWorker(options: BullWorkerOptions): ClassDecorator {
  return SetMetadata(BULL_WORKER_DECORATOR, options);
}

export function BullWorkerProcess(options?: WorkerOptions): MethodDecorator {
  return SetMetadata(BULL_WORKER_PROCESSOR_DECORATOR, options || {});
}

export function BullQueueEvents(options?: BullQueueEventsOptions): ClassDecorator {
  return SetMetadata(BULL_QUEUE_EVENTS_DECORATOR, options);
}

export function BullQueueEventProcess(type: QueueListenerType): MethodDecorator {
  return SetMetadata(BULL_QUEUE_EVENTS_PROCESSOR_DECORATOR, type);
}

export function BullQueueInject(queueName: string): ParameterDecorator {
  return Inject(getBullQueueToken(queueName));
}
