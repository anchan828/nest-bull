import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { ValueProvider } from '@nestjs/common/interfaces';
import { BullConstants } from './bull.constants';
import { BullModuleOptions } from './bull.interfaces';
import { createQueues } from './bull.provider';
import { BullService } from './bull.service';
import { getBullQueueToken } from './bull.utils';

@Global()
@Module({
  providers: [BullService],
})
export class BullCoreModule implements OnModuleInit {
  constructor(
    @Inject(BullConstants.BULL_MODULE_OPTIONS)
    private bullModuleOptions: BullModuleOptions,
    private readonly bullService: BullService,
  ) {}

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

  onModuleInit(): any {
    this.bullService.assignProcessors();
  }
}
