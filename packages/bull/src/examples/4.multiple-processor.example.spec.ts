import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bull";
import { BullQueue, BullQueueInject, BullQueueProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { REDIS_HOST } from "../bull.utils.spec";

@BullQueue()
export class MultipleProcessorExampleBullQueue {
  @BullQueueProcess()
  public async process1(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "process1 test" });
    return { status: "process1 ok" };
  }

  @BullQueueProcess()
  public async process2(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "process2 test" });
    return { status: "process2 ok" };
  }
}

@Injectable()
export class MultipleProcessorExampleService {
  constructor(
    @BullQueueInject("MultipleProcessorExampleBullQueue")
    public readonly queue: Queue,
  ) {}

  public async addJobs(): Promise<Job[]> {
    return Promise.all([
      this.queue.add("process1", { test: "process1 test" }),
      this.queue.add("process2", { test: "process2 test" }),
    ]);
  }
}

@Module({
  providers: [MultipleProcessorExampleBullQueue, MultipleProcessorExampleService],
})
export class MultipleProcessorExampleModule {}

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
    MultipleProcessorExampleModule,
  ],
})
export class ApplicationModule {}

describe("4. Multiple Processor Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<MultipleProcessorExampleService>(MultipleProcessorExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const jobs = await service.addJobs();
    expect(jobs).toHaveLength(2);
    await expect(jobs[0].finished()).resolves.toStrictEqual({
      status: "process1 ok",
    });

    await expect(jobs[1].finished()).resolves.toStrictEqual({
      status: "process2 ok",
    });
    await app.close();
  });
});
