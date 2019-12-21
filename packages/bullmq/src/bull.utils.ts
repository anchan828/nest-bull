import { QueueBaseOptions, QueueEvents, QueueEventsOptions } from "bullmq";
import * as deepmerge from "deepmerge";
import IORedis = require("ioredis");
export function getBullQueueToken(name: string): string {
  return `_BullQueue_${name}`;
}

export function mergeQueueBaseOptions(...options: (QueueBaseOptions | undefined)[]): QueueBaseOptions {
  const opts = options.filter((x): x is QueueBaseOptions => x !== undefined) as QueueEventsOptions[];
  const obj = deepmerge.all<QueueBaseOptions>(opts);

  if (obj?.connection?.options) {
    // IORedis object, but 'instanceof IORedis' returns false.
    // for now, it uses last connection object.
    obj.connection = opts
      .reverse()
      .map(x => x?.connection)
      .find(connection => connection instanceof IORedis);
  }
  return obj;
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
