import { BullQueueEvent } from './bull.interfaces';

export class BullConstants {
  public static BULL_MODULE = 'BullModule';
  public static BULL_MODULE_OPTIONS = 'BullModuleOptions';
  public static BULL_QUEUE_DECORATOR = 'BullQueue';
  public static BULL_QUEUE_PROCESSOR_DECORATOR = 'BullQueueProcess';
  public static BULL_QUEUE_EVENT_DECORATOR = 'BullQueueEvent';
  public static BULL_QUEUE_HANDLER_NAMES = 'BullQueueHandlerNames';
  public static BULL_QUEUE_DEFAULT_JOB_NAME = '__default__';
  public static BULL_QUEUE_DEFAULT_HANDLER_NAME =
    BullConstants.BULL_QUEUE_DEFAULT_JOB_NAME;
  public static DEFAULT_CONCURRENCY = 1;
}
