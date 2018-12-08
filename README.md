# @anchan828/nest-bull

## Description

The [Bull](https://github.com/OptimalBits/bull) module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save @anchan828/nest-bull bull
$ npm i --save-dev @types/bull
```

## Quick Start

### Importing BullModule and Queue component

```ts
import { BullModule } from '@anchan828/nest-bull';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppQueue } from './app.queue';
import { AppService } from './app.service';

@Module({
  imports: [
    BullModule.forRoot({
      queues: [__dirname + '/**/*.queue{.ts,.js}'],
      options: {
        redis: {
          host: '127.0.0.1',
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppQueue],
})
export class AppModule {}
```


### Creating queue class

```ts
import { BullQueue, BullQueueProcess } from '@anchan828/nest-bull';
import { Job } from 'bull';
import { APP_QUEUE } from './app.constants';
import { AppService } from './app.service';

@BullQueue({ name: APP_QUEUE })
export class AppQueue {
  constructor(private readonly service: AppService) {}

  @BullQueueProcess()
  public async process(job: Job) {
    console.log('called process', job.data, this.service.root());
  }
}
```

### Adding job

```ts
import { Controller, Get, Inject } from '@nestjs/common';
import { JobId, Queue } from 'bull';
import { APP_QUEUE } from './app.constants';
import { BullQueueInject } from '@anchan828/nest-bull';

@Controller()
export class AppController {
  constructor(
    @BullQueueInject(APP_QUEUE)
    private readonly queue: Queue,
  ) {}

  @Get()
  async root(): Promise<JobId> {
    const job = await this.queue.add({ text: 'text' });
    return job.id;
  }
}
```

### Override queue settings per queue

```ts
@BullQueue({
  name: APP_QUEUE,
  options: {
    redis: {
      db: 3,
    },
  },
})
export class AppQueue {

  // queue.add('processorName1', data);
  @BullQueueProcess({
    name: 'processorName1',
    concurrency: 3,
  })
  async process1(job: Job) {
    throw new Error(`throw error ${JSON.stringify(job.data)}`);
  }

  // queue.add('processorName2', data);
  @BullQueueProcess({
    name: 'processorName2',
  })
  async process2(job: Job) {
    throw new Error(`throw error ${JSON.stringify(job.data)}`);
  }
}
```

Handling events

```ts
@BullQueue({ name: APP_QUEUE })
export class AppQueue {
  constructor(private readonly service: AppService) {}

  @BullQueueProcess()
  public async process(job: Job) {
    console.log('called process', job.data, this.service.root());
  }

  @BullQueueEventProgress()
  public async progress(job: Job, progress: number) {
    console.log('progress', job.id, progress);
  }

  @BullQueueEventCompleted()
  public async completed(job: Job, result: any) {
    console.log('completed', job.id, result);
  }

  @BullQueueEventFailed()
  public async failed(job: Job, error: Error) {
    console.error('failed', job.id, error);
  }
}
```

See example app: https://github.com/anchan828/nest-bull-example


## License

[MIT](LICENSE).