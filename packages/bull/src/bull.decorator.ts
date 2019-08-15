import { Inject, Logger } from "@nestjs/common";
import * as deepmerge from "deepmerge";
import "reflect-metadata";
import {
  BULL_MODULE,
  BULL_QUEUE_DECORATOR,
  BULL_QUEUE_EVENT_DECORATOR,
  BULL_QUEUE_PROCESSOR_DECORATOR,
} from "./bull.constants";
import {
  BullName,
  BullQueueEvent,
  BullQueueEventOptions,
  BullQueueOptions,
  BullQueueProcessorOptions,
} from "./bull.interfaces";
import { getBullQueueToken } from "./bull.utils";

export const BullQueue = (options?: BullQueueOptions) => {
  return (target: any): void => {
    Reflect.defineMetadata(BULL_QUEUE_DECORATOR, deepmerge({ name: target.name }, options || {}), target);
  };
};

export const BullQueueProcess = (options?: BullQueueProcessorOptions) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata(BULL_QUEUE_PROCESSOR_DECORATOR, options, target, propertyName);
  };
};

export const EventHandler = (type: BullQueueEvent, isGlobal: boolean) => {
  return (target: any, propertyName: string): void => {
    const eventName = `${isGlobal ? "global:" : ""}${type}`;
    const options: BullQueueEventOptions = deepmerge(
      { eventNames: [] },
      Reflect.getMetadata(BULL_QUEUE_EVENT_DECORATOR, target, propertyName) || {},
    );
    if (options.eventNames.indexOf(eventName) !== -1) {
      Logger.warn(`Not allowed multiple event on same function. ${eventName} on ${propertyName}`, BULL_MODULE, false);
      return;
    }
    options.eventNames.push(eventName);
    Reflect.defineMetadata(BULL_QUEUE_EVENT_DECORATOR, options, target, propertyName);
  };
};

// locally events
export const BullQueueEventError = (): Function => EventHandler("error", false);
export const BullQueueEventWaiting = (): Function => EventHandler("waiting", false);
export const BullQueueEventActive = (): Function => EventHandler("active", false);
export const BullQueueEventStalled = (): Function => EventHandler("stalled", false);
export const BullQueueEventProgress = (): Function => EventHandler("progress", false);
export const BullQueueEventCompleted = (): Function => EventHandler("completed", false);
export const BullQueueEventFailed = (): Function => EventHandler("failed", false);
export const BullQueueEventPaused = (): Function => EventHandler("paused", false);
export const BullQueueEventResumed = (): Function => EventHandler("resumed", false);
export const BullQueueEventCleaned = (): Function => EventHandler("cleaned", false);
export const BullQueueEventDrained = (): Function => EventHandler("drained", false);
export const BullQueueEventRemoved = (): Function => EventHandler("removed", false);

// global events
export const BullQueueEventGlobalError = (): Function => EventHandler("error", true);
export const BullQueueEventGlobalWaiting = (): Function => EventHandler("waiting", true);
export const BullQueueEventGlobalActive = (): Function => EventHandler("active", true);
export const BullQueueEventGlobalStalled = (): Function => EventHandler("stalled", true);
export const BullQueueEventGlobalProgress = (): Function => EventHandler("progress", true);
export const BullQueueEventGlobalCompleted = (): Function => EventHandler("completed", true);
export const BullQueueEventGlobalFailed = (): Function => EventHandler("failed", true);
export const BullQueueEventGlobalPaused = (): Function => EventHandler("paused", true);
export const BullQueueEventGlobalResumed = (): Function => EventHandler("resumed", true);
export const BullQueueEventGlobalCleaned = (): Function => EventHandler("cleaned", true);
export const BullQueueEventGlobalDrained = (): Function => EventHandler("drained", true);
export const BullQueueEventGlobalRemoved = (): Function => EventHandler("removed", true);

// Avoid same name with Queue class
export const BullQueueInject = (name: BullName): Function => Inject(getBullQueueToken(name));
