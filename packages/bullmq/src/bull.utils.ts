import { QueueBaseOptions, QueueEvents, QueueEventsOptions } from "bullmq";
import Redis from "ioredis";

export function getBullQueueToken(name: string): string {
  return `_BullQueue_${name}`;
}

export function mergeQueueBaseOptions(...options: (QueueBaseOptions | undefined)[]): QueueBaseOptions {
  const opts = options.filter((x): x is QueueBaseOptions => x !== undefined) as QueueEventsOptions[];
  const obj = Object.assign({}, ...opts);

  if (obj?.connection?.options) {
    // IORedis object, but 'instanceof Redis' returns false.
    // for now, it uses last connection object.
    obj.connection = opts
      .reverse()
      .map((x) => x?.connection)
      .find((connection) => connection instanceof Redis);
  }

  return obj;
}

export async function createQueueEvents(queueName: string): Promise<QueueEvents> {
  const qe = new QueueEvents(queueName);
  await qe.waitUntilReady();
  return qe;
}

export const wait = async (timer: number): Promise<void> =>
  await new Promise((resolve): any =>
    setTimeout((): void => {
      resolve();
    }, timer),
  );
