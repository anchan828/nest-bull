import { BULL_MODULE_OPTIONS } from "./bull.constants";
import { createAsyncOptionsProvider, createAsyncProviders, createQueueEvents } from "./bull.providers";
import { BullModuleOptions, BullModuleOptionsFactory } from "./interfaces";

describe("createQueueEvents", () => {
  it("should create mock object", () => {
    expect(createQueueEvents("test", {}, true)).toStrictEqual({ on: expect.any(Function) });
  });
});

describe("createAsyncOptionsProvider", () => {
  it("should create factory provider: useFactory", () => {
    expect(createAsyncOptionsProvider({ useFactory: () => ({}) })).toStrictEqual({
      inject: [],
      provide: BULL_MODULE_OPTIONS,
      useFactory: expect.any(Function),
    });
  });

  it("should create factory provider: useClass", async () => {
    class TestClass implements BullModuleOptionsFactory {
      createBullModuleOptions(): BullModuleOptions {
        return {};
      }
    }
    const provider = createAsyncOptionsProvider({ useClass: TestClass });

    expect(provider).toStrictEqual({
      inject: [expect.any(Function)],
      provide: BULL_MODULE_OPTIONS,
      useFactory: expect.any(Function),
    });

    await provider.useFactory(new TestClass());
  });

  it("should create factory provider: useExisting", async () => {
    class TestClass implements BullModuleOptionsFactory {
      createBullModuleOptions(): BullModuleOptions {
        return {};
      }
    }
    const provider = createAsyncOptionsProvider({ useExisting: TestClass });

    expect(provider).toStrictEqual({
      inject: [expect.any(Function)],
      provide: BULL_MODULE_OPTIONS,
      useFactory: expect.any(Function),
    });

    await provider.useFactory(new TestClass());
  });
});

describe("createAsyncProviders", () => {
  it("should get providers", () => {
    class TestClass implements BullModuleOptionsFactory {
      createBullModuleOptions(): BullModuleOptions {
        return {};
      }
    }
    expect(createAsyncProviders({ useClass: TestClass })).toStrictEqual([
      { inject: [TestClass], provide: BULL_MODULE_OPTIONS, useFactory: expect.any(Function) },
      { provide: TestClass, useClass: TestClass },
    ]);
  });
});
