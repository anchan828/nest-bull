import { isSymbol } from 'util';
import { BullName } from './bull.interfaces';

export function getBullQueueToken(name: BullName) {
  if (isSymbol(name)) {
    return name;
  }
  return `_BullQueue_${name}`;
}
