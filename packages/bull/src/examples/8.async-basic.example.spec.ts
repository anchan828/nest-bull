import { Inject, Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job } from "bull";
import { BULL_MODULE_SERVICE } from "../bull.constants";
import { BullQueue, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { BullService } from "../services/bull.service";

@BullQueue()
export class AsyncBasicExampleBullQueue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@Injectable()
export class AsyncBasicExampleService {
  constructor(@Inject(BULL_MODULE_SERVICE) public readonly service: BullService) {}

  public async addJob(): Promise<Job<any>> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.service.getQueue("AsyncBasicExampleBullQueue")!.add({ test: "test" });
  }
}

@Module({
  providers: [AsyncBasicExampleBullQueue, AsyncBasicExampleService],
})
export class AsyncBasicExampleModule {}

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        queues: [__filename],
        options: {
          redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT!),
          },
        },
      }),
    }),
    AsyncBasicExampleModule,
  ],
})
export class ApplicationModule {}

describe("8. Async Basic Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<AsyncBasicExampleService>(AsyncBasicExampleService);
    expect(service).toBeDefined();
    expect(service.service).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({ status: "ok" });
    await app.close();
  });
});
