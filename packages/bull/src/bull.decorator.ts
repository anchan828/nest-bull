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

export const BullQueue = (options?: BullQueueOptions): ClassDecorator => {
  return (target: any): void => {
    Reflect.defineMetadata(BULL_QUEUE_DECORATOR, deepmerge({ name: target.name }, options || {}), target);
  };
};

export const BullQueueProcess = (options?: BullQueueProcessorOptions): MethodDecorator => {
  return (target: any, propertyName: string | symbol): void => {
    Reflect.defineMetadata(BULL_QUEUE_PROCESSOR_DECORATOR, options, target, propertyName);
  };
};

export const EventHandler = (type: BullQueueEvent, isGlobal: boolean): MethodDecorator => {
  return (target: any, propertyName: string | symbol): void => {
    const eventName = `${isGlobal ? "global:" : ""}${type}`;
    const options: BullQueueEventOptions = deepmerge(
      { eventNames: [] },
      Reflect.getMetadata(BULL_QUEUE_EVENT_DECORATOR, target, propertyName) || {},
    );
    if (options.eventNames.indexOf(eventName) !== -1) {
      Logger.warn(
        `Not allowed multiple event on same function. ${eventName} on ${propertyName.toString()}`,
        BULL_MODULE,
        false,
      );
      return;
    }
    options.eventNames.push(eventName);
    Reflect.defineMetadata(BULL_QUEUE_EVENT_DECORATOR, options, target, propertyName);
  };
};

// locally events
export const BullQueueEventError = (): MethodDecorator => EventHandler("error", false);
export const BullQueueEventWaiting = (): MethodDecorator => EventHandler("waiting", false);
export const BullQueueEventActive = (): MethodDecorator => EventHandler("active", false);
export const BullQueueEventStalled = (): MethodDecorator => EventHandler("stalled", false);
export const BullQueueEventProgress = (): MethodDecorator => EventHandler("progress", false);
export const BullQueueEventCompleted = (): MethodDecorator => EventHandler("completed", false);
export const BullQueueEventFailed = (): MethodDecorator => EventHandler("failed", false);
export const BullQueueEventPaused = (): MethodDecorator => EventHandler("paused", false);
export const BullQueueEventResumed = (): MethodDecorator => EventHandler("resumed", false);
export const BullQueueEventCleaned = (): MethodDecorator => EventHandler("cleaned", false);
export const BullQueueEventDrained = (): MethodDecorator => EventHandler("drained", false);
export const BullQueueEventRemoved = (): MethodDecorator => EventHandler("removed", false);

// global events
export const BullQueueEventGlobalError = (): MethodDecorator => EventHandler("error", true);
export const BullQueueEventGlobalWaiting = (): MethodDecorator => EventHandler("waiting", true);
export const BullQueueEventGlobalActive = (): MethodDecorator => EventHandler("active", true);
export const BullQueueEventGlobalStalled = (): MethodDecorator => EventHandler("stalled", true);
export const BullQueueEventGlobalProgress = (): MethodDecorator => EventHandler("progress", true);
export const BullQueueEventGlobalCompleted = (): MethodDecorator => EventHandler("completed", true);
export const BullQueueEventGlobalFailed = (): MethodDecorator => EventHandler("failed", true);
export const BullQueueEventGlobalPaused = (): MethodDecorator => EventHandler("paused", true);
export const BullQueueEventGlobalResumed = (): MethodDecorator => EventHandler("resumed", true);
export const BullQueueEventGlobalCleaned = (): MethodDecorator => EventHandler("cleaned", true);
export const BullQueueEventGlobalDrained = (): MethodDecorator => EventHandler("drained", true);
export const BullQueueEventGlobalRemoved = (): MethodDecorator => EventHandler("removed", true);

// Avoid same name with Queue class
export const BullQueueInject = (name: BullName): ParameterDecorator => Inject(getBullQueueToken(name));
