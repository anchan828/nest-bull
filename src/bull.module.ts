import { DynamicModule, Module } from '@nestjs/common';
import { BullCoreModule } from './bull-core.module';
import { BullModuleOptions } from './bull.interfaces';

@Module({})
export class BullModule {
  public static forRoot(options: BullModuleOptions): DynamicModule {
    return {
      module: BullModule,
      imports: [BullCoreModule.forRoot(options)],
    };
  }
}
