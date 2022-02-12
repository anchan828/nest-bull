import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { BullCoreModule } from "./bull-core.module";
import { createQueueProviders } from "./bull.providers";
import { BullModuleAsyncOptions, BullModuleOptions, BullQueueOptions } from "./interfaces";

@Global()
@Module({})
export class BullModule {
  public static forRoot(options: BullModuleOptions): DynamicModule {
    return {
      module: BullModule,
      imports: [BullCoreModule.forRoot(options)],
    };
  }

  public static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
    return {
      module: BullModule,
      imports: [BullCoreModule.forRootAsync(options)],
    };
  }

  public static registerQueue(...queues: (string | BullQueueOptions)[]): DynamicModule {
    const queueProviders: Provider[] = createQueueProviders(queues);
    return {
      module: BullModule,
      providers: queueProviders,
      exports: queueProviders,
    };
  }
}
