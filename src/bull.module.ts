import { DynamicModule, Logger, Module } from '@nestjs/common';
import { BullConstants } from './bull.constants';
import { BullModuleOptions } from './bull.interfaces';
import { createQueues } from './bull.provider';

@Module({})
export class BullModule {
  public static forRoot(options: BullModuleOptions): DynamicModule {

    const queueProviders = createQueues(options).map(queue => {
      return {
        provide: queue.name,
        useValue: queue,
      };
    });

    return {
      module: BullModule,
      providers: [...queueProviders],
      exports: [...queueProviders],
    };
  }
}
