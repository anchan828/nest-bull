import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job } from "bullmq";
import { BullQueueListenerArgs } from "..";
import { BullQueue, BullQueueListener, BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { BullService } from "../bull.service";
import { createQueueEvents, wait } from "../bull.utils";
const queueName = "queueDecoratorExample";
const calledEvents = jest.fn();

@BullQueue({ queueName })
export class TestBullQueue {
  @BullQueueListener("waiting")
  public async waiting(job: BullQueueListenerArgs["waiting"]): Promise<void> {
    calledEvents("waiting");
    console.debug(`[${job.id}] waiting`);
  }
}

@BullWorker({ queueName })
export class TestBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });

    await job.updateProgress(50);
    await wait(500);
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
  imports: [BullModule.forRoot({}), TestModule],
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
    const events = await createQueueEvents(queueName);
    await expect(job.waitUntilFinished(events)).resolves.toStrictEqual({ status: "ok" });
    await events.close();
    expect(calledEvents.mock.calls).toEqual([["waiting"]]);

    await app.close();
  });
});
