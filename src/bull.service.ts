import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { Job, Queue } from 'bull';
import * as deepmerge from 'deepmerge';
import { Redis } from 'ioredis';
import { BullConstants } from './bull.constants';
import {
  BullModuleOptions,
  BullQueue,
  BullQueueExtraOptions,
  BullQueueOptions,
  BullQueueProcessorOptions,
} from './bull.interfaces';
import { getBullQueueToken } from './bull.utils';

@Injectable()
export class BullService {
  constructor(
    @Inject(BullConstants.BULL_MODULE_OPTIONS)
    private bullModuleOptions: BullModuleOptions,
    private moduleRef: ModuleRef,
  ) {}

  public setupQueues() {
    const components: any[][] = this.getModules().map(module =>
      this.getComponents(module),
    );

    const bullQueueComponents = this.getBullQueueComponents(components);

    const bullQueueData = this.getBullQueueData(bullQueueComponents);

    for (const { target, queueName, propertyKeys, extra } of bullQueueData) {
      const providers = this.getBullQueueProviders(components, queueName);

      for (const provider of providers) {
        const queue = provider.instance as BullQueue;
        this.assignEvents(
          target,
          this.getEvents(target, propertyKeys),
          queue,
          extra,
        );
        this.assignProcessors(
          target,
          this.getProcessors(target, propertyKeys),
          queue,
          extra,
        );
      }
    }
  }

  public async teardownQueues() {
    const components: any[][] = this.getModules().map(module =>
      this.getComponents(module),
    );

    const bullQueueComponents = this.getBullQueueComponents(components);
    const bullQueueData = this.getBullQueueData(bullQueueComponents);
    for (const { queueName } of bullQueueData) {
      const providers = this.getBullQueueProviders(components, queueName);

      for (const provider of providers) {
        const queue = provider.instance as Queue;
        await queue.close();
      }
    }
  }
  private assignEvents(
    target: object,
    events: { propertyKey: string; metadata: any }[],
    queue: BullQueue,
    extra: BullQueueExtraOptions,
  ) {
    for (const event of events) {
      for (const eventName of event.metadata) {
        queue.on(eventName, target[event.propertyKey].bind(target));
        Logger.log(
          `${eventName} listener on ${queue.name} initialized`,
          BullConstants.BULL_MODULE,
          true,
        );
      }
    }

    const setExpire = async (job: Job, expire: number) => {
      try {
        // @ts-ignore
        // const jobKey = `${queue.keyPrefix}:${queue.name}:${job.id}`;
        const jobKey = `${job.toKey()}${job.id}`;
        // @ts-ignore
        const client: Redis = job.queue.clients[0];
        await client.expire(jobKey, expire);
      } catch (e) {
        Logger.error(e.message, e.stack, BullConstants.BULL_MODULE, true);
      }
    };

    if (extra.defaultJobOptions.setTTLOnComplete > -1) {
      queue.on('completed', (job: Job) =>
        setExpire(job, extra.defaultJobOptions.setTTLOnComplete),
      );
    }

    if (extra.defaultJobOptions.setTTLOnFail > -1) {
      queue.on('failed', (job: Job) =>
        setExpire(job, extra.defaultJobOptions.setTTLOnFail),
      );
    }
  }

  private assignProcessors(
    target: object,
    processors: { propertyKey: string; metadata: any }[],
    queue: BullQueue,
    extra: BullQueueExtraOptions,
  ): void {
    if (processors.length === 0) {
      return;
    }

    let isDefinedDefaultHandler: boolean = false;
    const handlers =
      Reflect.getMetadata(BullConstants.BULL_QUEUE_HANDLER_NAMES, queue) || [];
    for (const processor of processors) {
      const processorOptions = this.createProcessorOptions(
        processor.propertyKey,
        processor.metadata,
        extra,
      );

      if (handlers.indexOf(processorOptions.name) === -1) {
        queue.process(
          processorOptions.name,
          processorOptions.concurrency,
          target[processor.propertyKey].bind(target),
        );
        handlers.push(processorOptions.name);
      }

      if (
        !isDefinedDefaultHandler &&
        handlers.indexOf(BullConstants.BULL_QUEUE_HANDLER_NAMES) === -1
      ) {
        queue.process(
          processorOptions.concurrency,
          target[processor.propertyKey].bind(target),
        );
        isDefinedDefaultHandler = true;
        handlers.push(BullConstants.BULL_QUEUE_HANDLER_NAMES);
      }

      Logger.log(
        `${processorOptions.name} processor on ${queue.name} initialized`,
        BullConstants.BULL_MODULE,
        true,
      );
    }

    Reflect.defineMetadata(
      BullConstants.BULL_QUEUE_HANDLER_NAMES,
      handlers,
      queue,
    );
  }

