import { QueueEvents } from "bullmq";

export function getBullQueueToken(name: string): string {
  return `_BullQueue_${name}`;
}

export async function createQueueEvents(queueName: string): Promise<QueueEvents> {
  const qe = new QueueEvents(queueName, {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!),
    },
  });
  await qe.waitUntilReady();
  return qe;
}

export const wait = async (timer: number): Promise<void> =>
  await new Promise((resolve): any =>
    setTimeout((): void => {
      resolve();
    }, timer),
  );
