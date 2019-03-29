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
    const { throwError } = job.data;
    if (throwError) {
      throw new Error('error');
    }
    return { status: 'ok' };
  }
}

@Injectable()
export class ExtraJobOptionsService {
  constructor(
    @BullQueueInject('ExtraJobOptionsBullQueue')
    public readonly queue: Queue,
  ) {}

  public async addJob(throwError: boolean) {
    return this.queue.add({ throwError });
  }
}

@Module({
  providers: [ExtraJobOptionsBullQueue, ExtraJobOptionsService],
})
export class ExtraJobOptionsModule {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [__filename],
      extra: {
        defaultJobOptions: {
          setTTLOnComplete: 10,
          setTTLOnFail: 10,
        },
      },
    }),
    ExtraJobOptionsModule,
  ],
})
export class ApplicationModule {}

describe('3. Extra Job Options', () => {
  const compileModule = async (metadata: ModuleMetadata) => {
    return Test.createTestingModule(metadata).compile();
  };
  const getTTL = async (job: BullJob) => {
    return job.queue.clients[0].ttl(`${job.toKey()}${job.id}`);
  };

  it('should set ttl to 10', async () => {
    const app = await compileModule({
      imports: [ApplicationModule],
    });
    await app.init();
    const service = app.get<ExtraJobOptionsService>(ExtraJobOptionsService);
    const completedJob = (await service.addJob(false)) as BullJob;
    const failedJob = (await service.addJob(true)) as BullJob;
    await expect(completedJob.finished()).resolves.toStrictEqual({
      status: 'ok',
    });
    await expect(failedJob.finished()).rejects.toThrowError('error');
    await new Promise(resolve => {
      const interval = setInterval(async () => {
        if (
          (await getTTL(completedJob)) !== -1 &&
          (await getTTL(failedJob)) !== -1
        ) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    const completedTTL = await getTTL(completedJob);
    expect(completedTTL).toBeGreaterThan(0);
    expect(completedTTL).toBeLessThanOrEqual(10);

    const failedTTL = await getTTL(failedJob);
    expect(failedTTL).toBeGreaterThan(0);
    expect(failedTTL).toBeLessThanOrEqual(10);
    await app.close();
  });
});
