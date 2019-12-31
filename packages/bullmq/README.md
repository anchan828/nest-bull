# @anchan828/nest-bullmq

![npm](https://img.shields.io/npm/v/@anchan828/nest-bullmq.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/nest-bullmq.svg)

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
import { APP_QUEUE } from "./app.constants";

@Module({
  imports: [BullModule.registerQueue(APP_QUEUE)],
  providers: [ExampleService],
})
export class ExampleModule {}
```

#### With queue options

```ts
import { Module } from "@nestjs/common";
import { ExampleService } from "./example.service";
import { APP_QUEUE } from "./app.constants";

@Module({
  imports: [
    BullModule.registerQueue({
      queueName,
      options: {
        defaultJobOptions: { priority: 1 },
      },
    }),
  ],
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

## Examples

There are [examples](./examples).

## License

[MIT](LICENSE)
