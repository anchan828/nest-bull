import { Injectable } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import { Job, JobOptions } from 'bull';
import { BullName } from '../bull.interfaces';
import { getBullQueueToken } from '../bull.utils';
export const createTestBullProvider = (name: BullName) => {
  return {
    provide: getBullQueueToken(name),
    useClass: BullQueueTestProvider,
  } as ClassProvider;
};

@Injectable()
export class BullQueueTestProvider {
  private counter = 1;

  public async add(data: object, opts?: JobOptions): Promise<Job<any>>;
  public async add(
    name: string | object,
    data: object,
    opts?: JobOptions,
  ): Promise<Job<any>> {
    let addData: any = name;
    if (typeof name === 'string') {
      addData = data;
    }

    return { id: this.counter++, data: addData } as Job;
  }
}
