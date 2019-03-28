import {
  Inject,
  Injectable as InjectableDecorator,
  Logger,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common/interfaces';
import { ModulesContainer } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import * as deepmerge from 'deepmerge';
import {
  BULL_MODULE,
  BULL_MODULE_OPTIONS,
  BULL_QUEUE_DEFAULT_PROCESSOR_NAME,
  BULL_QUEUE_PROCESSOR_DECORATOR,
  BULL_QUEUE_PROCESSOR_DEFAULT_CONCURRENCY,
} from '../../bull.constants';
import {
  BullModuleOptions,
  BullQueue,
  BullQueueProcessorOptions,
} from '../../bull.interfaces';
import { BaseExplorerService } from './base-explorer.service';

@InjectableDecorator()
export class BullQueueProcessorExplorerService extends BaseExplorerService<
  BullQueueProcessorOptions
> {
  private getExtraProcessorOptions() {
    if (this.options.extra && this.options.extra.defaultProcessorOptions) {
      return this.options.extra.defaultProcessorOptions;
    }
  }
  protected getOptions(
    prototype: any,
    propertyName: string,
  ): BullQueueProcessorOptions {
    return deepmerge.all([
      {
        name: propertyName,
        concurrency: BULL_QUEUE_PROCESSOR_DEFAULT_CONCURRENCY,
      },
      this.getExtraProcessorOptions() || {},
      Reflect.getMetadata(
        BULL_QUEUE_PROCESSOR_DECORATOR,
        prototype,
        propertyName,
      ) || {},
    ]) as BullQueueProcessorOptions;
  }
  protected onBullQueuePropertyProcess(
    bullQueue: BullQueue,
    instance: Injectable,
    prototype: any,
    propertyName: string,
    allPropertyNames: string[],
  ): void {
    const processorOptions = this.getOptions(prototype, propertyName);

    if (allPropertyNames.length === 1) {
      processorOptions.name = BULL_QUEUE_DEFAULT_PROCESSOR_NAME;
    }

    bullQueue.process(
      processorOptions.name!,
      processorOptions.concurrency!,
      prototype[propertyName].bind(instance),
    );
    Logger.log(
      `${processorOptions.name} processor on ${bullQueue.name} initialized`,
      BULL_MODULE,
      true,
    );
  }
  protected verifyPropertyName(target: any, propertyName: string): boolean {
    return Reflect.hasMetadata(
      BULL_QUEUE_PROCESSOR_DECORATOR,
      target,
      propertyName,
    );
  }
  constructor(
    @Inject(BULL_MODULE_OPTIONS)
    readonly options: BullModuleOptions,
    readonly modulesContainer: ModulesContainer,
    readonly metadataScanner: MetadataScanner,
  ) {
    super(options, modulesContainer, metadataScanner);
  }
}
