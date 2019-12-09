import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Queue } from "bull";
import { BullQueue, BullQueueInject, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { wait } from "../bull.utils.spec";

@BullQueue()
export class MockExampleBullQueue {
  @BullQueueProcess()
  public async process(): Promise<{ status: string }> {
    return { status: "not call" };
  }
}

@Injectable()
export class MockExampleService {
  constructor(@BullQueueInject("MockExampleBullQueue") public readonly queue: Queue) {}
}

@Module({
  providers: [MockExampleBullQueue, MockExampleService],
})
export class MockExampleModule {}
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
      extra: {
        defaultJobOptions: {
          setTTLOnComplete: 10,
        },
      },
      mock: true,
    }),
    MockExampleModule,
  ],
})
export class ApplicationModule {}

describe("9. Mock Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<MockExampleService>(MockExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.queue.add({ data: "test" });
    expect(job).toStrictEqual({ data: "test" });
    await wait(100);
    await app.close();
  });
});
