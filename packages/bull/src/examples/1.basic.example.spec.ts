import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bull";
import { BullQueue, BullQueueInject, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";

@BullQueue()
export class BasicExampleBullQueue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@Injectable()
export class BasicExampleService {
  constructor(@BullQueueInject("BasicExampleBullQueue") public readonly queue: Queue) {}

  public async addJob(): Promise<Job<any>> {
    return this.queue.add({ test: "test" });
  }
}

@Module({
  providers: [BasicExampleBullQueue, BasicExampleService],
})
export class BasicExampleModule {}

@Module({
  imports: [
    BullModule.forRoot({
      queues: [__filename],
    }),
    BasicExampleModule,
  ],
})
export class ApplicationModule {}

describe("1. Basic Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<BasicExampleService>(BasicExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({ status: "ok" });
    await app.close();
    console.log("call");
  });
});
