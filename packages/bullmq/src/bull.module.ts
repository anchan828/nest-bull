import { DynamicModule, Global, Module } from "@nestjs/common";
import { BullCoreModule } from "./bull-core.module";
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

  public static forQueue(queues: (string | BullQueueOptions)[]): DynamicModule {
    return {
      module: BullModule,
      imports: [BullCoreModule.forQueue(queues)],
    };
  }
}
