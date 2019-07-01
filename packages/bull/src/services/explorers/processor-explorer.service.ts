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
  BULL_MODULE_SERVICE,
  BULL_QUEUE_DEFAULT_PROCESSOR_NAME,
  BULL_QUEUE_PROCESSOR_DECORATOR,
  BULL_QUEUE_PROCESSOR_DEFAULT_CONCURRENCY,
} from '../../bull.constants';
import {
  BullModuleOptions,
  BullQueue,
  BullQueueProcessorOptions,
} from '../../bull.interfaces';
import { BullService } from '../bull.service';
import { BaseExplorerService } from './base-explorer.service';

@InjectableDecorator()
export class BullQueueProcessorExplorerService extends BaseExplorerService<
  BullQueueProcessorOptions
> {
  private readonly logger = new Logger(BULL_MODULE, true);
  private getExtraProcessorOptions() {
    if (this.options.extra && this.options.extra.defaultProcessorOptions) {
      return this.options.extra.defaultProcessorOptions;
    }
  }
  protected getOptions(
    prototype: any,
    propertyName: string,
  ): BullQueueProcessorOptions {
    const options = Reflect.getMetadata(
      BULL_QUEUE_PROCESSOR_DECORATOR,
      prototype,
      propertyName,
    ) as BullQueueProcessorOptions;

    return deepmerge.all([
      {
        name: propertyName,
        concurrency: BULL_QUEUE_PROCESSOR_DEFAULT_CONCURRENCY,
        isCustomProcessorName: options && options.name,
        skip: options && options.skip,
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

    if (processorOptions.skip) {
      return;
    }

    const processorName =
      allPropertyNames.length === 1 && !processorOptions.isCustomProcessorName
        ? BULL_QUEUE_DEFAULT_PROCESSOR_NAME
        : processorOptions.name!;

    bullQueue.process(
      processorName,
      processorOptions.concurrency!,
      prototype[propertyName].bind(instance),
    );

    this.logger.log(
      `${processorOptions.name} processor on ${bullQueue.name} initialized`,
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
    @Inject(BULL_MODULE_SERVICE)
    readonly bullService: BullService,
    readonly modulesContainer: ModulesContainer,
    readonly metadataScanner: MetadataScanner,
  ) {
    super(options, bullService, modulesContainer, metadataScanner);
  }
}
