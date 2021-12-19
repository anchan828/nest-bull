import { createQueueEventsMock, createQueueMock, createWorkerMock } from "./bull.mock";

describe("createQueueMock", () => {
  it("should return mock object", () => {
    expect(createQueueMock("test", {})).toStrictEqual({
      add: expect.any(Function),
      addBulk: expect.any(Function),
      name: "test",
      on: expect.any(Function),
      waitUntilReady: expect.any(Function),
      opts: {},
    });
  });

  it("should call mock functions", async () => {
    const queue = createQueueMock("test", {});

    await queue.add("test", {});
    await queue.addBulk([
      { name: "test1", data: {}, opts: {} },
      { name: "test2", data: {}, opts: {} },
    ]);
    queue.on("test", () => {
      console.log(test);
    });
  });
});

describe("createWorkerMock", () => {
  it("should return mock object", () => {
    expect(createWorkerMock("test")).toStrictEqual({
      name: "test",
      on: expect.any(Function),
      waitUntilReady: expect.any(Function),
    });
  });

  it("should call mock functions", () => {
    const worker = createWorkerMock("test");
    worker.on("active", () => {
      console.log(test);
    });
  });
});

describe("createQueueEventsMock", () => {
  it("should return mock object", () => {
    expect(createQueueEventsMock("test")).toStrictEqual({
      name: "test",
      on: expect.any(Function),
      waitUntilReady: expect.any(Function),
    });
  });

  it("should call mock functions", () => {
    const queueEvent = createQueueEventsMock("test");
    queueEvent.on("active", () => {
      console.log(test);
    });
  });
});

describe("createJobMock", () => {
  it("should return mock object", async () => {
    await expect(createQueueMock("test", {}).add("test", {})).resolves.toBeDefined();
  });

  it("should call mock functions", async () => {
    const job = await createQueueMock("test", {}).add("test", {});
    await job.waitUntilFinished(createQueueEventsMock("test"));
    await expect(job.isCompleted()).resolves.toBeTruthy();
    await expect(job.isFailed()).resolves.toBeTruthy();
    await expect(job.isActive()).resolves.toBeTruthy();
    await expect(job.isWaiting()).resolves.toBeFalsy();
    await expect(job.getState()).resolves.toBe("completed");
    await expect(job.remove()).resolves.toBeUndefined();
  });
});
