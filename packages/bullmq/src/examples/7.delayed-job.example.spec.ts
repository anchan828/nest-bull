import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bullmq";
import { BullQueueInject, BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { createQueueEvents } from "../bull.utils";

const queueName = "delayedJobExample";

@BullWorker({ queueName })
export class TestBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@Injectable()
export class TestService {
  constructor(@BullQueueInject(queueName) public readonly queue: Queue) {}

  public async addJob(): Promise<Job> {
    return this.queue.add("test", { test: "test" }, { delay: 5000 });
  }
}

@Module({
  imports: [BullModule.registerQueue(queueName)],
  providers: [TestBullWorker, TestService],
})
export class TestModule {}

@Module({
  imports: [BullModule.forRoot({}), TestModule],
})
export class ApplicationModule {}

describe("Basic Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<TestService>(TestService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();
    const start = Date.now();
    await expect(job.waitUntilFinished(await createQueueEvents(queueName))).resolves.toStrictEqual({ status: "ok" });
    expect(Date.now() - start).toBeGreaterThanOrEqual(5000);
    await app.close();
  });
});
