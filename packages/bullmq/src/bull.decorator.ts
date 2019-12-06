import { Inject, SetMetadata } from "@nestjs/common";
import { WorkerOptions } from "bullmq";
import { BULL_WORKER_DECORATOR, BULL_WORKER_PROCESSOR_DECORATOR } from "./bull.constants";
import { BullWorkerOptions } from "./bull.interfaces";
import { getBullQueueToken } from "./bull.utils";
export function BullWorker(options: BullWorkerOptions): Function {
  return SetMetadata(BULL_WORKER_DECORATOR, options);
}

export function BullWorkerProcess(options?: WorkerOptions): Function {
  return SetMetadata(BULL_WORKER_PROCESSOR_DECORATOR, options);
}

export function BullQueueInject(queueName: string): Function {
  return Inject(getBullQueueToken(queueName));
}
