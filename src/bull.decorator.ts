import { Inject } from '@nestjs/common';
import 'reflect-metadata';
import { BullConstants } from './bull.constants';
import {
  BullQueueEvent,
  BullQueueOptions,
  BullQueueProcessorOptions,
} from './bull.interfaces';
import { getBullQueueToken } from './bull.utils';

export const BullQueue = (options?: BullQueueOptions) => {
  return (target: any) => {
    Reflect.defineMetadata(
      BullConstants.BULL_QUEUE_DECORATOR,
      options,
      target.prototype,
    );
  };
};

export const BullQueueProcess = (options?: BullQueueProcessorOptions) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR,
      options || BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR,
      target,
      propertyName,
    );
  };
};

export const EventHandler = (
  type: BullQueueEvent,
  isGlobal: boolean = false,
) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    const eventName = `${isGlobal ? 'global:' : ''}${type}`;
    const values: string[] =
      Reflect.getMetadata(
        BullConstants.BULL_QUEUE_EVENT_DECORATOR,
        target,
        propertyName,
      ) || [];

    if (values.indexOf(eventName) !== -1) {
      return;
    }
    values.push(eventName);
    Reflect.defineMetadata(
      BullConstants.BULL_QUEUE_EVENT_DECORATOR,
      values,
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
export const BullQueueInject = (name: string) =>
  Inject(getBullQueueToken(name));
