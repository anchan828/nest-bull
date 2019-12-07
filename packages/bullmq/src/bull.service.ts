import { Injectable } from "@nestjs/common";
import { Queue, QueueEvents, Worker } from "bullmq";
@Injectable()
export class BullService {
  public queues: Record<string, Queue> = {};

  public workers: Record<string, Worker> = {};

  public queueEvents: Record<string, QueueEvents> = {};
}
