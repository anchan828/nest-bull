import { getBullQueueToken } from "./bull.utils";

export const REDIS_HOST = process.env.REDIS_HOST || "localhost";

describe("BullUtil", () => {
  describe("getBullQueueToken", () => {
    it("should return queue token", () => {
      expect(getBullQueueToken("test")).toBe("_BullQueue_test");
    });
  });
});
