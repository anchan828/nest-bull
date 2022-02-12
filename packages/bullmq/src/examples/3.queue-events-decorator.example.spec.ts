import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bullmq";
import {
  BullQueueEvents,
  BullQueueEventsListener,
  BullQueueInject,
  BullWorker,
  BullWorkerProcess,
} from "../bull.decorator";
import { BullModule } from "../bull.module";
import { BullService } from "../bull.service";
import { wait } from "../bull.utils";
import { BullQueueEventsListenerArgs } from "../interfaces";
const queueName = "queueEventDecoratorExample";
const calledEvents = jest.fn();

@BullWorker({ queueName })
export class TestBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    await wait(500);
    await job.updateProgress(50);
    await wait(500);
    return { status: "ok" };
  }
}

@BullQueueEvents({ queueName })
export class TestBullQueueEvents {
  @BullQueueEventsListener("added")
  public async added(args: BullQueueEventsListenerArgs["added"]): Promise<void> {
    calledEvents("added");
    console.debug(`[${args.jobId}] added`);
  }

  @BullQueueEventsListener("active")
  public async active(args: BullQueueEventsListenerArgs["active"]): Promise<void> {
    calledEvents("active");
    console.debug(`[${args.jobId}] active`);
  }

  @BullQueueEventsListener("cleaned")
  public async cleaned(args: BullQueueEventsListenerArgs["cleaned"]): Promise<void> {
    calledEvents("cleaned");
    console.debug(`[${args.count}] cleaned`);
  }

  @BullQueueEventsListener("completed")
  public async completed(args: BullQueueEventsListenerArgs["completed"]): Promise<void> {
    calledEvents("completed");
    console.debug(`[${args.jobId}] completed`);
  }

  @BullQueueEventsListener("delayed")
  public async delayed(args: BullQueueEventsListenerArgs["delayed"]): Promise<void> {
    calledEvents("delayed");
    console.debug(`[${args.jobId}] delayed`);
  }

  @BullQueueEventsListener("drained")
  public async drained(id: BullQueueEventsListenerArgs["drained"]): Promise<void> {
    calledEvents("drained");
    console.debug(`[${id}] drained`);
  }

  @BullQueueEventsListener("error")
  public async error(error: BullQueueEventsListenerArgs["error"]): Promise<void> {
    calledEvents("error");
    console.debug(`[${error}] error`);
  }

  @BullQueueEventsListener("failed")
  public async failed(args: BullQueueEventsListenerArgs["failed"]): Promise<void> {
    calledEvents("failed");
    console.debug(`[${args.jobId}] failed`);
  }

  @BullQueueEventsListener("paused")
  public async paused(args: BullQueueEventsListenerArgs["paused"]): Promise<void> {
    calledEvents("paused");
    console.debug(`[${args}] paused`);
  }

  @BullQueueEventsListener("progress")
  public async progress(args: BullQueueEventsListenerArgs["progress"]): Promise<void> {
    calledEvents("progress");
    console.debug(`[${args.jobId}] waiting`);
  }

  @BullQueueEventsListener("removed")
  public async removed(args: BullQueueEventsListenerArgs["removed"]): Promise<void> {
    calledEvents("removed");
    console.debug(`[${args.jobId}] removed`);
  }

  @BullQueueEventsListener("waiting")
  public async waiting(args: BullQueueEventsListenerArgs["waiting"]): Promise<void> {
    calledEvents("waiting");
    console.debug(`[${args.jobId}] waiting`);
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
  providers: [TestBullWorker, TestService, TestBullQueueEvents],
})
export class TestModule {}

@Module({
  imports: [BullModule.forRoot({}), TestModule],
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

    const bullService = app.get<BullService>(BullService);
    expect(bullService).toBeDefined();
    const qe = bullService.queueEvents[queueName];
    await expect(job.waitUntilFinished(qe)).resolves.toStrictEqual({ status: "ok" });
    await job.remove();
    await wait(1000);

    expect(calledEvents.mock.calls).toEqual([
      ["added"],
      ["waiting"],
      ["active"],
      ["progress"],
      ["completed"],
      ["drained"],
      ["removed"],
    ]);

    await app.close();
  });
});
