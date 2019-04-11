import { Inject, Logger } from '@nestjs/common';
import * as deepmerge from 'deepmerge';
import 'reflect-metadata';
import {
  BULL_MODULE,
  BULL_QUEUE_DECORATOR,
  BULL_QUEUE_EVENT_DECORATOR,
  BULL_QUEUE_PROCESSOR_DECORATOR,
} from './bull.constants';
import {
  BullName,
  BullQueueEvent,
  BullQueueEventOptions,
  BullQueueOptions,
  BullQueueProcessorOptions,
} from './bull.interfaces';
import { getBullQueueToken } from './bull.utils';

export const BullQueue = (options?: BullQueueOptions) => {
  return (target: any) => {
    Reflect.defineMetadata(
      BULL_QUEUE_DECORATOR,
      deepmerge({ name: target.name }, options || {}),
      target,
    );
  };
};

export const BullQueueProcess = (options?: BullQueueProcessorOptions) => {
  return (target: any, propertyName: string) => {
    Reflect.defineMetadata(
      BULL_QUEUE_PROCESSOR_DECORATOR,
      options,
      target,
      propertyName,
    );
  };
};

export const EventHandler = (type: BullQueueEvent, isGlobal: boolean) => {
  return (target: any, propertyName: string) => {
    const eventName = `${isGlobal ? 'global:' : ''}${type}`;
    const options: BullQueueEventOptions = deepmerge(
      { eventNames: [] },
      Reflect.getMetadata(BULL_QUEUE_EVENT_DECORATOR, target, propertyName) ||
        {},
    );
    if (options.eventNames.indexOf(eventName) !== -1) {
      Logger.warn(
        `Not allowed multiple event on same function. ${eventName} on ${propertyName}`,
        BULL_MODULE,
        false,
      );
      return;
    }
    options.eventNames.push(eventName);
    Reflect.defineMetadata(
      BULL_QUEUE_EVENT_DECORATOR,
      options,
      target,
      propertyName,
    );
  };
};

// locally events
export const BullQueueEventError = () => EventHandler('error', false);
export const BullQueueEventWaiting = () => EventHandler('waiting', false);
export const BullQueueEventActive = () => EventHandler('active', false);
export const BullQueueEventStalled = () => EventHandler('stalled', false);
export const BullQueueEventProgress = () => EventHandler('progress', false);
export const BullQueueEventCompleted = () => EventHandler('completed', false);
export const BullQueueEventFailed = () => EventHandler('failed', false);
export const BullQueueEventPaused = () => EventHandler('paused', false);
export const BullQueueEventResumed = () => EventHandler('resumed', false);
export const BullQueueEventCleaned = () => EventHandler('cleaned', false);
export const BullQueueEventDrained = () => EventHandler('drained', false);
export const BullQueueEventRemoved = () => EventHandler('removed', false);

// global events
export const BullQueueEventGlobalError = () => EventHandler('error', true);
export const BullQueueEventGlobalWaiting = () => EventHandler('waiting', true);
export const BullQueueEventGlobalActive = () => EventHandler('active', true);
export const BullQueueEventGlobalStalled = () => EventHandler('stalled', true);
export const BullQueueEventGlobalProgress = () =>
  EventHandler('progress', true);
export const BullQueueEventGlobalCompleted = () =>
  EventHandler('completed', true);
export const BullQueueEventGlobalFailed = () => EventHandler('failed', true);
export const BullQueueEventGlobalPaused = () => EventHandler('paused', true);
export const BullQueueEventGlobalResumed = () => EventHandler('resumed', true);
export const BullQueueEventGlobalCleaned = () => EventHandler('cleaned', true);
export const BullQueueEventGlobalDrained = () => EventHandler('drained', true);
export const BullQueueEventGlobalRemoved = () => EventHandler('removed', true);

// Avoid same name with Queue class
export const BullQueueInject = (name: BullName) =>
  Inject(getBullQueueToken(name));
