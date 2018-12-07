import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as deepmerge from 'deepmerge';
import { BullConstants } from './bull.constants';
import {
  BullModuleOptions,
  BullQueueOptions,
  BullQueueProcessorOptions,
} from './bull.interfaces';
import {getBullQueueToken} from './bull.utils';

@Injectable()
export class BullService {
  constructor(
    @Inject(BullConstants.BULL_MODULE_OPTIONS)
    private bullModuleOptions: BullModuleOptions,
    private moduleRef: ModuleRef,
  ) {}

  public assignProcessors() {
    const modules = this.getModules();

    for (const module of modules) {
      const allComponentInModule = this.getComponents(module);
      const bullQueueComponents = this.getBullQueueComponents(
        allComponentInModule,
      );

      for (const bullQueueComponent of bullQueueComponents) {
        const name = bullQueueComponent.name;
        const target = bullQueueComponent.instance;
        const queueName = this.createBullQueueName(target, name);

        for (const _module of modules) {
          const queueProviders = this.getBullQueueProviders(
            this.getComponents(_module),
            queueName,
          );
          for (const queueProvider of queueProviders) {
            const propertyKeys = Object.getOwnPropertyNames(
              bullQueueComponent.metatype.prototype,
            ).filter(key => key !== 'constructor') as string[];

            const processors = this.getProcessors(target, propertyKeys);

            if (processors.length === 0) {
              continue;
            }

            const queue = queueProvider.instance;
            let isDefinedDefaultHandler: boolean = false;

            for (const processor of processors) {
              const processorOptions = this.createProcessorOptions(
                processor.propertyKey,
                processor.metadata,
              );

              queue.process(
                processorOptions.name,
                processorOptions.concurrency,
                target[processor.propertyKey].bind(target),
              );

              if (!isDefinedDefaultHandler) {
                queue.process(
                  processorOptions.concurrency,
                  target[processor.propertyKey].bind(target),
                );
                isDefinedDefaultHandler = true;
              }

              Logger.log(
                `${processorOptions.name} (${queue.name}) initialized`,
                BullConstants.BULL_MODULE,
                true,
              );
            }
          }
        }
      }
    }
  }

  private getModules() {
    // @ts-ignore
    const modulesContainer = this.moduleRef.container.modulesContainer;
    return Array.from(Map.prototype.values.apply(modulesContainer));
  }

  private getComponents(module: any): any[] {
    return Array.from(Map.prototype.values.apply(module.components));
  }

  private getBullQueueProviders(components: any[], queueName: string): any[] {
    return components
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

  private getBullQueueComponents(components: any[]): any[] {
    return components
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
  ): BullQueueProcessorOptions {
    return deepmerge.all([
      { name: propertyKey, concurrency: 1 },
      processorOptions === BullConstants.BULL_QUEUE_PROCESSOR_DECORATOR
        ? {}
        : processorOptions,
    ]) as BullQueueProcessorOptions;
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
