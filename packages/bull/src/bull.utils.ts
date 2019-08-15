import { isSymbol } from "util";
import { BullName } from "./bull.interfaces";

export function getBullQueueToken(name: BullName): string | symbol {
  if (isSymbol(name)) {
    return name;
  }
  return `_BullQueue_${name}`;
}
