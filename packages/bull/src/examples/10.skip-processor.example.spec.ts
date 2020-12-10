import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Queue } from "bull";
import { BullQueue, BullQueueInject, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { wait } from "../bull.utils.spec";

@BullQueue()
export class SkipProcessorExampleBullQueue {
  @BullQueueProcess({
    skip: true,
  })
  public async process(): Promise<{ status: string }> {
    return { status: "not call" };
  }
}

@Injectable()
export class SkipProcessorExampleService {
  constructor(
    @BullQueueInject("SkipProcessorExampleBullQueue")
    public readonly queue: Queue,
  ) {}
}

@Module({
  providers: [SkipProcessorExampleBullQueue, SkipProcessorExampleService],
})
export class SkipProcessorExampleModule {}
@Module({
  imports: [
    BullModule.forRoot({
      queues: [__filename],
      extra: {
        defaultProcessorOptions: {
          skip: true,
        },
      },
    }),
    SkipProcessorExampleModule,
  ],
})
export class ApplicationModule {}

describe("10. Skip Processor Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<SkipProcessorExampleService>(SkipProcessorExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.queue.add({ data: "test" });

    await wait(2000);

    await expect(job.getState()).resolves.toBe("waiting");

    await app.close();
  });
});
