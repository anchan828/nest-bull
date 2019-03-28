import { Injectable, Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Test } from '@nestjs/testing';
import { Job, Queue } from 'bull';
import {
  BullQueue,
  BullQueueInject,
  BullQueueProcess,
} from '../bull.decorator';
import { BullJob } from '../bull.interfaces';
import { BullModule } from '../bull.module';

@BullQueue()
export class ExtraJobOptionsBullQueue {
  public called: boolean = false;
  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: 'test' });
    return { status: 'ok' };
  }
}

@Injectable()
export class ExtraJobOptionsService {
  constructor(
    @BullQueueInject('ExtraJobOptionsBullQueue')
    public readonly queue: Queue,
  ) {}

  public async addJob() {
    return this.queue.add({ test: 'test' });
  }
}

@Module({
  providers: [ExtraJobOptionsBullQueue, ExtraJobOptionsService],
})
export class ExtraJobOptionsModule {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [`${__dirname}/3.extra-job-options.example.spec.ts`],
    }),
    ExtraJobOptionsModule,
  ],
})
export class ApplicationModule1 {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [`${__dirname}/3.extra-job-options.example.spec.ts`],
      extra: {
        defaultJobOptions: {
          setTTLOnComplete: 10,
        },
      },
    }),
    ExtraJobOptionsModule,
  ],
})
export class ApplicationModule2 {}

describe('3. Extra Job Options', () => {
  const compileModule = async (metadata: ModuleMetadata) => {
    return Test.createTestingModule(metadata).compile();
  };
  it('should set ttl to -1', async () => {
    const app = await compileModule({
      imports: [ApplicationModule1],
    });
    await app.init();
    const service = app.get<ExtraJobOptionsService>(ExtraJobOptionsService);
    const job = (await service.addJob()) as BullJob;
    await new Promise(resolve => setTimeout(() => resolve(), 500));
    await expect(job.finished()).resolves.toStrictEqual({ status: 'ok' });

    const key = `${job.toKey()}${job.id}`;
    await expect(job.queue.clients[0].ttl(key)).resolves.toBe(-1);
    await app.close();
  });

  it('should set ttl to 10', async () => {
    const app = await compileModule({
      imports: [ApplicationModule2],
    });
    await app.init();
    // await new Promise(resolve => setTimeout(() => resolve(), 500));
    const service = app.get<ExtraJobOptionsService>(ExtraJobOptionsService);
    const job = (await service.addJob()) as BullJob;
    await new Promise(resolve => setTimeout(() => resolve(), 500));
    await expect(job.finished()).resolves.toStrictEqual({ status: 'ok' });
    const ttl = await job.queue.clients[0].ttl(`${job.toKey()}${job.id}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(10);
    await app.close();
  });
});
