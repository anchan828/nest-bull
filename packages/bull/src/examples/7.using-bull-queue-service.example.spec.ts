import { Inject, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Job } from 'bull';
import { BULL_MODULE_SERVICE } from '../bull.constants';
import { BullQueue, BullQueueProcess } from '../bull.decorator';
import { BullModule } from '../bull.module';
import { REDIS_HOST } from '../bull.utils.spec';
import { BullService } from '../services/bull.service';

@BullQueue()
export class UsingBullQueueServiceExampleBullQueue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: 'test' });
    return { status: 'ok' };
  }
}

@Injectable()
export class UsingBullQueueServiceExampleService {
  constructor(@Inject(BULL_MODULE_SERVICE) public bullService: BullService) {}

  public async addJob() {
    const queue = this.bullService.getQueue(
      'UsingBullQueueServiceExampleBullQueue',
    );
    return queue!.add({ test: 'test' });
  }
}

@Module({
  providers: [
    UsingBullQueueServiceExampleBullQueue,
    UsingBullQueueServiceExampleService,
  ],
})
export class UsingBullQueueServiceExampleModule {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [__filename],
      options: {
        redis: {
          host: REDIS_HOST,
        },
      },
    }),
    UsingBullQueueServiceExampleModule,
  ],
})
export class ApplicationModule {}

describe('7. Using BullQueueService Example', () => {
  it('test', async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<UsingBullQueueServiceExampleService>(
      UsingBullQueueServiceExampleService,
    );
    expect(service).toBeDefined();
    expect(service.bullService).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({ status: 'ok' });
    await app.close();
  });
});
