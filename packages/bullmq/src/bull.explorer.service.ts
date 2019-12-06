import { Injectable } from "@nestjs/common";
import { Module } from "@nestjs/core/injector/module";
import { ModulesContainer } from "@nestjs/core/injector/modules-container";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { BULL_WORKER_DECORATOR, BULL_WORKER_PROCESSOR_DECORATOR } from "./bull.constants";
import { BullWorkerMetadata, BullWorkerProcessMetadata } from "./bull.interfaces";
@Injectable()
export class BullExplorerService {
  constructor(private readonly modulesContainer: ModulesContainer, private readonly metadataScanner: MetadataScanner) {}

  public explore(): BullWorkerMetadata[] {
    const modules = [...this.modulesContainer.values()];
    const workers = this.getWorkers(modules);

    for (const worker of workers) {
      worker.processors = this.getWorkerProcessors(worker);
    }

    return workers;
  }

  private getWorkers(modules: Module[]): BullWorkerMetadata[] {
    const workers: BullWorkerMetadata[] = [];
    const instanceWrappers = modules.map(module => [...module.providers.values()]).reduce((a, b) => a.concat(b), []);

    const classInstanceWrappers = instanceWrappers
      .filter(instanceWrapper => instanceWrapper.instance)
      .filter(({ instance }) => instance.constructor);

    for (const classInstanceWrapper of classInstanceWrappers) {
      const options = Reflect.getMetadata(BULL_WORKER_DECORATOR, classInstanceWrapper.instance.constructor);

      if (options) {
        workers.push({ instance: classInstanceWrapper.instance, options, processors: [] });
      }
    }
    return workers;
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
}
