import * as glob from 'fast-glob';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative, resolve } from 'path';
import { ulid } from 'ulid';
import { getBullQueueToken } from './bull.utils';
export const tmpWorkspaceDir = resolve(tmpdir(), 'nest-bull');
export const cleanTestFiles = () => {
  const unlinkFiles = () =>
    glob.sync(`${tmpWorkspaceDir}/*.ts`).map(entry => {
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
  const bullDecortatorPath = relative(
    filePath,
    resolve('src', 'bull.decorator'),
  );
  const modeModulesPath = relative(filePath, 'node_modules');
  writeFileSync(
    filePath,
    [
      `import { Module } from '${modeModulesPath}/@nestjs/common';`,
      `import { BullQueue, BullQueueProcess, BullQueueEventError, BullQueueEventWaiting, BullQueueEventActive, BullQueueEventStalled, BullQueueEventProgress, BullQueueEventCompleted, BullQueueEventFailed, BullQueueEventPaused, BullQueueEventResumed, BullQueueEventCleaned, BullQueueEventDrained, BullQueueEventRemoved, BullQueueEventGlobalError, BullQueueEventGlobalWaiting, BullQueueEventGlobalActive, BullQueueEventGlobalStalled, BullQueueEventGlobalProgress, BullQueueEventGlobalCompleted, BullQueueEventGlobalFailed, BullQueueEventGlobalPaused, BullQueueEventGlobalResumed, BullQueueEventGlobalCleaned, BullQueueEventGlobalDrained, BullQueueEventGlobalRemoved } from '${bullDecortatorPath}';`,
      classText.join('\n'),
    ].join('\n'),
  );

  require(filePath);

  return filePath;
};
describe('BullUtil', () => {
  describe('getBullQueueToken', () => {
    it('should return queue token', () => {
      expect(getBullQueueToken('test')).toBe('_BullQueue_test');
    });
  });
});
