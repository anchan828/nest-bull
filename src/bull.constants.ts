import { BullQueueEvent } from './bull.interfaces';

export class BullConstants {
  public static BULL_MODULE = 'BullModule';
  public static BULL_MODULE_OPTIONS = 'BullModuleOptions';
  public static BULL_QUEUE_DECORATOR = 'BullQueue';
  public static BULL_QUEUE_PROCESSOR_DECORATOR = 'BullQueueProcess';
  public static BULL_QUEUE_EVENT_DECORATOR = 'BullQueueEvent';

  public static DEFAULT_CONCURRENCY = 1;
}
