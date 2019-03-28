import { Injectable as InjectableDecorator } from '@nestjs/common';
import { Injectable } from '@nestjs/common/interfaces';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { getBullQueueToken } from '../..';
import { BullCoreModule } from '../../bull-core.module';
import { BullQueue } from '../../bull.interfaces';
@InjectableDecorator()
export class BullQueueExplorerService {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  public getInjectedBullQueues(): BullQueue[] {
    return [
      ...[...this.modulesContainer.values()]
        .find(m => m.metatype === BullCoreModule)!
        .providers.values(),
    ]
      .filter((entry: InstanceWrapper<Injectable>) => entry.metatype === null)
      .filter(
        (entry: InstanceWrapper<any>) =>
          entry.name === getBullQueueToken(entry.instance.name),
      )
      .map((entry: InstanceWrapper<Injectable>) => entry.instance as BullQueue);
  }
}
