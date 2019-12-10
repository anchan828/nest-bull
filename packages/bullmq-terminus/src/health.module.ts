import { Module } from "@nestjs/common";
import {
  BullHealthCheckQueue,
  BullHealthCheckQueueEvents,
  BullHealthCheckWorker,
  BullHealthIndicator,
} from "./bull.health";
@Module({
  providers: [BullHealthCheckQueue, BullHealthCheckWorker, BullHealthCheckQueueEvents, BullHealthIndicator],
  exports: [BullHealthCheckQueue, BullHealthCheckWorker, BullHealthCheckQueueEvents, BullHealthIndicator],
})
export class BullHealthModule {}
