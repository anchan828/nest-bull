import { Logger } from '@nestjs/common';
import * as Bull from 'bull';
import * as deepmerge from 'deepmerge';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { BullConstants } from './bull.constants';
import {
  BullModuleOptions,
  BullQueue,
  BullQueueOptions,
  BullQueueProcessorOptions,
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

function createProcessorOptions(
  target: object,
  propertyKey: string,
  processorOptions: BullQueueProcessorOptions,
): BullQueueProcessorOptions {
  return deepmerge.all([
    { name: propertyKey, concurrency: 1 },
    processorOptions === BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR
      ? {}
      : processorOptions,
  ]) as BullQueueProcessorOptions;
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
        const metadataKeys = Reflect.getOwnMetadataKeys(target);

        const propertyKeys = Reflect.ownKeys(target).filter(
          key => key !== 'constructor',
        ) as string[];

        const processors = propertyKeys
          .map(propertyKey => {
            return {
              propertyKey,
              metadata: Reflect.getMetadata(
                BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR,
                target,
                propertyKey,
              ) as BullQueueProcessorOptions,
            };
          })
          .filter(o => {
            return o.metadata !== null && o.metadata !== undefined;
          });

        if (
          metadataKeys.indexOf(BullConstants.BULL_QUEUE_DECORATOR) === -1 ||
          processors.length === 0
        ) {
          continue;
        }

        const queue = createQueue(
          target,
          queueClassName,
          bullModuleOptions.options,
        );

        let isDefinedDefaultHandler: boolean = false;

        for (const processor of processors) {
          const processorOptions = createProcessorOptions(
            target,
            processor.propertyKey,
            processor.metadata,
          );

          queue.process(
            processorOptions.name,
            processorOptions.concurrency,
            target[processor.propertyKey],
          );

          if (!isDefinedDefaultHandler) {
            queue.process(
              processorOptions.concurrency,
              target[processor.propertyKey],
            );
            isDefinedDefaultHandler = true;
          }

          Logger.log(
            `${processorOptions.name} (${queue.name}) initialized`,
            BullConstants.BULL_MODULE,
            true,
          );
        }

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
