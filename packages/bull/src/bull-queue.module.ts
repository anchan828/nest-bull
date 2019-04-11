import { Module } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { BullQueueEventExplorerService } from './services/explorers/event-explorer.service';
import { BullQueueProcessorExplorerService } from './services/explorers/processor-explorer.service';

@Module({
  providers: [
    MetadataScanner,
    BullQueueProcessorExplorerService,
    BullQueueEventExplorerService,
  ],
})
export class BullQueueModule {
  constructor(
    private readonly processorExplorer: BullQueueProcessorExplorerService,
    private readonly eventExplorer: BullQueueEventExplorerService,
  ) {
    this.processorExplorer.explore();
    this.eventExplorer.explore();
  }
}
