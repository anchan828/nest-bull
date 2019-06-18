import { ValueProvider } from '@nestjs/common/interfaces';
import { BullName } from '../bull.interfaces';
import { getBullQueueToken } from '../bull.utils';
export const createTestBullProvider = (name: BullName) => {
  let counter = 1;
  return {
    provide: getBullQueueToken(name),
    useValue: {
      add: async (...args: unknown[]) => ({ id: counter++, ...args }),
    },
  } as ValueProvider;
};
