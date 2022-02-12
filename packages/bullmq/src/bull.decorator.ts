import { Inject, SetMetadata } from "@nestjs/common";
import { QueueEventsListener, QueueListener, WorkerListener, WorkerOptions } from "bullmq";
import {
  BULL_LISTENER_DECORATOR,
  BULL_QUEUE_DECORATOR,
  BULL_QUEUE_EVENTS_DECORATOR,
  BULL_WORKER_DECORATOR,
  BULL_WORKER_PROCESSOR_DECORATOR,
} from "./bull.constants";
import { getBullQueueToken } from "./bull.utils";
import { BullQueueEventsOptions, BullQueueOptions, BullWorkerOptions } from "./interfaces";

export function BullQueue(options: BullQueueOptions): ClassDecorator {
  return SetMetadata(BULL_QUEUE_DECORATOR, options);
}

export function BullQueueListener(type: keyof QueueListener<any, any, string>): MethodDecorator {
  return SetMetadata(BULL_LISTENER_DECORATOR, type);
}

export function BullWorker(options: BullWorkerOptions): ClassDecorator {
  return SetMetadata(BULL_WORKER_DECORATOR, options);
}

export function BullWorkerProcess(options?: WorkerOptions): MethodDecorator {
  return SetMetadata(BULL_WORKER_PROCESSOR_DECORATOR, options || {});
}

export function BullWorkerListener(type: keyof WorkerListener): MethodDecorator {
  return SetMetadata(BULL_LISTENER_DECORATOR, type);
}

export function BullQueueEvents(options?: BullQueueEventsOptions): ClassDecorator {
  return SetMetadata(BULL_QUEUE_EVENTS_DECORATOR, options);
}

export function BullQueueEventsListener(type: keyof QueueEventsListener): MethodDecorator {
  return SetMetadata(BULL_LISTENER_DECORATOR, type);
}

/**
 *
 * @deprecated Use BullQueueListener, BullWorkerListener and BullQueueEventsListener instead.
 * @export
 * @param {keyof QueueEventsListener} type
 * @return {*}  {MethodDecorator}
 */
export function BullQueueEventProcess(type: keyof QueueEventsListener): MethodDecorator {
  return SetMetadata(BULL_LISTENER_DECORATOR, type);
}

export function BullQueueInject(queueName: string): ParameterDecorator {
  return Inject(getBullQueueToken(queueName));
}
