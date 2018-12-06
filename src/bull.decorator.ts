import 'reflect-metadata';
import { BullConstants } from './bull.constants';
import { BullQueueOptions, BullQueueProcessorOptions } from './bull.interfaces';

export function BullQueue(options?: BullQueueOptions) {
  return (target: any) => {
    Reflect.defineMetadata(
      BullConstants.BULL_QUEUE_DECORATOR,
      options,
      target.prototype,
    );
  };
}

export function BullQueueProcessor<T>(options?: BullQueueProcessorOptions) {
  return (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) => {
    Reflect.defineMetadata(
      BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR,
      options || BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR,
      target,
      propertyName,
    );
  };
}
