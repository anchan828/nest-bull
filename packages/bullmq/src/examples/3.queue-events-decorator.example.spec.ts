import { Injectable, Logger, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bullmq";
import {
  BullQueueEventProcess,
  BullQueueEvents,
  BullQueueInject,
  BullWorker,
  BullWorkerProcess,
} from "../bull.decorator";
import { BullModule } from "../bull.module";
import { createQueueEvents, wait } from "../bull.utils";
const queueName = "queueName";

@BullWorker({ queueName })
export class TestBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@BullQueueEvents({ queueName })
export class TestBullQueueEvents {
  @BullQueueEventProcess("waiting")
  public async process(job: Job): Promise<void> {
    Logger.log(job);
  }
}

@Injectable()
export class TestService {
  constructor(@BullQueueInject(queueName) public readonly queue: Queue) {}

  public async addJob(): Promise<Job> {
    return this.queue.add("job", { test: "test" });
  }
}

@Module({
  imports: [BullModule.forQueue([queueName])],
  providers: [TestBullWorker, TestService, TestBullQueueEvents],
})
export class TestModule {}

@Module({
  imports: [
    BullModule.forRoot({
      options: {
        connection: {
          host: process.env.REDIS_HOST,
        },
      },
    }),
    TestModule,
  ],
})
export class ApplicationModule {}

// https://docs.bullmq.io/guide/connections
describe("QueueEvents decorator", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<TestService>(TestService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();
    await expect(job.waitUntilFinished(createQueueEvents(queueName))).resolves.toStrictEqual({ status: "ok" });
    await wait(1000);
    await app.close();
  });
});
