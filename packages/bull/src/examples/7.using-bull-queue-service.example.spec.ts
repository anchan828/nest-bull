import { Inject, Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job } from "bull";
import { BULL_MODULE_SERVICE } from "../bull.constants";
import { BullQueue, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { BullService } from "../services/bull.service";

@BullQueue()
export class UsingBullQueueServiceExampleBullQueue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@Injectable()
export class UsingBullQueueServiceExampleService {
  constructor(@Inject(BULL_MODULE_SERVICE) public bullService: BullService) {}

  public async addJob(): Promise<Job<any>> {
    const queue = this.bullService.getQueue("UsingBullQueueServiceExampleBullQueue");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return queue!.add({ test: "test" });
  }
}

@Module({
  providers: [UsingBullQueueServiceExampleBullQueue, UsingBullQueueServiceExampleService],
})
export class UsingBullQueueServiceExampleModule {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [__filename],
      options: {
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT!),
        },
      },
    }),
    UsingBullQueueServiceExampleModule,
  ],
})
export class ApplicationModule {}

describe("7. Using BullQueueService Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<UsingBullQueueServiceExampleService>(UsingBullQueueServiceExampleService);
    expect(service).toBeDefined();
    expect(service.bullService).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({ status: "ok" });
    await app.close();
  });
});
