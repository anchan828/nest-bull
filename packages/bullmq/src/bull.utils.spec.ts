import { QueueEvents } from "bullmq";
import { getBullQueueToken } from "./bull.utils";

export const REDIS_HOST = process.env.REDIS_HOST || "localhost";

export function createQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, {
    connection: {
      host: REDIS_HOST,
    },
  });
}

export const wait = async (timer: number): Promise<void> =>
  await new Promise(
    (resolve): NodeJS.Timeout =>
      setTimeout((): void => {
        resolve();
      }, timer),
  );

describe("BullUtil", () => {
  describe("getBullQueueToken", () => {
    it("should return queue token", () => {
      expect(getBullQueueToken("test")).toBe("_BullQueue_test");
    });
  });
});
