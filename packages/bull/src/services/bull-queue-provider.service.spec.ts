import { Test } from "@nestjs/testing";
import { BULL_MODULE_OPTIONS } from "../bull.constants";
import { BullQueue } from "../bull.decorator";
import { BullModuleOptions } from "../bull.interfaces";
import { getBullQueueToken } from "../bull.utils";
import { cleanTestFiles, createTestFile, tmpWorkspaceDir } from "../bull.utils.spec";
import { BullQueueProviderService } from "./bull-queue-provider.service";
import { BullService } from "./bull.service";
describe("BullQueueProviderService", () => {
  const compileService = async (options: BullModuleOptions): Promise<BullQueueProviderService> => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: BULL_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    }).compile();

    expect(app.get<BullModuleOptions>(BULL_MODULE_OPTIONS)).toStrictEqual(options);
    await app.close();
    return new BullQueueProviderService(options, new BullService());
  };

  it("should be defined", async () => {
    expect(BullQueueProviderService).toBeDefined();
  });

  describe("createBullQueueProviders", () => {
    beforeEach(() => {
      cleanTestFiles();
    });

    it("should get Test class", async () => {
      @BullQueue()
      class Test {}

      const service = await compileService({
        queues: [Test],
      });
      const providers = service.createBullQueueProviders();
      expect(providers).toHaveLength(1);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("Test"),
          useValue: {
            name: "Test",
          },
        },
      ]);
    });
    it("should get HasBullQueueDecorator class only", async () => {
      @BullQueue()
      class HasBullQueueDecorator {}

      class Test {}

      const service = await compileService({
        queues: [HasBullQueueDecorator, Test],
      });
      const providers = service.createBullQueueProviders();
      expect(providers).toHaveLength(1);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("HasBullQueueDecorator"),
          useValue: {
            name: "HasBullQueueDecorator",
          },
        },
      ]);
    });
    it("should get Test class by file path", async () => {
      const filePath = createTestFile(["@BullQueue()", `export class Test {}`].join("\n"));

      const service = await compileService({ queues: [filePath] });
      const providers = service.createBullQueueProviders();
      expect(providers).toHaveLength(1);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("Test"),
          useValue: {
            name: "Test",
          },
        },
      ]);
    });
    it("should get Test1 class only by file path", async () => {
      const filePath = createTestFile(
        ["@BullQueue()", `export class Test1 {}`].join("\n"),
        [`export class Test2 {}`].join("\n"),
      );

      const service = await compileService({
        queues: [filePath],
      });
      const providers = service.createBullQueueProviders();
      expect(providers).toHaveLength(1);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("Test1"),
          useValue: {
            name: "Test1",
          },
        },
      ]);
    });
    it("should get Test1 and Test2 class by file path", async () => {
      const filePath = createTestFile(
        ["@BullQueue()", `export class Test1 {}`].join("\n"),
        ["@BullQueue()", `export class Test2 {}`].join("\n"),
      );

      const service = await compileService({
        queues: [filePath],
      });
      const providers = service.createBullQueueProviders();
      expect(providers).toHaveLength(2);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("Test1"),
          useValue: {
            name: "Test1",
          },
        },
        {
          provide: getBullQueueToken("Test2"),
          useValue: {
            name: "Test2",
          },
        },
      ]);
    });
    it("should get Test1 and Test2 class by file paths", async () => {
      const filePath1 = createTestFile(["@BullQueue()", `export class Test1 {}`].join("\n"));
      const filePath2 = createTestFile(["@BullQueue()", `export class Test2 {}`].join("\n"));

      const service = await compileService({
        queues: [filePath1, filePath2],
      });
      const providers = service.createBullQueueProviders();
      expect(providers).toHaveLength(2);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("Test1"),
          useValue: {
            name: "Test1",
          },
        },
        {
          provide: getBullQueueToken("Test2"),
          useValue: {
            name: "Test2",
          },
        },
      ]);
    });
    it("should get Test1 and Test2 class by file glob path", async () => {
      createTestFile(["@BullQueue()", `export class Test1 {}`].join("\n"));
      createTestFile(["@BullQueue()", `export class Test2 {}`].join("\n"));

      const service = await compileService({
        queues: [`${tmpWorkspaceDir}/*.ts`],
      });
      const providers = service
        .createBullQueueProviders()
        .sort((x, y) => (x.provide as string).localeCompare(y.provide as string));

      expect(providers).toHaveLength(2);
      expect(providers).toMatchObject([
        {
          provide: getBullQueueToken("Test1"),
          useValue: {
            name: "Test1",
          },
        },
        {
          provide: getBullQueueToken("Test2"),
          useValue: {
            name: "Test2",
          },
        },
      ]);
    });
  });
});
