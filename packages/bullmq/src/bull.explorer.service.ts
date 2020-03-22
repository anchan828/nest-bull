import { Injectable } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import {
  BULL_QUEUE_DECORATOR,
  BULL_QUEUE_EVENTS_DECORATOR,
  BULL_QUEUE_EVENTS_PROCESSOR_DECORATOR,
  BULL_WORKER_DECORATOR,
  BULL_WORKER_PROCESSOR_DECORATOR,
} from "./bull.constants";
import {
  BullExploreResults,
  BullQueueEventsMetadata,
  BullQueueEventsProcessMetadata,
  BullQueueMetadata,
  BullWorkerMetadata,
  BullWorkerProcessMetadata,
} from "./interfaces";
import { BullQueueBaseMetadata } from "./interfaces/bull-base.interface";
@Injectable()
export class BullExplorerService {
  constructor(private readonly discoveryService: DiscoveryService, private readonly metadataScanner: MetadataScanner) {}

  public explore(): BullExploreResults {
    const queues = this.getMetadata<BullQueueMetadata>(BULL_QUEUE_DECORATOR);
    const workers = this.getMetadata<BullWorkerMetadata>(BULL_WORKER_DECORATOR);
    const queueEvents = this.getMetadata<BullQueueEventsMetadata>(BULL_QUEUE_EVENTS_DECORATOR);

    for (const queue of queues) {
      queue.events = this.getQueueEventProcessors(queue);
    }

    for (const worker of workers) {
      worker.processors = this.getWorkerProcessors(worker);
      worker.events = this.getQueueEventProcessors(worker);
    }

    for (const queueEvent of queueEvents) {
      queueEvent.events = this.getQueueEventProcessors(queueEvent);
    }

    return { workers, queueEvents, queues };
  }

  private getMetadata<T extends BullQueueBaseMetadata<any>>(metadataKey: string): T[] {
    const metadata: T[] = [];
    for (const classInstance of this.getClassInstances()) {
      const options = Reflect.getMetadata(metadataKey, classInstance.constructor);

      if (options) {
        metadata.push({ instance: classInstance, options } as T);
      }
    }
    return metadata;
  }

  private getClassInstances(): InstanceWrapper<any>[] {
    return this.discoveryService
      .getProviders()
      .filter((instanceWrapper) => instanceWrapper.instance?.constructor)
      .map((x) => x.instance);
  }

  private getWorkerProcessors(worker: BullWorkerMetadata): BullWorkerProcessMetadata[] {
    const instance = worker.instance;
    const prototype = Object.getPrototypeOf(instance);
    const workerProcessors: BullWorkerProcessMetadata[] = [];

    for (const methodName of this.metadataScanner.getAllFilteredMethodNames(prototype)) {
      const options = Reflect.getMetadata(BULL_WORKER_PROCESSOR_DECORATOR, prototype[methodName]);
      workerProcessors.push({ processor: prototype[methodName].bind(instance), options });
    }

    return workerProcessors;
  }

  private getQueueEventProcessors<T extends BullQueueBaseMetadata<any>>(metadata: T): BullQueueEventsProcessMetadata[] {
    const instance = metadata.instance;
    const prototype = Object.getPrototypeOf(instance);
    const queueEventsProcessors: BullQueueEventsProcessMetadata[] = [];

    for (const methodName of this.metadataScanner.getAllFilteredMethodNames(prototype)) {
      const type = Reflect.getMetadata(BULL_QUEUE_EVENTS_PROCESSOR_DECORATOR, prototype[methodName]);
      queueEventsProcessors.push({ processor: prototype[methodName].bind(instance), type });
    }

    return queueEventsProcessors;
  }
}
