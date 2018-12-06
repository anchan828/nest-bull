# nest-bull

## Description

The [Bull](https://github.com/OptimalBits/bull) module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save @anchan828/nest-bull bull
$ npm i --save-dev @types/bull
```

## Quick Start

### Importing BullModule.

```
import { BullModule } from '@anchan828/nest-bull';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
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
  providers: [AppService],
})
export class AppModule {}
```


### Creating queue class

```
import { BullQueue, BullQueueProcessor } from '@anchan828/nest-bull';
import { Job } from 'bull';
import { APP_QUEUE } from './app.constants';

@BullQueue({ name: APP_QUEUE })
export class AppQueue {
  @BullQueueProcessor()
  async process(job: Job) {
    console.log('called process', job.data);
  }
}
```

### Adding job

```
import { Controller, Get, Inject } from '@nestjs/common';
import { JobId, Queue } from 'bull';
import { APP_QUEUE } from './app.constants';

@Controller()
export class AppController {
  constructor(
    @Inject(APP_QUEUE)
    private readonly queue: Queue,
  ) {}

  @Get()
  async root(): Promise<JobId> {
    const job = await this.queue.add({ text: 'text' });
    return job.id;
  }
}
```

See example app: https://github.com/anchan828/nest-bull-example


## License

Nest is [MIT licensed](LICENSE).