import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Job, Queue } from 'bull';
import {
  BullQueue,
  BullQueueInject,
  BullQueueProcess,
} from '../bull.decorator';
import { BullModule } from '../bull.module';

@BullQueue()
export class ParentQueue {
  constructor(
    @BullQueueInject('Child1Queue')
    private readonly child1Queue: Queue,
    @BullQueueInject('Child2Queue')
    private readonly child2Queue: Queue,
  ) {}
  @BullQueueProcess()
  public async process(job: Job): Promise<{ child1: string; child2: string }> {
    const child1Job = await this.child1Queue.add(job.data);
    const child2Job = await this.child2Queue.add(job.data);
    return { ...(await child1Job.finished()), ...(await child2Job.finished()) };
  }
}

@BullQueue()
export class Child1Queue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ child1: string }> {
    expect(job.data).toStrictEqual({ test: 'test' });
    return { child1: 'ok' };
  }
}

@BullQueue()
export class Child2Queue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ child2: string }> {
    expect(job.data).toStrictEqual({ test: 'test' });
    return { child2: 'ok' };
  }
}

@Injectable()
export class ParentChildQueueExampleService {
  constructor(
    @BullQueueInject('ParentQueue')
    public readonly queue: Queue,
  ) {}

  public async addJob() {
    return this.queue.add({ test: 'test' });
  }
}

@Module({
  providers: [
    ParentQueue,
    Child1Queue,
    Child2Queue,
    ParentChildQueueExampleService,
  ],
})
export class ParentChildQueueExampleModule {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [__filename],
    }),
    ParentChildQueueExampleModule,
  ],
})
export class ApplicationModule {}

describe('5. Parent Child Example', () => {
  it('test', async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    const service = app.get<ParentChildQueueExampleService>(
      ParentChildQueueExampleService,
    );
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({
      child1: 'ok',
      child2: 'ok',
    });
  });
});
