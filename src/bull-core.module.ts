import {
  DynamicModule,
  Global,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ValueProvider } from '@nestjs/common/interfaces';
import { BullBootstrapService } from './bull-bootstrap.service';
import { BullConstants } from './bull.constants';
import { BullModuleOptions } from './bull.interfaces';
import { createQueues } from './bull.provider';
import { BullService } from './bull.service';
import { getBullQueueToken } from './bull.utils';

@Global()
@Module({
  providers: [BullService, BullBootstrapService],
})
export class BullCoreModule implements OnModuleDestroy, OnApplicationShutdown {
  constructor(private readonly bullService: BullService) {}

  public static forRoot(options: BullModuleOptions): DynamicModule {
    const bullQueueProviders = createQueues(options).map(
      queue =>
        ({
          provide: getBullQueueToken(queue.name),
          useValue: queue,
        } as ValueProvider),
    );

    return {
      module: BullCoreModule,
      providers: [
        {
          provide: BullConstants.BULL_MODULE_OPTIONS,
          useValue: options,
        },
        ...bullQueueProviders,
      ],
      exports: [...bullQueueProviders],
    };
  }

  async onModuleDestroy(): Promise<any> {
    await this.bullService.teardownQueues();
  }
  async onApplicationShutdown(signal?: string) {
    await this.bullService.teardownQueues();
  }
}
