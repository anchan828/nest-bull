import { Logger } from '@nestjs/common';
import * as Bull from 'bull';
import * as deepmerge from 'deepmerge';
import * as glob from 'glob';
import * as path from 'path';
import { BullConstants } from './bull.constants';
import {
  BullModuleOptions,
  BullQueue,
  BullQueueOptions,
} from './bull.interfaces';

function loadClasses(filePaths: string[]): any[] {
  return filePaths.map(filePath => require(path.relative(__dirname, filePath)));
}

function createQueue(
  target: object,
  queueClassName: string,
  bullQueueOptions: Partial<Bull.QueueOptions>,
): BullQueue {
  const queueMetadata: BullQueueOptions = Reflect.getMetadata(
    BullConstants.BULL_QUEUE_DECORATOR,
    target,
  );

  const queueName = queueMetadata.name || queueClassName;

  const queueOptions: Bull.QueueOptions = deepmerge.all([
    bullQueueOptions || {},
    queueMetadata.options || {},
  ]);

  return new Bull(queueName, queueOptions) as BullQueue;
}

export function createQueues(
  bullModuleOptions: BullModuleOptions,
): BullQueue[] {
  const queues: BullQueue[] = [];

  if (!(bullModuleOptions && bullModuleOptions.queues)) {
    Logger.warn('options invalid', BullConstants.BULL_MODULE, true);
    return queues;
  }

  for (const queueFilePath of bullModuleOptions.queues) {
    const loadedClasses = loadClasses(glob.sync(queueFilePath));

    for (const loadedClass of loadedClasses) {
      for (const queueClassName of Object.keys(loadedClass)) {
        const queueClass = loadedClass[queueClassName];

        const target = queueClass.prototype;

        const queue = createQueue(
          target,
          queueClassName,
          bullModuleOptions.options,
        );

        queues.push(queue);
        queue.isReady().then(() => {
          Logger.log(
            `${queue.name} queue initialized`,
            BullConstants.BULL_MODULE,
            true,
          );
        });
      }
    }
  }
  return queues;
}
