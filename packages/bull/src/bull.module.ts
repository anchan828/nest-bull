import { DynamicModule, Global, Module } from "@nestjs/common";
import { BullCoreModule } from "./bull-core.module";
import { BullModuleAsyncOptions, BullModuleOptions } from "./bull.interfaces";

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
}
