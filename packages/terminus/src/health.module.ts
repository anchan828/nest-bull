import { Module } from "@nestjs/common";
import { BullHealthCheckQueue, BullHealthIndicator } from "./bull.health";
@Module({
  providers: [BullHealthCheckQueue, BullHealthIndicator],
  exports: [BullHealthCheckQueue, BullHealthIndicator],
})
export class BullHealthModule {}
