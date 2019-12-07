import { QueueEvents } from "bullmq";

export function getBullQueueToken(name: string): string {
  return `_BullQueue_${name}`;
}

export function createQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, {
    connection: {
      host: process.env.REDIS_HOST,
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
