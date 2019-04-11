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
  BULL_QUEUE_EVENT_DECORATOR,
} from '../../bull.constants';
import {
  BullModuleOptions,
  BullQueue,
  BullQueueEventOptions,
} from '../../bull.interfaces';
import { BaseExplorerService } from './base-explorer.service';

@InjectableDecorator()
export class BullQueueEventExplorerService extends BaseExplorerService<
  BullQueueEventOptions
> {
  protected onBullQueuePropertyProcess(
    bullQueue: BullQueue,
    instance: Injectable,
    prototype: any,
    propertyName: string,
  ): void {
    const options = this.getOptions(prototype, propertyName);
    options.eventNames.forEach(eventName => {
      bullQueue.on(eventName, prototype[propertyName].bind(instance));
      Logger.log(
        `${eventName} listener on ${bullQueue.name} initialized`,
        BULL_MODULE,
        true,
      );
    });
  }
  protected verifyPropertyName(target: any, propertyName: string): boolean {
    return Reflect.hasMetadata(
      BULL_QUEUE_EVENT_DECORATOR,
      target,
      propertyName,
    );
  }
  protected getOptions(
    prototype: any,
    propertyName: string,
  ): BullQueueEventOptions {
    return deepmerge(
      { eventNames: [] },
      Reflect.getMetadata(BULL_QUEUE_EVENT_DECORATOR, prototype, propertyName),
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
