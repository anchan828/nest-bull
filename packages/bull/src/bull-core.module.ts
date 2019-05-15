import {
  DynamicModule,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
// import { ModulesContainer } from '@nestjs/core';
// import {
//   CustomValue,
//   Module as CoreModule,
// } from '@nestjs/core/injector/module';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { BULL_MODULE_OPTIONS, BULL_MODULE_SERVICE } from './bull.constants';
import {
  BullModuleAsyncOptions,
  BullModuleOptions,
  BullModuleOptionsFactory,
} from './bull.interfaces';
import { BullQueueProviderService } from './services/bull-queue-provider.service';
import { BullService } from './services/bull.service';
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
    if (this.bullService.isAsync) {
      const bullProviderService = new BullQueueProviderService(
        this.options,
        this.bullService,
      );
      // TODO: get value providers, but get injector error before adding BullCoreModule to them.
      const bullQueueProviders = bullProviderService.createBullQueueProviders();
      // const bullCoreModule = [...this.container.values()].find(
      //   module => module.metatype === BullCoreModule,
      // ) as CoreModule;
      // for (const provider of (bullQueueProviders as unknown) as CustomValue[]) {
      //   provider.name = provider.provide;
      //   bullCoreModule.addProvider(provider);
      //   bullCoreModule.exports.add(provider.provide);
      // }
    }

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
    @Inject(BULL_MODULE_OPTIONS)
    private readonly options: BullModuleOptions,
    @Inject(BULL_MODULE_SERVICE)
    private readonly bullService: BullService,
  ) // private readonly container: ModulesContainer,
  {}
  public static forRoot(options: BullModuleOptions): DynamicModule {
    const bullService = new BullService();
    const bullProviderService = new BullQueueProviderService(
      options,
      bullService,
    );
    const bullQueueProviders = bullProviderService.createBullQueueProviders();
    const bullQueueServiceProvider = {
      provide: BULL_MODULE_SERVICE,
      useValue: bullService,
    };
    return {
      module: BullCoreModule,
      providers: [
        {
          provide: BULL_MODULE_OPTIONS,
          useValue: options,
        },
        bullQueueServiceProvider,
        ...bullQueueProviders,
      ],
      exports: [bullQueueServiceProvider, ...bullQueueProviders],
    };
  }
  // TODO: I don't know how to create bull queue providers by async...
  public static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
    const bullService = new BullService(true);
    const bullQueueServiceProvider = {
      provide: BULL_MODULE_SERVICE,
      useValue: bullService,
    };

    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: BullCoreModule,
      imports: [...(options.imports || [])],
      providers: [bullQueueServiceProvider, ...asyncProviders],
      exports: [bullQueueServiceProvider],
    };
  }

  private static createAsyncProviders(
    options: BullModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
        inject: [options.inject || []],
      } as ClassProvider,
    ];
  }

  private static createAsyncOptionsProvider(
    options: BullModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: BULL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: BULL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: BullModuleOptionsFactory) =>
        await optionsFactory.createBullModuleOptions(),
      inject: [options.useClass],
    };
  }
}
