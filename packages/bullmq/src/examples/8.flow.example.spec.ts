import { Injectable, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FlowProducer, Job, JobNode, Queue } from "bullmq";
import { BullQueueInject, BullWorker, BullWorkerProcess } from "../bull.decorator";
import { BullModule } from "../bull.module";
import { createQueueEvents } from "../bull.utils";

const queueName = "queueName";

const results: string[] = [];

@BullWorker({ queueName })
export class TestBullWorker {
  @BullWorkerProcess()
  public async process(job: Job): Promise<{ status: string }> {
    results.push(job.data);
    return { status: "ok" };
  }
}

@Injectable()
export class TestService {
  constructor(@BullQueueInject(queueName) public readonly queue: Queue) {}

  public async addFlow(): Promise<JobNode> {
    const flow = new FlowProducer({});
    return flow.add({
      name: "flow-test",
      data: "parent-data",
      queueName,
      children: [
        {
          name: "child-job",
          data: "child-data",
          queueName,
          children: [{ name: "child-job", data: "child-child-data", queueName }],
        },
      ],
    });
  }
}

@Module({
  imports: [BullModule.registerQueue(queueName)],
  providers: [TestBullWorker, TestService],
})
export class TestModule {}

@Module({
  imports: [BullModule.forRootAsync({}), TestModule],
})
export class ApplicationModule {}

describe("Flow Example", () => {
  it("test", async () => {
    const app = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    await app.init();
    const service = app.get<TestService>(TestService);
    expect(service).toBeDefined();
    expect(service.queue).toBeDefined();

    const jobNode = await service.addFlow();

    await expect(jobNode.job.waitUntilFinished(await createQueueEvents(queueName))).resolves.toStrictEqual({
      status: "ok",
    });

    expect(results).toEqual(["child-child-data", "child-data", "parent-data"]);

    await app.close();
  });
});
