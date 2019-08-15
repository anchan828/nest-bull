import * as glob from "fast-glob";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { ulid } from "ulid";
import { getBullQueueToken } from "./bull.utils";

export const REDIS_HOST = process.env.REDIS_HOST || "localhost";

export const tmpWorkspaceDir = resolve(tmpdir(), "nest-bull");
export const cleanTestFiles = (): void => {
  const unlinkFiles = (): void =>
    glob.sync(`${tmpWorkspaceDir}/*.ts`).forEach(entry => {
      unlinkSync(entry.toString());
    });

  beforeEach(() => {
    if (!existsSync(tmpWorkspaceDir)) {
      mkdirSync(tmpWorkspaceDir);
    }
    unlinkFiles();
  });

  afterEach(() => {
    unlinkFiles();
  });
};
export const createTestFile = (...classText: string[]): string => {
  const filePath = join(tmpWorkspaceDir, `${ulid()}.ts`);
  const bullDecoratorPath = __dirname + "/bull.decorator";
  const nodeModulesPath = __dirname + "/../../../node_modules";
  writeFileSync(
    filePath,
    [
      `import { Module } from '${nodeModulesPath}/@nestjs/common';`,
      // tslint:disable-next-line: max-line-length
      `import { BullQueue, BullQueueProcess, BullQueueEventError, BullQueueEventWaiting, BullQueueEventActive, BullQueueEventStalled, BullQueueEventProgress, BullQueueEventCompleted, BullQueueEventFailed, BullQueueEventPaused, BullQueueEventResumed, BullQueueEventCleaned, BullQueueEventDrained, BullQueueEventRemoved, BullQueueEventGlobalError, BullQueueEventGlobalWaiting, BullQueueEventGlobalActive, BullQueueEventGlobalStalled, BullQueueEventGlobalProgress, BullQueueEventGlobalCompleted, BullQueueEventGlobalFailed, BullQueueEventGlobalPaused, BullQueueEventGlobalResumed, BullQueueEventGlobalCleaned, BullQueueEventGlobalDrained, BullQueueEventGlobalRemoved } from '${bullDecoratorPath}';`,
      classText.join("\n"),
    ].join("\n"),
  );

  require(filePath);

  return filePath;
};
export const wait = async (timer: number): Promise<void> =>
  await new Promise(
    (resolve): NodeJS.Timeout =>
      setTimeout((): void => {
        resolve();
      }, timer),
  );

describe("BullUtil", () => {
  describe("getBullQueueToken", () => {
    it("should return queue token", () => {
      expect(getBullQueueToken("test")).toBe("_BullQueue_test");
    });
  });
});
