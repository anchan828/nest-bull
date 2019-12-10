# @anchan828/nest-bullmq

![npm](https://img.shields.io/npm/v/@anchan828/nest-bullmq.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/nest-bullmq.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/dfb624755d14e1937a3b/maintainability)](https://codeclimate.com/github/anchan828/nest-bull/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/dfb624755d14e1937a3b/test_coverage)](https://codeclimate.com/github/anchan828/nest-bull/test_coverage)

**THIS PACKAGE IS STILL IN DEVELOPMENT!!**

## Road map

This package will merge into @anchan828/nest-bull when bullmq has been released as v4.

## Description

The [BullMQ](https://github.com/taskforcesh/bullmq) module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save @anchan828/nest-bullmq bullmq
```

## Quick Start

### Import BullModule

```ts
import { BullModule } from "@anchan828/nest-bullmq";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    BullModule.forRoot({
      options: {
        connection: {
          host: "127.0.0.1",
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Create queue provider

```ts
import { Module } from "@nestjs/common";
import { ExampleService } from "./example.service";

@Module({
  imports: [BullModule.forQueue(["QueueName"])],
  providers: [ExampleService],
})
export class ExampleModule {}
```

### Inject Queue provider

```ts
import { Inject, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { APP_QUEUE } from "./app.constants";
import { BullQueueInject } from "@anchan828/nest-bullmq";

@Injectable()
export class ExampleService {
  constructor(
    @BullQueueInject(APP_QUEUE)
    private readonly queue: Queue,
  ) {}

  async addJob(): Promise<Job> {
    return this.queue.add("example", { text: "text" });
  }
}
```

### Create worker provider

```ts
import { BullWorker, BullWorkerProcess } from "@anchan828/nest-bullmq";
import { APP_QUEUE } from "./app.constants";

@BullWorker({ queueName: APP_QUEUE })
export class ExampleBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    return { status: "ok" };
  }
}
```

## License

[MIT](LICENSE).
