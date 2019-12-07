import { Injectable } from "@nestjs/common/interfaces";
import { BullQueueEventsProcessMetadata } from "./bull-queue-events.interface";

export interface BullQueueBaseMetadata<Options> {
  instance: Injectable;
  options: Options;

  events: BullQueueEventsProcessMetadata[];
}
