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

describe("BullUtil", () => {
  describe("getBullQueueToken", () => {
    it("should return queue token", () => {
      expect(getBullQueueToken("test")).toBe("_BullQueue_test");
    });
  });
});
