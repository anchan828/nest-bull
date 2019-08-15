import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bull";
import { BullQueue, BullQueueEventCompleted, BullQueueInject, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { REDIS_HOST, wait } from "../bull.utils.spec";

@BullQueue()
export class EventExampleBullQueue {
  public called = false;

  @BullQueueProcess()
  public async process(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }

  @BullQueueEventCompleted()
  public completed(): void {
    this.called = true;
  }
}

@Injectable()
export class EventExampleService {
  constructor(
    @BullQueueInject("EventExampleBullQueue")
    public readonly queue: Queue,
  ) {}

  public async addJob(): Promise<Job<any>> {
    return this.queue.add({ test: "test" });
  }
}

@Module({
  providers: [EventExampleBullQueue, EventExampleService],
})
export class EventExampleModule {}

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
    EventExampleModule,
  ],
})
export class ApplicationModule {}

describe("2. Event Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    await app.init();

    const queueClass = app.get<EventExampleBullQueue>(EventExampleBullQueue);
    expect(queueClass.called).toBeFalsy();
    const service = app.get<EventExampleService>(EventExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();
    await expect(job.finished()).resolves.toStrictEqual({ status: "ok" });
    await wait(100);
    expect(queueClass.called).toBeTruthy();
    await app.close();
  });
});
