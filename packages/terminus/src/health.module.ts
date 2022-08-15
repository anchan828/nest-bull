import { Module } from "@nestjs/common";
import { BullHealthCheckQueue, BullHealthIndicator } from "./bull.health";

const providers = [BullHealthCheckQueue, BullHealthIndicator];

@Module({ providers, exports: providers })
export class BullHealthModule {}
