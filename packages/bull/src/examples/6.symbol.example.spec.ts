import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bull";
import { BullQueue, BullQueueInject, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { REDIS_HOST } from "../bull.utils.spec";

const QUEUE_NAME = Symbol("QUEUE_NAME");

@BullQueue({
  name: QUEUE_NAME,
})
export class SymbolExampleBullQueue {
  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@Injectable()
export class SymbolExampleService {
  constructor(@BullQueueInject(QUEUE_NAME) public readonly queue: Queue) {}

  public async addJob(): Promise<Job<any>> {
    return this.queue.add({ test: "test" });
  }
}

@Module({
  providers: [SymbolExampleBullQueue, SymbolExampleService],
})
export class SymbolExampleModule {}

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
    SymbolExampleModule,
  ],
})
export class ApplicationModule {}

describe("6. Symbol Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<SymbolExampleService>(SymbolExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({ status: "ok" });
    await app.close();
  });
});
