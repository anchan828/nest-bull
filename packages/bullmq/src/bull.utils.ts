import { QueueEvents } from "bullmq";

export function getBullQueueToken(name: string): string {
  return `_BullQueue_${name}`;
}

export function createQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, {
    connection: {
      host: process.env.REDIS_HOST,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: parseInt(process.env.REDIS_PORT!),
    },
  });
}

export const wait = async (timer: number): Promise<void> =>
  await new Promise((resolve): any =>
    setTimeout((): void => {
      resolve();
    }, timer),
  );
