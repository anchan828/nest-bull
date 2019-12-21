import { Provider, Type } from "@nestjs/common";
import { ClassProvider, FactoryProvider } from "@nestjs/common/interfaces";
import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { BullModuleAsyncOptions, BullModuleOptions, BullModuleOptionsFactory } from "./interfaces";

export function createAsyncOptionsProvider(options: BullModuleAsyncOptions): FactoryProvider {
  if (options.useFactory) {
    return {
      inject: options.inject || [],
      provide: BULL_MODULE_OPTIONS,
      useFactory: options.useFactory,
    };
  }
  return {
    inject: [options.useClass || options.useExisting].filter(
      (x): x is Type<BullModuleOptionsFactory> => x !== undefined,
    ),
    provide: BULL_MODULE_OPTIONS,
    useFactory: async (optionsFactory: BullModuleOptionsFactory): Promise<BullModuleOptions> =>
      await optionsFactory.createBullModuleOptions(),
  };
}

export function createAsyncProviders(options: BullModuleAsyncOptions): Provider[] {
  const asyncOptionsProvider = createAsyncOptionsProvider(options);
  if (options.useExisting || options.useFactory) {
    return [asyncOptionsProvider];
  }
  return [
    asyncOptionsProvider,
    {
      provide: options.useClass,
      useClass: options.useClass,
    } as ClassProvider,
  ];
}
