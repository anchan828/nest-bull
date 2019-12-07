import { Injectable, Logger, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job } from "bullmq";
import { BullQueue, BullQueueEventProcess, BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { BullService } from "../bull.service";
import { createQueueEvents } from "../bull.utils";
const queueName = "queueName";

@BullQueue({ queueName })
export class TestBullQueue {
  @BullQueueEventProcess("waiting")
  public async process(): Promise<void> {
    Logger.log("waiting job");
  }
}

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
  constructor(public readonly service: BullService) {}

  public async addJob(): Promise<Job> {
    return this.service.queues[queueName]?.add("job", { test: "test" });
  }
}

@Module({
  providers: [TestBullWorker, TestService, TestBullQueue],
})
export class TestModule {}

@Module({
  imports: [
    BullModule.forRoot({
      options: {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT!),
        },
      },
    }),
    TestModule,
  ],
})
export class ApplicationModule {}

// https://docs.bullmq.io/guide/connections
describe("Queue decorator", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<TestService>(TestService);
    expect(service).toBeDefined();
    expect(service.service).toBeDefined();
    const job = await service.addJob();
    await expect(job.waitUntilFinished(createQueueEvents(queueName))).resolves.toStrictEqual({ status: "ok" });
    await app.close();
  });
});
