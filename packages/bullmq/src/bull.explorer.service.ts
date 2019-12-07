import { Injectable } from "@nestjs/common";
import { Injectable as InjectableMeta } from "@nestjs/common/interfaces";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";
import { ModulesContainer } from "@nestjs/core/injector/modules-container";
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
  constructor(private readonly modulesContainer: ModulesContainer, private readonly metadataScanner: MetadataScanner) {}

  public explore(): BullExploreResults {
    const modules = [...this.modulesContainer.values()];
    const queues = this.getMetadata<BullQueueMetadata>(modules, BULL_QUEUE_DECORATOR);
    const workers = this.getMetadata<BullWorkerMetadata>(modules, BULL_WORKER_DECORATOR);
    const queueEvents = this.getMetadata<BullQueueEventsMetadata>(modules, BULL_QUEUE_EVENTS_DECORATOR);

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

  private getMetadata<T extends BullQueueBaseMetadata<any>>(modules: Module[], metadataKey: string): T[] {
    const metadata: T[] = [];
    for (const classInstanceWrapper of this.getClassInstanceWrappers(modules)) {
      const options = Reflect.getMetadata(metadataKey, classInstanceWrapper.instance.constructor);

      if (options) {
        metadata.push({ instance: classInstanceWrapper.instance, options } as T);
      }
    }
    return metadata;
  }

  private getWorkers(modules: Module[]): BullWorkerMetadata[] {
    const workers: BullWorkerMetadata[] = [];
    for (const classInstanceWrapper of this.getClassInstanceWrappers(modules)) {
      const options = Reflect.getMetadata(BULL_WORKER_DECORATOR, classInstanceWrapper.instance.constructor);

      if (options) {
        workers.push({ instance: classInstanceWrapper.instance, options, processors: [], events: [] });
      }
    }
    return workers;
  }

  private getQueueEvents(modules: Module[]): BullQueueEventsMetadata[] {
    const queueEvents: BullQueueEventsMetadata[] = [];
    for (const classInstanceWrapper of this.getClassInstanceWrappers(modules)) {
      const options = Reflect.getMetadata(BULL_QUEUE_EVENTS_DECORATOR, classInstanceWrapper.instance.constructor);

      if (options) {
        queueEvents.push({ instance: classInstanceWrapper.instance, options, events: [] });
      }
    }
    return queueEvents;
  }

  private getClassInstanceWrappers(modules: Module[]): InstanceWrapper<InjectableMeta>[] {
    const instanceWrappers = modules.map(module => [...module.providers.values()]).reduce((a, b) => a.concat(b), []);
    return instanceWrappers
      .filter(instanceWrapper => instanceWrapper.instance)
      .filter(({ instance }) => instance.constructor);
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
