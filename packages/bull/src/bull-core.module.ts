import {
  DynamicModule,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { BULL_MODULE_OPTIONS, BULL_MODULE_SERVICE } from './bull.constants';
import { BullModuleOptions } from './bull.interfaces';
import { BullQueueService } from './services/bull-queue.service';
import { BullQueueEventExplorerService } from './services/explorers/event-explorer.service';
import { BullQueueProcessorExplorerService } from './services/explorers/processor-explorer.service';

@Module({
  providers: [
    MetadataScanner,
    BullQueueProcessorExplorerService,
    BullQueueEventExplorerService,
  ],
})
export class BullCoreModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    this.processorExplorer.explore();
    this.eventExplorer.explore();
    await this.bullService.isReady();
  }
  async onModuleDestroy() {
    await this.bullService.closeAll();
  }

  constructor(
    private readonly processorExplorer: BullQueueProcessorExplorerService,
    private readonly eventExplorer: BullQueueEventExplorerService,
    @Inject(BULL_MODULE_SERVICE)
    private readonly bullService: BullQueueService,
  ) {}
  public static forRoot(options: BullModuleOptions): DynamicModule {
    const bullService = new BullQueueService(options);
    const bullQueueProviders = bullService.createBullQueueProviders();
    return {
      module: BullCoreModule,
      providers: [
        {
          provide: BULL_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: BULL_MODULE_SERVICE,
          useValue: bullService,
        },
        ...bullQueueProviders,
      ],
      exports: [...bullQueueProviders],
    };
  }
  // TODO: I don't know how to create bull queue providers by async...
  // public static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
  //   const asyncProviders = this.createAsyncProviders(options);
  //   return {
  //     module: BullCoreModule,
  //     imports: [...(options.imports || [])],
  //     providers: [...asyncProviders],
  //   };
  // }

  // private static createAsyncProviders(
  //   options: BullModuleAsyncOptions,
  // ): Provider[] {
  //   if (options.useFactory) {
  //     return [this.createAsyncOptionsProvider(options)];
  //   }
  //   return [
  //     this.createAsyncOptionsProvider(options),
  //     {
  //       provide: options.useClass,
  //       useClass: options.useClass,
  //       inject: [options.inject || []],
  //     } as ClassProvider,
  //   ];
  // }

  // private static createAsyncOptionsProvider(
  //   options: BullModuleAsyncOptions,
  // ): Provider {
  //   if (options.useFactory) {
  //     return {
  //       provide: BULL_MODULE_OPTIONS,
  //       useFactory: options.useFactory,
  //       inject: options.inject || [],
  //     };
  //   }
  //   return {
  //     provide: BULL_MODULE_OPTIONS,
  //     useFactory: async (optionsFactory: BullModuleOptionsFactory) =>
  //       await optionsFactory.createBullModuleOptions(),
  //     inject: [options.useClass],
  //   };
  // }
}
