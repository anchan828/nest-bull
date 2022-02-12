import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job } from "bullmq";
import { BullWorkerListener, BullWorkerListenerArgs } from "..";
import { BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { BullService } from "../bull.service";
import { createQueueEvents, wait } from "../bull.utils";
const queueName = "workerDecoratorExample";
const calledEvents = jest.fn();
@BullWorker({ queueName })
export class TestBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }

  @BullWorkerListener("completed")
  public async completed(job: BullWorkerListenerArgs["completed"]): Promise<void> {
    calledEvents("completed");
    console.debug(`[${job.id}] completed`);
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
  imports: [BullModule.registerQueue(queueName)],
  providers: [TestBullWorker, TestService],
})
export class TestModule {}

@Module({
  imports: [BullModule.forRoot({}), TestModule],
})
export class ApplicationModule {}

// https://docs.bullmq.io/guide/connections
describe("Worker decorator", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<TestService>(TestService);
    expect(service).toBeDefined();
    expect(service.service).toBeDefined();
    const job = await service.addJob();
    await expect(job.waitUntilFinished(await createQueueEvents(queueName))).resolves.toStrictEqual({ status: "ok" });
    await wait(500);
    expect(calledEvents.mock.calls).toEqual([["completed"]]);
    await app.close();
  });
});
