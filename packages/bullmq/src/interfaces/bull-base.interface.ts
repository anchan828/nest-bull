import { Injectable } from "@nestjs/common/interfaces";
import { Processor } from "bullmq";

export interface BullBaseMetadata<Options, EventType> {
  instance: Injectable;
  options: Options;
  events: EventType[];
}

export interface BullProcessMetadata<Type> {
  type: Type;
  processor: Processor | any;
}