  private getBullQueueData(
    bullQueueComponents: any[],
  ): {
    target: any;
    queueName: string;
    propertyKeys: string[];
    extra: BullQueueExtraOptions;
  }[] {
    return bullQueueComponents.map(bullQueueComponent => {
      const target = bullQueueComponent.instance;
      const queueName = this.createBullQueueName(
        target,
        bullQueueComponent.name,
      );
      const propertyKeys = Object.getOwnPropertyNames(
        bullQueueComponent.metatype.prototype,
      ).filter(key => key !== 'constructor') as string[];

      const queueMetadata: BullQueueOptions = Reflect.getMetadata(
        BullConstants.BULL_QUEUE_DECORATOR,
        target,
      );

      const extra: BullQueueExtraOptions = deepmerge.all([
        {
          defaultProcessorOptions: {},
          defaultJobOptions: {},
        },
        queueMetadata.extra || {},
        this.bullModuleOptions.extra || {},
      ]);

      return { target, queueName, propertyKeys, extra };
    });
  }

  private getModulesContainer(): ModulesContainer {
    // @ts-ignore
    let modulesContainer = this.moduleRef.container.modulesContainer;
    // @ts-ignore
    if (this.moduleRef.container.getModules) {
      // @ts-ignore
      modulesContainer = this.moduleRef.container.getModules();
    }
    return modulesContainer;
  }

  private getModules() {
    return Array.from(Map.prototype.values.apply(this.getModulesContainer()));
  }

  private getComponents(module: any): any[] {
    return Array.from(Map.prototype.values.apply(module.components));
  }

  private getBullQueueProviders(components: any[][], queueName: string): any[] {
    const flatComponents = [].concat.apply([], components);
    return flatComponents
      .filter(
        component =>
          component &&
          component.instance !== undefined &&
          component.instance !== null &&
          typeof component.instance !== 'string',
      )
      .filter(component => {
        return component.name === getBullQueueToken(queueName);
      });
  }

  private getBullQueueComponents(components: any[][]): any[] {
    const flatComponents = [].concat.apply([], components);

    return flatComponents
      .filter(
        component =>
          component &&
          component.instance !== undefined &&
          component.instance !== null &&
          typeof component.instance !== 'string',
      )
      .filter(component => {
        const metadataKeys = Reflect.getMetadataKeys(component.instance);
        return metadataKeys.indexOf(BullConstants.BULL_QUEUE_DECORATOR) !== -1;
      });
  }

  private createBullQueueName(target: any, className: string) {
    const queueMetadata: BullQueueOptions = Reflect.getMetadata(
      BullConstants.BULL_QUEUE_DECORATOR,
      target,
    );

    return queueMetadata.name || className;
  }

  private createProcessorOptions(
    propertyKey: string,
    processorOptions: BullQueueProcessorOptions,
    extra: BullQueueExtraOptions,
  ): BullQueueProcessorOptions {
    return deepmerge.all([
      { name: propertyKey, concurrency: BullConstants.DEFAULT_CONCURRENCY },
      {
        concurrency:
          extra.defaultProcessorOptions.concurrency ||
          BullConstants.DEFAULT_CONCURRENCY,
      },
      processorOptions === BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR
        ? {}
        : processorOptions,
    ]) as BullQueueProcessorOptions;
  }

  private getEvents(
    target: any,
    propertyKeys: string[],
  ): { propertyKey: string; metadata: any }[] {
    return propertyKeys
      .map(propertyKey => {
        return {
          propertyKey,
          metadata: Reflect.getMetadata(
            BullConstants.BULL_QUEUE_EVENT_DECORATOR,
            target,
            propertyKey,
          ) as BullQueueProcessorOptions,
        };
      })
      .filter(o => {
        return o.metadata !== null && o.metadata !== undefined;
      });
  }

  private getProcessors(
    target: any,
    propertyKeys: string[],
  ): { propertyKey: string; metadata: any }[] {
    return propertyKeys
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
  }
}
