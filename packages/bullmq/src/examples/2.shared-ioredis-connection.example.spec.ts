import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bullmq";
import IORedis from "ioredis";
import { BullQueueInject, BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { createQueueEvents, wait } from "../bull.utils";
const queueName = "sharedConnectionExample";

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
    return this.queue.add("job", { test: "test" });
  }
}

@Module({
  imports: [BullModule.registerQueue(queueName)],
  providers: [TestBullWorker, TestService],
})
export class TestModule {}

const connection = new IORedis();
@Module({
  imports: [
    BullModule.forRoot({
      options: { connection },
    }),
    TestModule,
  ],
})
export class ApplicationModule {}

// https://docs.bullmq.io/guide/connections
describe("Shared IORedis connection", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<TestService>(TestService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    await wait(1000);

    const job = await service.addJob();
    const events = await createQueueEvents(queueName);
    await expect(job.waitUntilFinished(events)).resolves.toStrictEqual({ status: "ok" });
    await events.close();
    await app.close();
    await connection.quit();
  });
});
