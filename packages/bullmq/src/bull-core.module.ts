import { DynamicModule, Global, Inject, Module, Provider } from "@nestjs/common";
import { ClassProvider, FactoryProvider, OnModuleInit } from "@nestjs/common/interfaces";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { Queue, Worker } from "bullmq";
import * as deepmerge from "deepmerge";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { BullExplorerService } from "./bull.explorer.service";
import {
  BullModuleAsyncOptions,
  BullModuleOptions,
  BullModuleOptionsFactory,
  BullQueueOptions,
} from "./bull.interfaces";
import { getBullQueueToken } from "./bull.utils";

@Global()
@Module({
  providers: [MetadataScanner, BullExplorerService],
})
export class BullCoreModule implements OnModuleInit {
  constructor(
    @Inject(BULL_MODULE_OPTIONS)
    private readonly options: BullModuleOptions,
    private readonly explorer: BullExplorerService,
  ) {}

  onModuleInit(): void {
    const workers = this.explorer.explore();

    for (const worker of workers) {
      for (const workerProcessor of worker.processors) {
        new Worker(
          worker.options.queueName,
          workerProcessor.processor,
          deepmerge.all([
            { connection: this.options?.options?.connection },
            worker.options.options || {},
            workerProcessor.options.opts || {},
          ]),
        );
      }
    }
  }

  public static forRoot(options: BullModuleOptions): DynamicModule {
    const optionProvider = {
      provide: BULL_MODULE_OPTIONS,
      useValue: options,
    };
    return {
      module: BullCoreModule,
      providers: [optionProvider],
      exports: [optionProvider],
    };
  }

  public static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: BullCoreModule,
      imports: [...(options.imports || [])],
      providers: [...asyncProviders],
    };
  }

  public static forQueue(queues: BullQueueOptions[]): DynamicModule {
    const queueProviders: Provider[] = queues.map(queue => {
      return {
        provide: getBullQueueToken(queue.queueName),
        useFactory: (options: BullModuleOptions): Queue => {
          return new Queue(queue.queueName, deepmerge(options.options || {}, queue.options || {}));
        },
        inject: [BULL_MODULE_OPTIONS],
      } as Provider;
    });
    return {
      module: BullCoreModule,
      providers: queueProviders,
      exports: queueProviders,
    };
  }

  private static createAsyncProviders(options: BullModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: BullModuleAsyncOptions): FactoryProvider {
    if (options.useFactory) {
      return {
        provide: BULL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: BULL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: BullModuleOptionsFactory): Promise<BullModuleOptions> =>
        await optionsFactory.createBullModuleOptions(),
      inject: options.useClass ? [options.useClass] : [],
    };
  }
}
