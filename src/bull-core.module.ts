import { DynamicModule, Module } from '@nestjs/common';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common/interfaces';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { BULL_MODULE_OPTIONS } from './bull.constants';
import { BullModuleOptions } from './bull.interfaces';
import { BullQueueService } from './services/bull-queue.service';
import { BullQueueEventExplorerService } from './services/explorers/event-explorer.service';
import { BullQueueProcessorExplorerService } from './services/explorers/processor-explorer.service';
import { BullQueueExplorerService } from './services/explorers/queue-explorer.service';

@Module({
  providers: [
    MetadataScanner,
    BullQueueExplorerService,
    BullQueueProcessorExplorerService,
    BullQueueEventExplorerService,
  ],
})
export class BullCoreModule implements OnModuleInit, OnModuleDestroy {
  async onModuleDestroy() {
    for (const bullQueue of this.queueExplorer.getInjectedBullQueues()) {
      await bullQueue.close();
    }
  }
  async onModuleInit() {
    for (const bullQueue of this.queueExplorer.getInjectedBullQueues()) {
      await bullQueue.isReady();
    }
  }
  constructor(
    private readonly queueExplorer: BullQueueExplorerService,
    private readonly processorExplorer: BullQueueProcessorExplorerService,
    private readonly eventExplorer: BullQueueEventExplorerService,
  ) {
    this.processorExplorer.explore();
    this.eventExplorer.explore();
  }
  public static forRoot(options: BullModuleOptions): DynamicModule {
    const bullQueueProviders = new BullQueueService(
      options,
    ).createBullQueueProviders();
    return {
      module: BullCoreModule,
      providers: [
        {
          provide: BULL_MODULE_OPTIONS,
          useValue: options,
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
