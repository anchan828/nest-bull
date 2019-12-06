import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Job, Queue } from "bullmq";
import { BullQueueInject, BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { createQueueEvents, REDIS_HOST } from "../bull.utils.spec";

const queueName = "queueName";

@BullWorker({ queueName })
export class BasicExampleBullQueue {
  @BullWorkerProcess()
  public async process1(job: Job): Promise<{ status: string }> {
    expect(job.data).toStrictEqual({ test: "test" });
    return { status: "ok" };
  }
}

@Injectable()
export class BasicExampleService {
  constructor(@BullQueueInject(queueName) public readonly queue: Queue) {}

  public async addJob(): Promise<Job> {
    return this.queue.add("job", { test: "test" });
  }
}

@Module({
  imports: [BullModule.forQueue([queueName])],
  providers: [BasicExampleBullQueue, BasicExampleService],
})
export class BasicExampleModule {}

@Module({
  imports: [
    BullModule.forRoot({
      options: {
        connection: {
          host: REDIS_HOST,
        },
      },
    }),
    BasicExampleModule,
  ],
})
export class ApplicationModule {}

describe("1. Basic Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<BasicExampleService>(BasicExampleService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();
    const job = await service.addJob();

    await expect(job.waitUntilFinished(createQueueEvents(queueName))).resolves.toStrictEqual({ status: "ok" });
    await app.close();
  });
});
